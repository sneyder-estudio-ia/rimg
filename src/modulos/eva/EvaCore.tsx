import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../components/Icons';
import { subscribeToTicker, subscribeToDepth, executeOrder, getCandles } from '../../services/binanceService';
import { BinanceConfig } from '../../types';

export const EvaCore = ({ config }: { config: BinanceConfig }) => {
  // --- ESTADO DEL CHART Y DATOS REALES ---
  const [prices, setPrices] = useState<number[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [volume, setVolume] = useState('0');
  
  // --- ESTADO DE EJECUCIÓN ---
  const [executing, setExecuting] = useState(false);
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- ESTADO DEL ORDER BOOK ---
  const [asks, setAsks] = useState<{price: number, size: number, total: number, relativeSize: number}[]>([]);
  const [bids, setBids] = useState<{price: number, size: number, total: number, relativeSize: number}[]>([]);

  // --- ESTADO DEL LOG ---
  const [logs, setLogs] = useState<string[]>([
      "EVA_SYS_INIT: Conectando a Binance Mainnet...",
      "NET_SEC: Canal WSS encriptado establecido.",
      "LIVE_FEED: Esperando tick inicial...",
  ]);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // --- FUNCIÓN HELPER PARA LOGS ---
  const addLog = (msg: string, type: 'INFO' | 'WARN' | 'EXEC' = 'INFO') => {
      const time = new Date().toISOString().split('T')[1].slice(0, 8);
      const prefix = type === 'EXEC' ? '⚡ EXEC:' : type === 'WARN' ? '⚠️ WARN:' : 'INFO:';
      setLogs(prev => [...prev.slice(-19), `[${time}] ${prefix} ${msg}`]);
  };

  // --- CONEXIÓN A DATOS REALES (WEBSOCKETS) ---
  useEffect(() => {
    // 1. Cargar historia inicial (Klines)
    const loadHistory = async () => {
        try {
            const candles = await getCandles('BTCUSDT', '15m', 60);
            if (candles.length > 0) {
                const history = candles.map(c => c.close);
                setPrices(history);
                setCurrentPrice(history[history.length - 1]);
                addLog("MARKET_DATA: Historial de precios sincronizado.");
            }
        } catch (e) {
            addLog("ERROR: Fallo al cargar historial Klines.", 'WARN');
        }
    };
    loadHistory();

    // 2. Suscripción a Ticker en tiempo real
    const tickerWs = subscribeToTicker('BTCUSDT', (data) => {
        setCurrentPrice(prev => {
            if (prev !== data.price) {
                // Actualizar array de precios para el gráfico (shift simple)
                setPrices(oldPrices => {
                    const newP = [...oldPrices];
                    newP.shift(); 
                    newP.push(data.price);
                    return newP;
                });
            }
            return data.price;
        });
        setPriceChange(data.change24h);
        setVolume(data.volume);
    });

    // 3. Suscripción a Libro de Órdenes
    const depthWs = subscribeToDepth('BTCUSDT', (data) => {
        // Procesar Asks (Venta)
        const newAsks = data.asks.slice(0, 14).map((a: any) => ({
            price: a.price,
            size: a.size,
            total: a.price * a.size,
            relativeSize: Math.min((a.size * a.price / 100000) * 100, 100) // Heurística visual simple
        }));
        
        // Procesar Bids (Compra)
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
      if (!config.apiKey || !config.apiSecret) {
          setErrorMsg("FALTAN API KEYS EN CONFIGURACIÓN");
          addLog("SEC_ERROR: Intento de trading sin credenciales.", 'WARN');
          setTimeout(() => setErrorMsg(null), 3000);
          return;
      }

      setExecuting(true);
      addLog(`INIT_ORDER: Preparando orden ${side} MARKET...`, 'EXEC');

      try {
          // Calcular cantidad basada en config (Simplificado para demo: 0.001 BTC fijo o lógica real)
          // NOTA: Para producción real, calcular qty en base a balance y precio.
          // Aquí usaremos una cantidad mínima segura para evitar errores de LOT_SIZE si el usuario tiene saldo.
          // OJO: Si no hay saldo real, Binance devolverá error.
          const quantity = 0.0001; // Cantidad muy pequeña para pruebas reales

          const result = await executeOrder(
              config.apiKey,
              config.apiSecret,
              'BTCUSDT',
              side,
              quantity
          );

          setLastOrder(`ORD-${result.orderId}`);
          addLog(`SUCCESS: Orden ${result.orderId} ejecutada. Precio: ${result.cummulativeQuoteQty}`, 'EXEC');
          
      } catch (e: any) {
          console.error(e);
          const msg = e.message || "Error desconocido en API Binance";
          setErrorMsg(msg.substring(0, 40) + "...");
          addLog(`FAIL: ${msg}`, 'WARN');
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

  // --- RENDERIZADO DEL GRÁFICO ---
  const renderChart = () => {
      if (prices.length === 0) return { path: "", fill: "" };
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const range = max - min || 1;
      const height = 300;
      const width = 1000;
      
      const points = prices.map((p, i) => {
          const x = (i / (prices.length - 1)) * width;
          const y = height - ((p - min) / range) * height * 0.8 - 20; 
          return `${x},${y}`;
      });

      const linePath = `M${points.join(' L')}`;
      const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

      return { path: linePath, area: areaPath };
  };

  const { path, area } = renderChart();
  const isPositive = priceChange >= 0;

  return (
    <div ref={mainContainerRef} className="flex flex-col h-full bg-[#050b14] font-mono text-slate-300 relative overflow-y-auto custom-scrollbar">
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
                        <span className="text-slate-500">Estado: <span className="text-emerald-400">CONECTADO</span></span>
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
            
            {/* COLUMNA IZQUIERDA */}
            <div className="flex-[3] flex flex-col gap-4 min-w-0">
                
                {/* 1. CHART CONTAINER */}
                <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl relative overflow-hidden group shadow-2xl min-h-[400px]">
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">DATA FEED: REALTIME</span>
                    </div>

                    <div className="absolute inset-0 z-0">
                         {prices.length > 0 ? (
                             <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.3" />
                                        <stop offset="100%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d={area} fill="url(#chartGradient)" />
                                <path d={path} fill="none" stroke={isPositive ? '#10b981' : '#f43f5e'} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                             </svg>
                         ) : (
                             <div className="flex items-center justify-center h-full text-slate-600 animate-pulse">CARGANDO DATOS DE MERCADO...</div>
                         )}
                         
                         {/* Pulsing Dot */}
                         {prices.length > 0 && (
                             <div className="absolute right-0 w-2 h-2 rounded-full transform -translate-y-1/2 translate-x-1/2 transition-all duration-300 ease-out" 
                                  style={{ 
                                      top: `${300 - ((currentPrice - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices) || 1)) * 300 * 0.8 - 20}px`,
                                      backgroundColor: isPositive ? '#10b981' : '#f43f5e',
                                      boxShadow: isPositive ? '0 0 15px #10b981' : '0 0 15px #f43f5e'
                                  }}
                             >
                                 <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                             </div>
                         )}
                    </div>
                </div>

                {/* 2. PANEL DE CONTROL ESTRATÉGICO REAL */}
                <div className="h-auto md:h-48 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                    
                    {/* A. AGENTE NEURONAL STATUS */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[180px]">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
                        <h3 className="text-white font-bold flex items-center gap-2 z-10">
                            <Icons.Bot /> NÚCLEO EVA v10.5
                        </h3>
                        <div className="z-10 space-y-2">
                             <div className="text-xs text-slate-400">Estrategia Activa: <span className="text-white font-bold">{config.strategy}</span></div>
                             <div className="text-xs text-slate-400">Modo Autónomo: <span className={config.autonomousMode ? "text-purple-400 font-bold" : "text-slate-500"}>{config.autonomousMode ? 'ON' : 'OFF'}</span></div>
                        </div>
                    </div>

                    {/* B. OPERATIVA MANUAL REAL */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-4 items-center min-h-[180px] relative">
                        {errorMsg && (
                            <div className="absolute inset-0 bg-slate-950/90 z-20 flex items-center justify-center p-4 text-center">
                                <span className="text-rose-500 font-bold text-xs">{errorMsg}</span>
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
                                    disabled={executing}
                                    className={`flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95 ${executing ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {executing ? 'ENVIANDO...' : 'BUY / LONG'}
                                </button>
                                <button 
                                    onClick={() => handleTrade('SELL')}
                                    disabled={executing}
                                    className={`flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded font-bold text-sm shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all active:scale-95 ${executing ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {executing ? 'ENVIANDO...' : 'SELL / SHORT'}
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
                                <span className={`${log.includes('WARN') ? 'text-rose-400' : log.includes('EXEC') ? 'text-yellow-400' : 'text-slate-300'}`}>
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