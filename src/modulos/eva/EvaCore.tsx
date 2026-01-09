
import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Icons } from '../../components/Icons';
import { subscribeToTicker, subscribeToDepth, executeOrder, getCandles } from '../../services/binanceService';
import { BinanceConfig } from '../../types';
import { calculateRSI } from '../../utils/neuralMath';

type ChartType = 'CANDLES' | 'LINE' | 'AREA' | 'BARS';

interface EvaCoreProps {
    config: BinanceConfig;
    logs: string[];
    onLog: (msg: string, type?: 'INFO' | 'WARN' | 'EXEC' | 'SYS') => void;
    totalLiquidity?: number; // Nueva Prop para validar fondos
}

export const EvaCore = ({ config, logs, onLog, totalLiquidity = 0 }: EvaCoreProps) => {
  // --- ESTADO DE ACTIVO (MONEDA) ---
  const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');

  // --- ESTADO DE DATOS DE MERCADO REALES ---
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [volume, setVolume] = useState('0');
  const [liveRsi, setLiveRsi] = useState(50);
  
  // --- ESTADO DEL GRÁFICO ---
  const [chartType, setChartType] = useState<ChartType>('CANDLES');
  const [is3DMode, setIs3DMode] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const candleDataRef = useRef<any[]>([]); // Referencia mutable para alta frecuencia

  // --- ESTADO DE EJECUCIÓN DEL BOT ---
  const [isSystemActive, setIsSystemActive] = useState(false); // INTERRUPTOR MAESTRO
  const [systemError, setSystemError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false); // Bloqueo durante llamadas API
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [showNoFundsModal, setShowNoFundsModal] = useState(false); // MODAL DE SIN FONDOS
  
  // --- ESTADO DEL ORDER BOOK (L2 DATA) ---
  const [asks, setAsks] = useState<{price: number, size: number, total: number, relativeSize: number}[]>([]);
  const [bids, setBids] = useState<{price: number, size: number, total: number, relativeSize: number}[]>([]);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const lastTradeTimeRef = useRef<number>(0);

  // --- 1. GESTIÓN DEL SISTEMA (START/STOP) ---
  const handleToggleSystem = async () => {
      setSystemError(null);

      if (isSystemActive) {
          setIsSystemActive(false);
          onLog("SYSTEM_HALT: Protocolo detenido por el usuario.", 'WARN');
          return;
      }

      // Validación de Seguridad antes de iniciar
      onLog("SYS_CHECK: Verificando credenciales API...", 'SYS');
      setExecuting(true);
      
      // Pequeña espera técnica para UI
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!config.apiKey || !config.apiSecret || config.apiKey.length < 10) {
          const err = "ERROR CRÍTICO: API Keys no configuradas o inválidas.";
          setSystemError(err);
          onLog(err, 'WARN');
          setExecuting(false);
          return;
      }

      // --- NUEVA VALIDACIÓN: VERIFICAR FONDOS ---
      // Verificamos si la liquidez es menor a un umbral operativo mínimo (ej. 5 USDT)
      if (totalLiquidity < 5) {
          setExecuting(false);
          setShowNoFundsModal(true); // Activar ventana flotante
          onLog("CRITICAL: Intento de inicio abortado. Liquidez insuficiente en Binance.", 'WARN');
          return;
      }

      setExecuting(false);
      setIsSystemActive(true);
      onLog(`SYSTEM_START: Motor de Trading ONLINE en ${activeSymbol}. Escaneando mercado...`, 'EXEC');
  };

  // --- 2. BUCLE DE TRADING (HEARTBEAT) ---
  useEffect(() => {
    let heartbeatInterval: any;

    if (isSystemActive) {
        // Ejecuta la lógica de decisión cada 3 segundos
        heartbeatInterval = setInterval(async () => {
            if (executing || candleDataRef.current.length < 20) return;

            const candles = candleDataRef.current;
            const closePrices = candles.map(c => c.close);
            const currentRSI = calculateRSI(closePrices, 14);
            setLiveRsi(currentRSI);

            const lastClose = closePrices[closePrices.length - 1];
            const now = Date.now();
            // Cooldown de 60 segundos entre operaciones automáticas
            const COOLDOWN = 60000; 

            // Lógica de Trading Autónoma
            if (config.autonomousMode && (now - lastTradeTimeRef.current > COOLDOWN)) {
                
                // ESTRATEGIA: RSI SOBREVENTA (COMPRA)
                if (currentRSI < 30) {
                    onLog(`SIGNAL: RSI ${currentRSI.toFixed(2)} (Sobreventa). Iniciando COMPRA en ${activeSymbol}.`, 'EXEC');
                    await performAutoTrade('BUY');
                }
                
                // ESTRATEGIA: RSI SOBRECOMPRA (VENTA)
                else if (currentRSI > 70) {
                    onLog(`SIGNAL: RSI ${currentRSI.toFixed(2)} (Sobrecompra). Iniciando VENTA en ${activeSymbol}.`, 'EXEC');
                    await performAutoTrade('SELL');
                }
            } else if (Math.random() > 0.9) {
                // Log de latido ocasional
                onLog(`SCAN: ${activeSymbol} @ ${lastClose} | RSI: ${currentRSI.toFixed(2)}`, 'INFO');
            }

        }, 3000);
    }

    return () => clearInterval(heartbeatInterval);
  }, [isSystemActive, config.autonomousMode, executing, activeSymbol]);

  // Función de ejecución automática
  const performAutoTrade = async (side: 'BUY' | 'SELL') => {
      setExecuting(true);
      try {
          // Cantidad segura fija para evitar errores de cálculo en demo real
          const quantity = activeSymbol === 'BTCUSDT' ? 0.0002 : 10; // Ejemplo simple
          
          onLog(`AUTO_EXEC: Enviando orden ${side} MARKET (${quantity} ${activeSymbol.replace('USDT','')})...`, 'EXEC');
          
          const result = await executeOrder(config.apiKey, config.apiSecret, activeSymbol, side, quantity);
          
          lastTradeTimeRef.current = Date.now();
          setLastOrder(`AUTO-${result.orderId}`);
          onLog(`SUCCESS: Orden ${result.orderId} completada. Costo: ${result.cummulativeQuoteQty}`, 'SYS');
      } catch (e: any) {
          onLog(`FAIL: Error en orden automática: ${e.message}`, 'WARN');
      } finally {
          setExecuting(false);
      }
  };

  // --- 3. INICIALIZACIÓN DE GRÁFICO (LIGHTWEIGHT CHARTS) ---
  useEffect(() => {
    if (!chartContainerRef.current) return;
    let isCleanedUp = false;

    // Configuración del gráfico
    const chart = createChart(chartContainerRef.current, {
        layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#94a3b8',
        },
        grid: {
            vertLines: { color: '#1e293b' },
            horzLines: { color: '#1e293b' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 450,
        crosshair: { mode: CrosshairMode.Normal },
        timeScale: { borderColor: '#334155', timeVisible: true },
        rightPriceScale: { borderColor: '#334155' },
    });
    
    chartApiRef.current = chart;

    const initSeries = (type: ChartType, data: any[]) => {
        if (isCleanedUp || !chartApiRef.current) return;
        
        // Limpiar serie anterior si existe
        if (seriesRef.current) {
            try { chart.removeSeries(seriesRef.current); } catch(e){}
        }

        let newSeries;
        if (type === 'CANDLES') {
            newSeries = chart.addCandlestickSeries({
                upColor: '#10b981', downColor: '#f43f5e', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#f43f5e',
            });
        } else if (type === 'LINE') {
            newSeries = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2 });
        } else if (type === 'AREA') {
            newSeries = chart.addAreaSeries({ lineColor: '#8b5cf6', topColor: 'rgba(139, 92, 246, 0.4)', bottomColor: 'rgba(139, 92, 246, 0.0)' });
        } else {
            newSeries = chart.addBarSeries({ upColor: '#10b981', downColor: '#f43f5e' });
        }

        newSeries.setData(data);
        seriesRef.current = newSeries;
        chart.timeScale().fitContent();
    };

    // Cargar historial real dinámico
    const loadData = async () => {
        try {
            const rawCandles = await getCandles(activeSymbol, '15m', 100);
            if (isCleanedUp) return;
            
            const formatted = rawCandles.map(c => ({
                time: c.time / 1000,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                value: c.close // Para gráficos de línea
            }));
            
            candleDataRef.current = formatted;
            initSeries(chartType, formatted);
            
            if (formatted.length > 0) {
                setCurrentPrice(formatted[formatted.length-1].close);
                onLog(`CHART_SYNC: Datos históricos de ${activeSymbol} cargados.`, 'INFO');
            }
        } catch (e) {
            if(!isCleanedUp) onLog(`ERROR: Fallo al cargar velas de ${activeSymbol}.`, 'WARN');
        }
    };

    loadData();

    // Resize observer
    const handleResize = () => {
        if(chartContainerRef.current && chartApiRef.current) {
            chartApiRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
        isCleanedUp = true;
        window.removeEventListener('resize', handleResize);
        if (chartApiRef.current) {
            chartApiRef.current.remove();
            chartApiRef.current = null;
        }
    };
  }, [chartType, activeSymbol]); 

  // --- 4. CONEXIÓN WEBSOCKETS (TICKER Y PROFUNDIDAD) ---
  useEffect(() => {
    // Ticker para precio y actualización de velas
    const tickerWs = subscribeToTicker(activeSymbol, (data) => {
        setCurrentPrice(data.price);
        setPriceChange(data.change24h);
        setVolume(data.volume);

        // Actualizar vela en tiempo real en el gráfico
        if (chartApiRef.current && seriesRef.current && candleDataRef.current.length > 0) {
            const lastCandle = candleDataRef.current[candleDataRef.current.length - 1];
            const updatedCandle = {
                ...lastCandle,
                close: data.price,
                high: Math.max(lastCandle.high, data.price),
                low: Math.min(lastCandle.low, data.price),
                value: data.price
            };
            seriesRef.current.update(updatedCandle);
            candleDataRef.current[candleDataRef.current.length - 1] = updatedCandle;
        }
    });

    // Depth para Libro de Órdenes
    const depthWs = subscribeToDepth(activeSymbol, (data) => {
        // Procesamos solo los top 14 para visualización
        const processBook = (list: any[]) => list.slice(0, 14).map(item => ({
            price: item.price,
            size: item.size,
            total: item.price * item.size,
            relativeSize: Math.min((item.size * item.price / (currentPrice * 0.5)) * 100, 100) // Dinámico según precio
        }));

        setAsks(processBook(data.asks));
        setBids(processBook(data.bids));
    });

    return () => {
        tickerWs.close();
        depthWs.close();
    };
  }, [activeSymbol]); 

  // --- 5. EJECUCIÓN MANUAL ---
  const handleManualTrade = async (side: 'BUY' | 'SELL') => {
      if (!isSystemActive) {
          onLog("ERROR: Debe iniciar el sistema antes de operar.", 'WARN');
          return;
      }
      setExecuting(true);
      try {
          const qty = activeSymbol === 'BTCUSDT' ? 0.0002 : 10; // Simple switch para demo
          onLog(`MANUAL_ORDER: Enviando ${side} ${qty} en ${activeSymbol}...`, 'EXEC');
          const res = await executeOrder(config.apiKey, config.apiSecret, activeSymbol, side, qty);
          setLastOrder(`MAN-${res.orderId}`);
          onLog(`SUCCESS: Orden manual ejecutada.`, 'SYS');
      } catch (e: any) {
          onLog(`FAIL: ${e.message}`, 'WARN');
      } finally {
          setExecuting(false);
      }
  };

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Helper para formatear par (BTCUSDT -> BTC / USDT)
  const formatPair = (symbol: string) => {
      if (symbol.endsWith('USDT')) return `${symbol.replace('USDT', '')} / USDT`;
      if (symbol.endsWith('BTC')) return `${symbol.replace('BTC', '')} / BTC`;
      if (symbol.endsWith('ETH')) return `${symbol.replace('ETH', '')} / ETH`;
      return symbol;
  };

  const isPositive = priceChange >= 0;

  return (
    <div className="flex flex-col h-full bg-[#050b14] font-mono text-slate-300 relative overflow-y-auto custom-scrollbar">
        {/* FONDO TÁCTICO */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.5)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none min-h-screen"></div>

        {/* --- MODAL DE ERROR DE FONDOS (SOLICITADO) --- */}
        {showNoFundsModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border-2 border-rose-600 rounded-xl max-w-sm w-full shadow-[0_0_50px_rgba(225,29,72,0.4)] relative p-6 text-center transform scale-100 animate-in zoom-in-95">
                    {/* Botón X de Cierre */}
                    <button 
                        onClick={() => setShowNoFundsModal(false)}
                        className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    
                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                        <span className="text-rose-500 transform scale-150"><Icons.Alert /></span>
                    </div>

                    <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Acceso Denegado</h2>
                    <div className="h-1 w-16 bg-rose-600 mx-auto mb-4"></div>
                    
                    <p className="text-slate-300 text-sm mb-2">
                        EVA ha detectado fondos insuficientes en su cuenta de Binance.
                    </p>
                    <p className="text-rose-400 text-xs font-mono mb-6 bg-rose-950/30 p-2 rounded border border-rose-900/50">
                        ERROR: LIQUIDITY_BELOW_THRESHOLD
                    </p>

                    <button 
                        onClick={() => setShowNoFundsModal(false)}
                        className="w-full py-3 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-rose-900/20 text-xs tracking-wider"
                    >
                        CERRAR ADVERTENCIA
                    </button>
                </div>
            </div>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-[#050b14]/90 backdrop-blur z-20 sticky top-0">
            <div className="flex items-center gap-4">
                <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white"><Icons.Binance /></div>
                <div>
                    {/* PAR DE DIVISAS DINÁMICO */}
                    <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2 uppercase">
                        {formatPair(activeSymbol)} 
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">REAL TIME</span>
                    </h1>
                    <div className="flex gap-3 text-xs mt-1">
                        <span className="text-slate-500">Vol 24h: <span className="text-slate-300">{parseFloat(volume).toLocaleString()}</span></span>
                        <span className="text-slate-500">Estado: <span className={isSystemActive ? "text-emerald-400 animate-pulse" : "text-slate-500"}>{isSystemActive ? 'ONLINE' : 'OFFLINE'}</span></span>
                    </div>
                </div>
            </div>
            <div className="flex gap-6 items-center text-right">
                 {/* Selector de Moneda Rápido (Oculto en móvil, visible en Desktop) */}
                 <div className="hidden lg:flex gap-2 mr-4">
                    {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'TRXUSDT'].map(sym => (
                        <button 
                            key={sym} 
                            onClick={() => setActiveSymbol(sym)}
                            className={`px-2 py-1 text-[10px] rounded border ${activeSymbol === sym ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-800 text-slate-500 hover:text-white'}`}
                        >
                            {sym.replace('USDT', '')}
                        </button>
                    ))}
                 </div>

                 <div className="hidden md:block">
                    <div className="text-[10px] text-slate-500 uppercase">RSI (14)</div>
                    <div className={`text-xl font-bold ${liveRsi < 30 ? 'text-emerald-400' : liveRsi > 70 ? 'text-rose-400' : 'text-blue-400'}`}>
                        {liveRsi.toFixed(2)}
                    </div>
                 </div>
                 <div>
                    <div className="text-[10px] text-slate-500 uppercase">Precio Actual</div>
                    <div className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                 </div>
            </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col lg:flex-row relative z-10 p-4 gap-4 min-h-0">
            
            {/* ZONA IZQUIERDA: GRÁFICO + CONTROLES */}
            <div className="flex-[3] flex flex-col gap-4 min-w-0">
                {/* 1. GRÁFICO */}
                <div className="chart-3d-wrapper relative z-20">
                    <div className={`flex-1 bg-slate-900/40 border border-slate-800 rounded-xl relative overflow-hidden shadow-2xl min-h-[450px] flex flex-col ${is3DMode ? 'chart-3d-active bg-slate-900/80' : ''}`}>
                        <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm z-30">
                            <div className="flex gap-1">
                                {(['CANDLES', 'LINE', 'AREA', 'BARS'] as ChartType[]).map((t) => (
                                    <button key={t} onClick={() => setChartType(t)} className={`px-3 py-1 rounded text-[10px] font-bold ${chartType === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setIs3DMode(!is3DMode)} className={`px-3 py-1 rounded text-[10px] font-bold border ${is3DMode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500' : 'border-slate-700 text-slate-400'}`}>
                                {is3DMode ? '3D ON' : '3D OFF'}
                            </button>
                        </div>
                        <div className="relative flex-1 w-full h-full bg-slate-950/20" ref={chartContainerRef}></div>
                    </div>
                </div>

                {/* 2. PANEL DE CONTROL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SWITCH PRINCIPAL */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-4"><Icons.Bot /> CONTROL DE MISIÓN</h3>
                        <button 
                            onClick={handleToggleSystem}
                            disabled={executing}
                            className={`w-full py-4 rounded-lg font-black text-sm tracking-widest flex items-center justify-center gap-3 border shadow-lg transition-all ${
                                isSystemActive 
                                ? 'bg-rose-900/20 text-rose-500 border-rose-500/50 hover:bg-rose-900/40' 
                                : 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500'
                            }`}
                        >
                            {executing ? <span className="animate-pulse">PROCESANDO...</span> : isSystemActive ? 'DETENER MOTOR' : 'INICIAR PROTOCOLO'}
                        </button>
                        {systemError && <div className="mt-2 text-[10px] text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-500/30 flex items-center gap-2"><Icons.Alert /> {systemError}</div>}
                    </div>

                    {/* OPERATIVA MANUAL */}
                    <div className={`bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between ${!isSystemActive ? 'opacity-50 pointer-events-none' : ''}`}>
                         <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                            <span>Trading Manual ({activeSymbol})</span>
                            <span>{config.leverage}x Lev</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleManualTrade('BUY')} disabled={executing} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded font-bold text-sm shadow-lg active:scale-95 transition-transform">COMPRAR</button>
                            <button onClick={() => handleManualTrade('SELL')} disabled={executing} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded font-bold text-sm shadow-lg active:scale-95 transition-transform">VENDER</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONA DERECHA: ORDER BOOK + TERMINAL */}
            <div className="flex-1 flex flex-col gap-4 min-w-[300px] max-w-md">
                {/* ORDER BOOK */}
                <div className="flex-[2] bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
                    <div className="bg-slate-900/80 p-2 border-b border-slate-800 text-center text-xs font-bold text-slate-400">LIBRO DE ÓRDENES ({activeSymbol.replace('USDT','')})</div>
                    <div className="flex-1 flex flex-col text-[10px] font-mono relative">
                        {/* VENTAS (ROJO) */}
                        <div className="flex-1 flex flex-col justify-end overflow-hidden pb-1">
                            {asks.map((ask, i) => (
                                <div key={i} className="flex justify-between px-2 py-0.5 relative hover:bg-slate-800">
                                    <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10" style={{width: `${ask.relativeSize}%`}}></div>
                                    <span className="text-rose-400 z-10">{ask.price.toFixed(2)}</span>
                                    <span className="text-slate-500 z-10">{ask.size.toFixed(4)}</span>
                                </div>
                            ))}
                        </div>
                        {/* PRECIO CENTRO */}
                        <div className={`py-2 text-center text-lg font-bold border-y border-slate-800 ${isPositive ? 'text-emerald-500 bg-emerald-950/20' : 'text-rose-500 bg-rose-950/20'}`}>
                            {currentPrice.toFixed(2)}
                        </div>
                        {/* COMPRAS (VERDE) */}
                        <div className="flex-1 flex flex-col overflow-hidden pt-1">
                            {bids.map((bid, i) => (
                                <div key={i} className="flex justify-between px-2 py-0.5 relative hover:bg-slate-800">
                                    <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10" style={{width: `${bid.relativeSize}%`}}></div>
                                    <span className="text-emerald-400 z-10">{bid.price.toFixed(2)}</span>
                                    <span className="text-slate-500 z-10">{bid.size.toFixed(4)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TERMINAL */}
                <div className="flex-1 bg-black rounded-xl border border-slate-800 p-3 flex flex-col font-mono text-[10px] min-h-[150px]">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-900 pb-1"><Icons.Cpu /> TERMINAL DE SISTEMA</div>
                    <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2 break-all">
                                <span className="text-slate-700">{'>'}</span>
                                <span className={log.includes('WARN') ? 'text-rose-400' : log.includes('EXEC') ? 'text-yellow-400' : log.includes('SYS') ? 'text-cyan-400' : 'text-slate-300'}>{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};
