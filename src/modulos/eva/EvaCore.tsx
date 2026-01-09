
import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Icons } from '../../components/Icons';
import { subscribeToTicker, subscribeToDepth, executeOrder, getCandles } from '../../services/binanceService';
import { BinanceConfig } from '../../types';

type ChartType = 'CANDLES' | 'LINE' | 'AREA' | 'BARS' | 'HEIKIN';

export const EvaCore = ({ config }: { config: BinanceConfig }) => {
  // --- ESTADO DE DATOS ---
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [volume, setVolume] = useState('0');
  
  // --- ESTADO DEL GRÁFICO ---
  const [chartType, setChartType] = useState<ChartType>('CANDLES');
  const [is3DMode, setIs3DMode] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const candleDataRef = useRef<any[]>([]); // Referencia mutable para updates rápidos

  // --- ESTADO DE EJECUCIÓN Y SISTEMA ---
  const [isSystemActive, setIsSystemActive] = useState(false); // MASTER SWITCH
  const [systemError, setSystemError] = useState<string | null>(null); // ERROR DISPLAY
  const [executing, setExecuting] = useState(false);
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- ESTADO DEL ORDER BOOK ---
  const [asks, setAsks] = useState<{price: number, size: number, total: number, relativeSize: number}[]>([]);
  const [bids, setBids] = useState<{price: number, size: number, total: number, relativeSize: number}[]>([]);

  // --- ESTADO DEL LOG ---
  const [logs, setLogs] = useState<string[]>([
      "EVA_SYS_INIT: Conectando a Binance Mainnet...",
      "GRAPH_ENG: Motor de renderizado vectorial iniciado.",
      "LIVE_FEED: Sincronizando velas...",
  ]);
  
  const terminalRef = useRef<HTMLDivElement>(null);

  // --- FUNCIÓN HELPER PARA LOGS ---
  const addLog = (msg: string, type: 'INFO' | 'WARN' | 'EXEC' | 'SYS' = 'INFO') => {
      const time = new Date().toISOString().split('T')[1].slice(0, 8);
      const prefix = type === 'EXEC' ? '⚡ EXEC:' : type === 'WARN' ? '⚠️ WARN:' : type === 'SYS' ? '🚀 SYS:' : 'INFO:';
      setLogs(prev => [...prev.slice(-19), `[${time}] ${prefix} ${msg}`]);
  };

  // --- VALIDACIÓN Y START DEL SISTEMA ---
  const handleToggleSystem = async () => {
      setSystemError(null);

      // 1. APAGADO
      if (isSystemActive) {
          setIsSystemActive(false);
          addLog("SYSTEM_HALT: Protocolo detenido manualmente.", 'WARN');
          return;
      }

      // 2. ENCENDIDO (VALIDACIÓN)
      addLog("SYS_CHECK: Verificando integridad de configuración...", 'SYS');
      
      // Simulación de retraso de validación
      setExecuting(true);
      await new Promise(resolve => setTimeout(resolve, 600)); 

      // A. Validación de campos vacíos
      if (!config.apiKey || config.apiKey.trim() === '') {
          const err = "ERROR: API KEY FALTANTE. Configure en Ajustes.";
          setSystemError(err);
          addLog(err, 'WARN');
          setExecuting(false);
          return;
      }

      if (!config.apiSecret || config.apiSecret.trim() === '') {
          const err = "ERROR: SECRET KEY FALTANTE.";
          setSystemError(err);
          addLog(err, 'WARN');
          setExecuting(false);
          return;
      }

      // B. Validación de formato (Simple)
      if (config.apiKey.length < 15 || config.apiSecret.length < 15) {
          const err = "ERROR: CREDENCIALES INVÁLIDAS (Longitud incorrecta).";
          setSystemError(err);
          addLog(err, 'WARN');
          setExecuting(false);
          return;
      }

      // C. Éxito
      setExecuting(false);
      setIsSystemActive(true);
      addLog("SYSTEM_START: Motor EVA activo. Escaneando oportunidades...", 'EXEC');
  };

  // --- INICIALIZACIÓN DEL GRÁFICO ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Flag para controlar si este efecto ha sido limpiado
    let isCleanedUp = false;

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
        height: 400, // Altura fija inicial
        crosshair: {
            mode: CrosshairMode.Normal,
        },
        timeScale: {
            borderColor: '#334155',
            timeVisible: true,
            secondsVisible: false,
        },
        rightPriceScale: {
            borderColor: '#334155',
        },
    });

    chartApiRef.current = chart;

    // Función para crear la serie según el tipo
    const createSeries = (type: ChartType, data: any[]) => {
        // Verificar si el chart ya fue destruido antes de intentar operar
        if (isCleanedUp || !chartApiRef.current) return;

        try {
            if (seriesRef.current) {
                // Verificar si la serie pertenece al chart actual (protección adicional)
                try {
                    chart.removeSeries(seriesRef.current);
                } catch (e) {
                    // Ignorar si la serie ya no existe
                }
            }

            let newSeries;
            switch (type) {
                case 'CANDLES':
                case 'HEIKIN': 
                    newSeries = chart.addCandlestickSeries({
                        upColor: '#10b981',
                        downColor: '#f43f5e',
                        borderVisible: false,
                        wickUpColor: '#10b981',
                        wickDownColor: '#f43f5e',
                    });
                    break;
                case 'LINE':
                    newSeries = chart.addLineSeries({
                        color: '#3b82f6',
                        lineWidth: 2,
                    });
                    break;
                case 'AREA':
                    newSeries = chart.addAreaSeries({
                        lineColor: '#8b5cf6',
                        topColor: 'rgba(139, 92, 246, 0.4)',
                        bottomColor: 'rgba(139, 92, 246, 0.0)',
                    });
                    break;
                case 'BARS':
                    newSeries = chart.addBarSeries({
                        upColor: '#10b981',
                        downColor: '#f43f5e',
                    });
                    break;
                default:
                    newSeries = chart.addCandlestickSeries();
            }

            newSeries.setData(data);
            seriesRef.current = newSeries;
            chart.timeScale().fitContent();
        } catch (error) {
            console.warn("Chart operation failed:", error);
        }
    };

    // 1. Cargar historia inicial (Klines)
    const loadHistory = async () => {
        try {
            const rawCandles = await getCandles('BTCUSDT', '15m', 100);
            
            // Si el efecto se limpió mientras cargábamos, abortamos
            if (isCleanedUp) return;

            // Adaptar datos para Lightweight Charts
            const formattedData = rawCandles.map(c => ({
                time: c.time / 1000, // Timestamps en segundos
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                value: c.close // Para gráficos de línea/área
            }));

            candleDataRef.current = formattedData;
            createSeries(chartType, formattedData);
            
            if (formattedData.length > 0) {
                const last = formattedData[formattedData.length - 1];
                setCurrentPrice(last.close);
                addLog("MARKET_DATA: Historial de precios sincronizado.");
            }
        } catch (e) {
            if (!isCleanedUp) {
                addLog("ERROR: Fallo al cargar historial Klines.", 'WARN');
            }
        }
    };

    loadHistory();

    // Resize Observer
    const handleResize = () => {
        if (chartContainerRef.current && chartApiRef.current && !isCleanedUp) {
            try {
                chartApiRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            } catch (e) {
                // Silenciar error si el resize ocurre durante destrucción
            }
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
        isCleanedUp = true;
        window.removeEventListener('resize', handleResize);
        
        // Limpiar referencias para que otros efectos (WS) no intenten usar objetos destruidos
        seriesRef.current = null;
        
        if (chartApiRef.current) {
            try {
                chartApiRef.current.remove();
            } catch(e) {
                // Ignorar error al remover
            }
            chartApiRef.current = null;
        }
    };
  }, [chartType]); // Recrear gráfico si cambia el tipo

  // --- CONEXIÓN WEBSOCKET (TICKER) ---
  useEffect(() => {
    const tickerWs = subscribeToTicker('BTCUSDT', (data) => {
        setCurrentPrice(data.price);
        setPriceChange(data.change24h);
        setVolume(data.volume);

        // Actualizar vela en tiempo real
        if (chartApiRef.current && seriesRef.current && candleDataRef.current.length > 0) {
            try {
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
            } catch (error) {
                // Si falla (ej. chart disposed), ignoramos este frame
            }
        }
    });

    const depthWs = subscribeToDepth('BTCUSDT', (data) => {
        const newAsks = data.asks.slice(0, 14).map((a: any) => ({
            price: a.price,
            size: a.size,
            total: a.price * a.size,
            relativeSize: Math.min((a.size * a.price / 100000) * 100, 100)
        }));
        
        const newBids = data.bids.slice(0, 14).map((b: any) => ({
            price: b.price,
            size: b.size,
            total: b.price * b.size,
            relativeSize: Math.min((b.size * b.price / 100000) * 100, 100)
        }));

        setAsks(newAsks);
        setBids(newBids);
    });

    return () => {
        tickerWs.close();
        depthWs.close();
    };
  }, []);

  // --- EJECUCIÓN DE ÓRDENES REALES ---
  const handleTrade = async (side: 'BUY' | 'SELL') => {
      // Bloquear si el sistema global no está activo
      if (!isSystemActive) {
          const msg = "SISTEMA DETENIDO. Pulse START para operar.";
          setErrorMsg(msg);
          addLog(msg, 'WARN');
          setTimeout(() => setErrorMsg(null), 3000);
          return;
      }

      setExecuting(true);
      addLog(`INIT_ORDER: Preparando orden ${side} MARKET...`, 'EXEC');
      try {
          const quantity = 0.0001;
          const result = await executeOrder(config.apiKey, config.apiSecret, 'BTCUSDT', side, quantity);
          setLastOrder(`ORD-${result.orderId}`);
          addLog(`SUCCESS: Orden ${result.orderId} ejecutada. Precio: ${result.cummulativeQuoteQty}`, 'EXEC');
      } catch (e: any) {
          const msg = e.message || "Error desconocido en API Binance";
          setErrorMsg(msg.substring(0, 40) + "...");
          addLog(`FAIL: ${msg}`, 'WARN');
      } finally {
          setExecuting(false);
      }
  };

  useEffect(() => {
    if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const isPositive = priceChange >= 0;

  return (
    <div className="flex flex-col h-full bg-[#050b14] font-mono text-slate-300 relative overflow-y-auto custom-scrollbar">
        {/* BACKGROUND GRIDS */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.5)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none h-full min-h-screen"></div>

        {/* --- HEADER TÁCTICO REAL --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-[#050b14]/90 backdrop-blur z-20 sticky top-0">
            <div className="flex items-center gap-4">
                <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white">
                    <Icons.Binance />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
                        BTC / USDT <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">LIVE MAINNET</span>
                    </h1>
                    <div className="flex gap-3 text-xs mt-1">
                        <span className="text-slate-500">24h Vol: <span className="text-slate-300">{parseFloat(volume).toLocaleString()}</span></span>
                        <span className="text-slate-500">Estado: <span className={isSystemActive ? "text-emerald-400 animate-pulse" : "text-slate-500"}>{isSystemActive ? 'ONLINE' : 'STANDBY'}</span></span>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-6 items-center">
                 <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Precio Actual</div>
                    <div className={`text-2xl font-bold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                 </div>
                 <div className={`px-4 py-2 rounded border flex flex-col items-center justify-center min-w-[80px] ${isPositive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                    <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                 </div>
            </div>
        </div>

        {/* --- MAIN WORKSPACE --- */}
        <div className="flex-1 flex flex-col lg:flex-row relative z-10 p-4 gap-4 min-h-0">
            
            {/* COLUMNA IZQUIERDA: GRÁFICO + CONTROLES */}
            <div className="flex-[3] flex flex-col gap-4 min-w-0">
                
                {/* 1. CHART CONTAINER CON SOPORTE 3D */}
                <div className="chart-3d-wrapper relative z-20">
                    <div className={`flex-1 bg-slate-900/40 border border-slate-800 rounded-xl relative overflow-hidden group shadow-2xl min-h-[450px] transition-all duration-500 flex flex-col ${is3DMode ? 'chart-3d-active bg-slate-900/80' : ''}`}>
                        
                        {/* TOOLBAR DEL GRÁFICO */}
                        <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm z-30">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-bold px-2">TIPO:</span>
                                {['CANDLES', 'LINE', 'AREA', 'BARS'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setChartType(type as ChartType)}
                                        className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${chartType === type ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        {type === 'CANDLES' ? 'VELAS' : type === 'LINE' ? 'LÍNEA' : type === 'AREA' ? 'ÁREA' : 'BARRAS'}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIs3DMode(!is3DMode)}
                                    className={`px-3 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-2 ${is3DMode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-slate-700 text-slate-400 hover:text-white'}`}
                                >
                                    <Icons.Layers /> {is3DMode ? 'MODO 3D: ON' : 'VISTA 3D'}
                                </button>
                                <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">15m</span>
                            </div>
                        </div>

                        {/* LIENZO DEL GRÁFICO (LIGHTWEIGHT CHARTS) */}
                        <div className="relative flex-1 w-full h-full bg-slate-950/20" ref={chartContainerRef}>
                             {/* El gráfico se inyecta aquí */}
                        </div>
                    </div>
                </div>

                {/* 2. PANEL DE CONTROL ESTRATÉGICO REAL */}
                <div className="h-auto md:h-48 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                    
                    {/* A. AGENTE NEURONAL STATUS & MASTER SWITCH */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[180px]">
                        <div className={`absolute right-0 top-0 w-48 h-48 blur-3xl rounded-full pointer-events-none transition-colors duration-1000 ${isSystemActive ? 'bg-emerald-500/10' : 'bg-rose-500/5'}`}></div>
                        
                        <div className="flex justify-between items-start z-10">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Icons.Bot /> NÚCLEO EVA v10.5
                            </h3>
                            <div className={`w-3 h-3 rounded-full shadow-lg ${isSystemActive ? 'bg-emerald-500 animate-pulse shadow-emerald-500/50' : 'bg-slate-600'}`}></div>
                        </div>

                        <div className="z-10 mt-2">
                             {/* MASTER START BUTTON */}
                             <button 
                                onClick={handleToggleSystem}
                                disabled={executing}
                                className={`w-full py-4 rounded-lg font-black text-sm tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-lg border relative overflow-hidden group ${
                                    isSystemActive 
                                    ? 'bg-rose-900/20 text-rose-500 border-rose-500/50 hover:bg-rose-900/40' 
                                    : 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500 hover:scale-[1.02] shadow-emerald-900/50'
                                }`}
                             >
                                {isSystemActive && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>}
                                {executing ? (
                                    <span className="animate-pulse">VERIFICANDO...</span>
                                ) : (
                                    <>
                                        {isSystemActive ? <Icons.Stop /> : <Icons.Play />}
                                        {isSystemActive ? 'DETENER SISTEMA' : 'INICIAR PROTOCOLO'}
                                    </>
                                )}
                             </button>

                             {/* MENSAJE DE ERROR DEL SISTEMA */}
                             {systemError && (
                                 <div className="mt-2 text-[10px] text-rose-400 bg-rose-950/30 border border-rose-500/30 p-2 rounded flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                     <Icons.Alert />
                                     <span className="font-bold">{systemError}</span>
                                 </div>
                             )}

                             {!systemError && (
                                 <div className="mt-2 text-[10px] text-slate-500 text-center font-mono">
                                     {isSystemActive ? 'EJECUCIÓN ACTIVA: MONITOREANDO MERCADO' : 'ESPERANDO ORDEN DE INICIO'}
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* B. OPERATIVA MANUAL REAL */}
                    <div className={`bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-4 items-center min-h-[180px] relative transition-opacity duration-300 ${!isSystemActive ? 'opacity-60 grayscale' : 'opacity-100'}`}>
                        {errorMsg && (
                            <div className="absolute inset-0 bg-slate-950/90 z-20 flex items-center justify-center p-4 text-center rounded-xl">
                                <span className="text-rose-500 font-bold text-xs">{errorMsg}</span>
                            </div>
                        )}
                        
                        {!isSystemActive && !errorMsg && (
                             <div className="absolute inset-0 bg-slate-950/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                                <span className="text-[10px] font-bold text-white bg-black/50 px-3 py-1 rounded border border-slate-700">SISTEMA INACTIVO</span>
                            </div>
                        )}

                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                <span>Orden de Mercado</span>
                                <span>Apalancamiento: {config.leverage}x</span>
                            </div>
                            
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={() => handleTrade('BUY')}
                                    disabled={executing || !isSystemActive}
                                    className={`flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95 ${executing || !isSystemActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {executing ? '...' : 'BUY / LONG'}
                                </button>
                                <button 
                                    onClick={() => handleTrade('SELL')}
                                    disabled={executing || !isSystemActive}
                                    className={`flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded font-bold text-sm shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all active:scale-95 ${executing || !isSystemActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {executing ? '...' : 'SELL / SHORT'}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 text-center">
                                ADVERTENCIA: Esta acción ejecutará órdenes reales usando sus API Keys.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* COLUMNA DERECHA: ORDER BOOK & TERMINAL */}
            <div className="flex-1 flex flex-col gap-4 min-w-[300px] max-w-md">
                
                {/* 3. ORDER BOOK VISUAL */}
                <div className="flex-[2] bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
                    <div className="bg-slate-900/80 p-3 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Libro de Órdenes (Live)</h3>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                    
                    <div className="flex-1 flex flex-col text-[10px] font-mono relative overflow-hidden">
                        {/* ASKS */}
                        <div className="flex-1 flex flex-col justify-end overflow-hidden pb-1">
                            {asks.map((ask, i) => (
                                <div key={i} className="flex justify-between items-center px-2 py-0.5 relative hover:bg-slate-800/50 cursor-crosshair group">
                                    <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10 transition-all duration-300" style={{width: `${ask.relativeSize}%`}}></div>
                                    <span className="text-rose-400 z-10 font-bold">{ask.price.toFixed(2)}</span>
                                    <span className="text-slate-400 z-10">{ask.size.toFixed(4)}</span>
                                </div>
                            ))}
                        </div>

                        {/* SPREAD INDICATOR */}
                        <div className="py-2 bg-slate-950 border-y border-slate-800 flex justify-between px-4 items-center">
                             <span className={`text-lg font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {currentPrice.toFixed(2)}
                             </span>
                        </div>

                        {/* BIDS */}
                        <div className="flex-1 flex flex-col overflow-hidden pt-1">
                            {bids.map((bid, i) => (
                                <div key={i} className="flex justify-between items-center px-2 py-0.5 relative hover:bg-slate-800/50 cursor-crosshair group">
                                     <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-300" style={{width: `${bid.relativeSize}%`}}></div>
                                    <span className="text-emerald-400 z-10 font-bold">{bid.price.toFixed(2)}</span>
                                    <span className="text-slate-400 z-10">{bid.size.toFixed(4)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. TERMINAL */}
                <div className="flex-1 bg-black rounded-xl border border-slate-800 p-3 flex flex-col font-mono text-[10px] shadow-inner min-h-[150px]">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-900 pb-1">
                        <Icons.Cpu /> TERMINAL EVA_OS
                    </div>
                    <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2 opacity-80 hover:opacity-100 break-all">
                                <span className="text-slate-600 select-none">{'>'}</span>
                                <span className={`${log.includes('WARN') ? 'text-rose-400' : log.includes('EXEC') ? 'text-yellow-400' : log.includes('SYS') ? 'text-cyan-400' : 'text-slate-300'}`}>
                                    {log}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    </div>
  );
};
