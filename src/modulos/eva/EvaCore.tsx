
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../components/Icons';

export const EvaCore = () => {
  // --- ESTADO DEL CHART Y DATOS ---
  const [prices, setPrices] = useState<number[]>([]);
  const [currentPrice, setCurrentPrice] = useState(64247.59);
  const [priceChange, setPriceChange] = useState(0);
  
  // --- ESTADO DEL ORDER BOOK ---
  const [asks, setAsks] = useState<{price: number, size: number, total: number, relativeSize: number}[]>([]);
  const [bids, setBids] = useState<{price: number, size: number, total: number, relativeSize: number}[]>([]);

  // --- ESTADO DEL LOG ---
  const [logs, setLogs] = useState<string[]>([
      "EVA_SYS_INIT: Protocolo de enlace establecido...",
      "NET_SEC: Canal encriptado SHA-256 activo.",
      "MARKET_FEED: Sincronizando par BTC/USDT...",
      "NEURAL_ENG: Estrategia SCALPING cargada en memoria.",
      "READY: Esperando confirmación de ruptura."
  ]);
  
  // Referencias para control de scroll
  const terminalRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // --- GENERADOR DE DATOS SIMULADOS (Init) ---
  useEffect(() => {
    // Scroll al inicio al montar el componente para asegurar vista superior
    if (mainContainerRef.current) {
        mainContainerRef.current.scrollTop = 0;
    }

    // Generar historial de precios inicial
    const initialPrices = [];
    let price = 64247.59;
    for (let i = 0; i < 60; i++) {
        price = price + (Math.random() - 0.5) * 80;
        initialPrices.push(price);
    }
    setPrices(initialPrices);
    setCurrentPrice(price);
  }, []);

  // --- BUCLE DE ACTUALIZACIÓN EN VIVO (HEARTBEAT) ---
  useEffect(() => {
    const interval = setInterval(() => {
        // 1. Actualizar Precio
        const change = (Math.random() - 0.5) * 25;
        setPriceChange(change);
        
        setCurrentPrice(prev => {
            const newPrice = prev + change;
            setPrices(prevPrices => {
                const newHistory = [...prevPrices.slice(1), newPrice];
                return newHistory;
            });
            
            // Generar Order Book Dinámico
            const generateSide = (base: number, type: 'ask' | 'bid') => {
                return Array.from({length: 14}).map((_, i) => {
                    const spread = type === 'ask' ? i * 2 : i * 2;
                    const p = type === 'ask' ? base + spread + Math.random() : base - spread - Math.random();
                    const s = Math.random() * 2.5;
                    return {
                        price: p,
                        size: s,
                        total: s * p,
                        relativeSize: Math.min((s / 2.5) * 100, 100) // Para la barra visual
                    };
                }).sort((a, b) => type === 'ask' ? b.price - a.price : b.price - a.price);
            };

            setAsks(generateSide(newPrice + 5, 'ask'));
            setBids(generateSide(newPrice - 5, 'bid'));
            
            return newPrice;
        });

        // 2. Logs aleatorios
        if (Math.random() > 0.85) {
            const events = [
                "SCAN: Volatilidad detectada en rango 15m.",
                "ORD_FLOW: Ballena detectada (120 BTC).",
                "NET_LATENCY: 12ms - Óptimo.",
                "STRATEGY: Recalculando niveles Fibonacci...",
                "UPDATE: Libro de órdenes actualizado."
            ];
            const msg = events[Math.floor(Math.random() * events.length)];
            const time = new Date().toISOString().split('T')[1].slice(0, 8);
            setLogs(prev => [...prev.slice(-12), `[${time}] ${msg}`]);
        }

    }, 800); // 800ms refresh rate
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal solo dentro de su contenedor (sin afectar ventana principal)
  useEffect(() => {
    if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // --- RENDERIZADO DEL GRÁFICO (SVG PATH) ---
  const renderChart = () => {
      if (prices.length === 0) return { path: "", fill: "" };
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const range = max - min || 1;
      const height = 300;
      const width = 1000;
      
      const points = prices.map((p, i) => {
          const x = (i / (prices.length - 1)) * width;
          const y = height - ((p - min) / range) * height * 0.8 - 20; // Margen
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

        {/* --- HEADER TÁCTICO --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-[#050b14]/90 backdrop-blur z-20 sticky top-0">
            <div className="flex items-center gap-4">
                <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white">
                    <Icons.Binance />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
                        BTC / USDT <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">PERP</span>
                    </h1>
                    <div className="flex gap-3 text-xs mt-1">
                        <span className="text-slate-500">24h Vol: <span className="text-slate-300">42,102 BTC</span></span>
                        <span className="text-slate-500">Funding: <span className="text-emerald-400">0.0100%</span></span>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-6 items-center">
                 <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Precio de Marca</div>
                    <div className={`text-2xl font-bold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                 </div>
                 <div className={`px-4 py-2 rounded border flex flex-col items-center justify-center min-w-[80px] ${isPositive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                    <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-500">24H CHANGE</span>
                 </div>
            </div>
        </div>

        {/* --- MAIN WORKSPACE --- */}
        <div className="flex-1 flex flex-col lg:flex-row relative z-10 p-4 gap-4 min-h-0">
            
            {/* COLUMNA IZQUIERDA: CHART + CONTROLES */}
            <div className="flex-[3] flex flex-col gap-4 min-w-0">
                
                {/* 1. CHART CONTAINER */}
                <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl relative overflow-hidden group shadow-2xl min-h-[400px]">
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                         {['15m', '1H', '4H', '1D'].map(tf => (
                             <button key={tf} className={`px-3 py-1 text-xs font-bold rounded border ${tf === '15m' ? 'bg-slate-800 text-white border-slate-600' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-800/50'}`}>
                                 {tf}
                             </button>
                         ))}
                    </div>

                    <div className="absolute inset-0 z-0">
                         <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.3" />
                                    <stop offset="100%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines H */}
                            <line x1="0" y1="75" x2="1000" y2="75" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="150" x2="1000" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="225" x2="1000" y2="225" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                            
                            {/* Area & Line */}
                            <path d={area} fill="url(#chartGradient)" />
                            <path d={path} fill="none" stroke={isPositive ? '#10b981' : '#f43f5e'} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                         </svg>
                         
                         {/* Pulsing Dot at current price */}
                         <div className="absolute right-0 w-2 h-2 rounded-full transform -translate-y-1/2 translate-x-1/2" 
                              style={{ 
                                  top: `${300 - ((currentPrice - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices) || 1)) * 300 * 0.8 - 20}px`,
                                  backgroundColor: isPositive ? '#10b981' : '#f43f5e',
                                  boxShadow: isPositive ? '0 0 15px #10b981' : '0 0 15px #f43f5e'
                              }}
                         >
                             <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                         </div>
                    </div>
                </div>

                {/* 2. PANEL DE CONTROL ESTRATÉGICO */}
                <div className="h-auto md:h-48 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                    
                    {/* A. AGENTE NEURONAL STATUS */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[180px]">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Icons.Bot /> NÚCLEO EVA v10.5
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-purple-300">Analizando Fractalidad...</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 uppercase">Confianza IA</div>
                                <div className="text-xl font-bold text-white">87.4%</div>
                            </div>
                        </div>

                        <div className="space-y-2 z-10 mt-4 md:mt-0">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Carga CPU</span>
                                <span>34%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-[34%]"></div>
                            </div>
                            
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>Latencia Red</span>
                                <span className="text-emerald-400">12ms</span>
                            </div>
                        </div>
                    </div>

                    {/* B. OPERATIVA MANUAL */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-4 items-center min-h-[180px]">
                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                <span>Tamaño</span>
                                <span>Apalancamiento</span>
                            </div>
                            <div className="flex justify-between text-white font-mono">
                                <span className="bg-slate-950 border border-slate-700 px-3 py-1 rounded w-full mr-2 text-center">0.5 BTC</span>
                                <span className="bg-slate-950 border border-slate-700 px-3 py-1 rounded text-yellow-500">20x</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95">
                                    LONG
                                </button>
                                <button className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded font-bold text-sm shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all active:scale-95">
                                    SHORT
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* COLUMNA DERECHA: ORDER BOOK & TERMINAL */}
            <div className="flex-1 flex flex-col gap-4 min-w-[300px] max-w-md">
                
                {/* 3. ORDER BOOK VISUAL */}
                <div className="flex-[2] bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
                    <div className="bg-slate-900/80 p-3 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Libro de Órdenes</h3>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col text-[10px] font-mono relative overflow-hidden">
                        {/* ASKS (Venta) - Se llena de abajo hacia arriba */}
                        <div className="flex-1 flex flex-col justify-end overflow-hidden pb-1">
                            {asks.slice(0, 14).reverse().map((ask, i) => (
                                <div key={i} className="flex justify-between items-center px-2 py-0.5 relative hover:bg-slate-800/50 cursor-crosshair group">
                                    {/* Barra de volumen visual */}
                                    <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10 transition-all duration-300" style={{width: `${ask.relativeSize}%`}}></div>
                                    
                                    <span className="text-rose-400 z-10 font-bold group-hover:text-rose-300">{ask.price.toFixed(2)}</span>
                                    <span className="text-slate-400 z-10 group-hover:text-white">{ask.size.toFixed(3)}</span>
                                </div>
                            ))}
                        </div>

                        {/* SPREAD INDICATOR */}
                        <div className="py-2 bg-slate-950 border-y border-slate-800 flex justify-between px-4 items-center">
                             <span className={`text-lg font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {currentPrice.toFixed(2)}
                             </span>
                             <span className="text-[10px] text-slate-500">ÚLTIMO PRECIO</span>
                        </div>

                        {/* BIDS (Compra) */}
                        <div className="flex-1 flex flex-col overflow-hidden pt-1">
                            {bids.slice(0, 14).map((bid, i) => (
                                <div key={i} className="flex justify-between items-center px-2 py-0.5 relative hover:bg-slate-800/50 cursor-crosshair group">
                                     {/* Barra de volumen visual */}
                                     <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-300" style={{width: `${bid.relativeSize}%`}}></div>
                                     
                                    <span className="text-emerald-400 z-10 font-bold group-hover:text-emerald-300">{bid.price.toFixed(2)}</span>
                                    <span className="text-slate-400 z-10 group-hover:text-white">{bid.size.toFixed(3)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. MINI TERMINAL */}
                <div className="flex-1 bg-black rounded-xl border border-slate-800 p-3 flex flex-col font-mono text-[10px] shadow-inner min-h-[150px]">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-900 pb-1">
                        <Icons.Cpu /> TERMINAL EVA_OS
                    </div>
                    {/* Contenedor de logs con referencia para auto-scroll contenido */}
                    <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2 opacity-80 hover:opacity-100">
                                <span className="text-slate-600 select-none">{'>'}</span>
                                <span className={`${log.includes('SCAN') ? 'text-yellow-400' : log.includes('ORD') ? 'text-blue-400' : 'text-slate-300'}`}>
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
