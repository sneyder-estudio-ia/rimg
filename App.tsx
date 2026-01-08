import React, { useState, useEffect, useRef } from 'react';

// --- TYPES ---
type OrderType = 'buy' | 'sell';
type BotStatus = 'IDLE' | 'CONNECTING' | 'ANALYZING' | 'EXECUTING' | 'HALTED';
type ChartType = 'line' | 'candle' | 'bar' | 'area' | 'depth';

interface MarketData {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
}

interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  leverage: number;
  useTestnet: boolean;
}

// --- ICONS (SVG) ---
const Icons = {
  Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Bot: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 14v1"/><path d="M15 14v1"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>,
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Stop: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Binance: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#F3BA2F"><path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6355-2.7175-2.7155 7.353-7.3288z"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>,
  BarChart: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
  Layers: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
};

// --- COMPONENTS ---

const AdvancedChart = ({ data, type }: { data: number[], type: ChartType }) => {
  if (data.length < 2) return <div className="h-full w-full bg-slate-900/50 flex items-center justify-center text-slate-500 animate-pulse">Estableciendo conexión WebSocket...</div>;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 300;
  const width = 800;
  const candleWidth = width / data.length;

  const isUp = data[data.length - 1] > data[0];
  const color = isUp ? '#10b981' : '#f43f5e';

  // --- CHART RENDERING LOGIC ---

  // 1. Line / Area Chart Logic
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  // 2. Candlestick & Bar Logic (Derived fake OHLC)
  const candles = data.map((close, i) => {
    const prevClose = i > 0 ? data[i - 1] : close;
    const open = prevClose; // Simple approximation
    const high = Math.max(open, close) + Math.random() * (range * 0.1);
    const low = Math.min(open, close) - Math.random() * (range * 0.1);
    
    const x = (i / data.length) * width;
    const yHigh = height - ((high - min) / range) * height;
    const yLow = height - ((low - min) / range) * height;
    const yOpen = height - ((open - min) / range) * height;
    const yClose = height - ((close - min) / range) * height;
    
    const candleColor = close >= open ? '#10b981' : '#f43f5e';
    
    return { x, yHigh, yLow, yOpen, yClose, color: candleColor };
  });

  // 3. Depth Chart Logic (Simulated)
  const depthPointsBid = `0,${height} ${width/2},${height} ${width/2},${height/2} 0,${height/4}`;
  const depthPointsAsk = `${width},${height} ${width/2},${height} ${width/2},${height/2} ${width},${height/4}`;

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/30">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="depthBid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="depthAsk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* --- RENDER MODES --- */}
        
        {type === 'line' && (
           <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
        )}

        {type === 'area' && (
           <>
             <polygon fill="url(#chartGradient)" points={areaPoints} />
             <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
           </>
        )}

        {(type === 'candle' || type === 'bar') && candles.map((c, i) => (
            <g key={i}>
                {/* Wick */}
                <line x1={c.x + candleWidth/2} y1={c.yHigh} x2={c.x + candleWidth/2} y2={c.yLow} stroke={c.color} strokeWidth="1" />
                {/* Body */}
                {type === 'candle' ? (
                   <rect 
                     x={c.x + 1} 
                     y={Math.min(c.yOpen, c.yClose)} 
                     width={Math.max(1, candleWidth - 2)} 
                     height={Math.max(1, Math.abs(c.yClose - c.yOpen))} 
                     fill={c.color} 
                   />
                ) : (
                    // Bar Chart Style
                    <path 
                        d={`M${c.x},${c.yOpen} H${c.x + candleWidth/2} V${c.yClose} H${c.x + candleWidth}`} 
                        stroke={c.color} 
                        strokeWidth="1.5" 
                        fill="none" 
                    />
                )}
            </g>
        ))}

        {type === 'depth' && (
            <>
                <polygon points={`0,${height} ${width/2},${height} ${width/2},${height*0.4} 0,${height*0.2}`} fill="url(#depthBid)" stroke="#10b981" strokeWidth="2"/>
                <polygon points={`${width},${height} ${width/2},${height} ${width/2},${height*0.45} ${width},${height*0.2}`} fill="url(#depthAsk)" stroke="#f43f5e" strokeWidth="2"/>
                <line x1={width/2} y1={0} x2={width/2} y2={height} strokeDasharray="4" stroke="#475569" strokeWidth="1" />
                <text x={width/2 - 10} y={height - 10} fill="#10b981" textAnchor="end" fontSize="12">BID</text>
                <text x={width/2 + 10} y={height - 10} fill="#f43f5e" textAnchor="start" fontSize="12">ASK</text>
            </>
        )}

      </svg>
      
      {/* Current Price Line (Only for Time Series) */}
      {type !== 'depth' && (
          <div className="absolute right-0 top-0 bottom-0 w-full pointer-events-none">
            <div className="absolute right-0 border-t border-dashed border-slate-600 w-full" style={{ top: `${100 - ((data[data.length - 1] - min) / range) * 100}%` }}>
              <span className={`absolute right-1 -top-3 text-xs px-1 rounded font-bold ${isUp ? 'bg-emerald-900/80 text-emerald-400' : 'bg-rose-900/80 text-rose-400'}`}>
                {data[data.length - 1].toFixed(2)}
              </span>
            </div>
          </div>
      )}
    </div>
  );
};

const OrderBook = ({ price }: { price: number }) => {
  const generateOrders = (basePrice: number, type: 'ask' | 'bid', count: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const offset = (Math.random() * basePrice * 0.005) + (i * basePrice * 0.001);
      const p = type === 'ask' ? basePrice + offset : basePrice - offset;
      const size = Math.random() * 2.5;
      return { price: p, size };
    }).sort((a, b) => type === 'ask' ? b.price - a.price : b.price - a.price);
  };

  const asks = generateOrders(price, 'ask', 8);
  const bids = generateOrders(price, 'bid', 8);

  return (
    <div className="flex flex-col h-full text-xs font-mono">
      <div className="flex justify-between text-slate-500 mb-2 px-1">
        <span>Precio (USDT)</span>
        <span>Cantidad (BTC)</span>
      </div>
      <div className="flex-1 flex flex-col justify-end gap-0.5 overflow-hidden">
        {asks.slice().reverse().map((order, i) => (
          <div key={`ask-${i}`} className="flex justify-between px-1 hover:bg-slate-800/50 cursor-pointer group relative">
            <span className="text-rose-400">{order.price.toFixed(2)}</span>
            <span className="text-slate-400 group-hover:text-slate-200">{order.size.toFixed(4)}</span>
            <div className="absolute left-0 top-0 h-full bg-rose-500/10" style={{width: `${Math.min(order.size * 20, 100)}%`}}></div>
          </div>
        ))}
      </div>
      <div className="py-3 text-center text-lg font-bold text-white bg-slate-900/50 my-1 rounded border border-slate-800 flex items-center justify-center gap-2">
        {price.toFixed(2)} 
        {Math.random() > 0.5 ? <span className="text-emerald-500 text-xs">▲</span> : <span className="text-rose-500 text-xs">▼</span>}
      </div>
      <div className="flex-1 flex flex-col justify-start gap-0.5 overflow-hidden">
        {bids.map((order, i) => (
          <div key={`bid-${i}`} className="flex justify-between px-1 hover:bg-slate-800/50 cursor-pointer group relative">
            <span className="text-emerald-400">{order.price.toFixed(2)}</span>
            <span className="text-slate-400 group-hover:text-slate-200">{order.size.toFixed(4)}</span>
            <div className="absolute right-0 top-0 h-full bg-emerald-500/10" style={{width: `${Math.min(order.size * 20, 100)}%`}}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BotTerminal = ({ logs, status }: { logs: LogEntry[], status: BotStatus }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-black rounded-lg border border-slate-800 font-mono text-xs overflow-hidden relative shadow-inner shadow-slate-900 group">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <span className="flex items-center gap-2 text-yellow-400 font-bold">
          <Icons.Binance /> BINANCE_EXEC_V3
        </span>
        <div className="flex gap-2 items-center">
            <span className="text-[10px] text-slate-500">
              {status === 'EXECUTING' ? '14ms' : status === 'CONNECTING' ? '---' : 'Inactivo'}
            </span>
            <div className={`h-2 w-2 rounded-full ${status === 'EXECUTING' ? 'bg-emerald-500 animate-pulse' : status === 'CONNECTING' ? 'bg-yellow-500 animate-bounce' : 'bg-slate-600'}`}></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 opacity-90 max-h-[200px] md:max-h-none">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 break-all">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={
              log.type === 'error' ? 'text-red-500' :
              log.type === 'success' ? 'text-emerald-400' :
              log.type === 'warning' ? 'text-yellow-400' : 
              log.type === 'system' ? 'text-blue-400' : 'text-slate-300'
            }>
              {log.type === 'system' ? '# ' : log.type === 'success' ? '>>> ' : '> '}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="scan-line"></div>
    </div>
  );
};

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  config, 
  setConfig 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  config: BinanceConfig; 
  setConfig: (c: BinanceConfig) => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-white">
          <Icons.X />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-400/10 rounded-lg">
            <Icons.Binance />
          </div>
          <h2 className="text-xl font-bold text-white">Configuración API Binance</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Clave API (API Key)</label>
            <input 
              type="password" 
              value={config.apiKey}
              onChange={(e) => setConfig({...config, apiKey: e.target.value})}
              placeholder="vmPUZE6mv9sdMFX......" 
              className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-yellow-400 focus:border-yellow-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Clave Secreta (Secret Key)</label>
            <input 
              type="password" 
              value={config.apiSecret}
              onChange={(e) => setConfig({...config, apiSecret: e.target.value})}
              placeholder="NhqPtmdSJYdK....." 
              className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-yellow-400 focus:border-yellow-500 outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Apalancamiento (x)</label>
              <input 
                type="number" 
                value={config.leverage}
                onChange={(e) => setConfig({...config, leverage: parseInt(e.target.value)})}
                min="1" max="125"
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-white focus:border-yellow-500 outline-none" 
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
               <div 
                 onClick={() => setConfig({...config, useTestnet: !config.useTestnet})}
                 className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative ${config.useTestnet ? 'bg-yellow-500' : 'bg-slate-700'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useTestnet ? 'left-6' : 'left-1'}`}></div>
               </div>
               <span className="text-sm text-slate-300">Testnet</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button onClick={onClose} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors">
            Guardar y Conectar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [marketData, setMarketData] = useState<MarketData>({
    price: 64230.50,
    change24h: 2.4,
    high24h: 65100.00,
    low24h: 63900.20,
    volume: "1.2B"
  });

  const [priceHistory, setPriceHistory] = useState<number[]>(
    Array.from({ length: 50 }, () => 64000 + Math.random() * 500)
  );

  const [botStatus, setBotStatus] = useState<BotStatus>('IDLE');
  const [showSettings, setShowSettings] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('area');
  
  const [binanceConfig, setBinanceConfig] = useState<BinanceConfig>({
    apiKey: '',
    apiSecret: '',
    leverage: 20,
    useTestnet: false
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, timestamp: new Date().toLocaleTimeString(), message: 'Núcleo Autónomo EVA cargado.', type: 'system' },
    { id: 2, timestamp: new Date().toLocaleTimeString(), message: 'Esperando credenciales del Exchange...', type: 'warning' }
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'system' = 'info') => {
    setLogs(prev => [...prev.slice(-49), {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  // Simulate Market Movement
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const volatility = (Math.random() - 0.5) * 50;
        const newPrice = prev.price + volatility;
        
        setPriceHistory(history => {
          const newHistory = [...history.slice(1), newPrice];
          return newHistory;
        });

        return {
          ...prev,
          price: newPrice,
          change24h: prev.change24h + (volatility / 1000)
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Autonomous Bot Logic - Binance Simulation
  useEffect(() => {
    if (botStatus !== 'EXECUTING') return;

    // Technical Analysis Simulation
    const analysisInterval = setInterval(() => {
      const indicators = [
        "RSI(14): 42.5 - Neutral",
        "MACD(12,26,9) cruce detectado",
        "Bandas Bollinger comprimidas (2.0 DE)",
        "Oscilador de Volumen: +12% entrada",
        "Desequilibrio Libro de Órdenes: Presión de Compra"
      ];
      if (Math.random() > 0.7) {
        addLog(`Análisis: ${indicators[Math.floor(Math.random() * indicators.length)]}`, 'info');
      }
    }, 2000);

    // Trade Execution Simulation
    const executionInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        const side = Math.random() > 0.5 ? 'COMPRA' : 'VENTA';
        const amount = (Math.random() * 0.5 + 0.01).toFixed(4);
        const orderId = Math.floor(Math.random() * 90000000) + 10000000;
        
        addLog(`Orden Binance #${orderId} ENVIADA: ${side} ${amount} BTC @ MERCADO`, 'info');
        
        setTimeout(() => {
           addLog(`Orden Binance #${orderId} EJECUTADA. Com: 0.0004 BNB`, 'success');
        }, 800);
      }
    }, 4500);

    return () => {
      clearInterval(analysisInterval);
      clearInterval(executionInterval);
    };
  }, [botStatus]);

  const toggleBot = () => {
    if (botStatus === 'IDLE' || botStatus === 'HALTED') {
      if (!binanceConfig.apiKey) {
        setShowSettings(true);
        addLog('Error: Se requieren Claves API para trading autónomo.', 'error');
        return;
      }

      setBotStatus('CONNECTING');
      addLog(`Inicializando conexión a ${binanceConfig.useTestnet ? 'Testnet' : 'API Binance Spot'}...`, 'system');
      
      setTimeout(() => {
        addLog('Handshake exitoso. Túnel encriptado establecido.', 'system');
        addLog(`Balance obtenido. Apalancamiento ajustado a ${binanceConfig.leverage}x`, 'system');
        addLog('Suscribiendo a wss://stream.binance.com:9443/ws/btcusdt@trade', 'warning');
        setBotStatus('EXECUTING');
      }, 2000);

    } else {
      setBotStatus('HALTED');
      addLog('Terminando órdenes activas...', 'warning');
      setTimeout(() => {
        addLog('Sistemas detenidos por anulación de usuario.', 'error');
        setBotStatus('IDLE');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans selection:bg-yellow-500/30">
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        config={binanceConfig}
        setConfig={setBinanceConfig}
      />

      {/* SIDEBAR */}
      <aside className="w-full md:w-20 md:h-screen md:sticky md:top-0 bg-slate-900 border-r border-slate-800 flex flex-row md:flex-col items-center py-4 gap-6 z-20 shrink-0 overflow-x-auto justify-center md:justify-start">
        <div className="h-10 w-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] shrink-0">
           <Icons.Binance />
        </div>
        
        <nav className="flex flex-row md:flex-col gap-4 md:gap-8">
          <button className="p-3 rounded-lg bg-slate-800 text-yellow-400 shadow-inner shadow-yellow-900/20" aria-label="Dashboard">
            <Icons.Activity />
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors" aria-label="Settings"
          >
            <Icons.Settings />
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-4 sm:px-6 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                BTC / USDT 
                <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">BINANCE</span>
              </h1>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-800 mx-2"></div>
            <div className={`text-xl sm:text-2xl font-mono font-medium ${marketData.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {marketData.price.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-500">Balance Est. (BTC)</div>
              <div className="text-lg font-mono font-bold text-white">1.240592</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="font-bold text-xs text-yellow-500">PRO</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD GRID */}
        <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-9 flex flex-col gap-4">
            {/* Chart Area */}
            <section className="h-[400px] lg:h-[500px] bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col shadow-xl relative overflow-hidden">
               {/* Watermark */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                  <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6355-2.7175-2.7155 7.353-7.3288z"/></svg>
               </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 z-10 gap-2">
                
                {/* Chart Type Selector */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => setChartType('line')}
                        className={`p-1.5 rounded transition-all ${chartType === 'line' ? 'bg-slate-800 text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Línea"
                    >
                        <Icons.Activity />
                    </button>
                    <button 
                        onClick={() => setChartType('candle')}
                        className={`p-1.5 rounded transition-all ${chartType === 'candle' ? 'bg-slate-800 text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Velas"
                    >
                        <Icons.Chart />
                    </button>
                    <button 
                        onClick={() => setChartType('bar')}
                        className={`p-1.5 rounded transition-all ${chartType === 'bar' ? 'bg-slate-800 text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Barras"
                    >
                        <Icons.BarChart />
                    </button>
                    <button 
                        onClick={() => setChartType('area')}
                        className={`p-1.5 rounded transition-all ${chartType === 'area' ? 'bg-slate-800 text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Área"
                    >
                        <Icons.Layers />
                    </button>
                    <button 
                        onClick={() => setChartType('depth')}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${chartType === 'depth' ? 'bg-slate-800 text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        PROFUNDIDAD
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-1 bg-slate-950 p-1 rounded border border-slate-800 hidden md:flex">
                        {['15m', '1h', '4h', '1D'].map(tf => (
                            <button key={tf} className={`px-2 py-0.5 text-[10px] rounded font-medium transition-all ${tf === '1h' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                            {tf}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={`w-2 h-2 rounded-full ${botStatus === 'EXECUTING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                        WebSocket
                    </div>
                </div>
              </div>

              <div className="flex-1 relative z-10">
                 <AdvancedChart data={priceHistory} type={chartType} />
              </div>
            </section>

            {/* Bottom Panel: Bot Console & Controls */}
            <section className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 h-[300px] md:h-auto min-h-[300px] rounded-xl overflow-hidden">
                    <BotTerminal logs={logs} status={botStatus} />
                </div>
                
                <div className="w-full md:w-72 bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col justify-between shadow-xl gap-4 relative">
                    {botStatus === 'EXECUTING' && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50 animate-pulse"></div>
                    )}
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                            <Icons.Binance /> AGENTE AUTÓNOMO
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Estrategia Activa</label>
                                <div className="text-xs text-yellow-400 font-mono">MACD + BB (Scalping)</div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">PNL 24h</span>
                                    <span className="text-emerald-400 font-mono">+$1,240.50</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[65%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={toggleBot}
                        disabled={botStatus === 'CONNECTING'}
                        className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            botStatus === 'IDLE' || botStatus === 'HALTED' 
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                            : botStatus === 'CONNECTING'
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                        }`}
                    >
                        {botStatus === 'IDLE' || botStatus === 'HALTED' ? (
                            <><Icons.Play /> INICIAR MOTOR</>
                        ) : botStatus === 'CONNECTING' ? (
                             'CONECTANDO...'
                        ) : (
                            <><Icons.Stop /> DETENER SISTEMA</>
                        )}
                    </button>
                </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Order Book */}
            <section className="h-[400px] lg:h-[calc(100%-350px)] min-h-[400px] bg-slate-900/50 rounded-xl border border-slate-800 p-3 shadow-xl overflow-hidden flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex justify-between">
                <span>Libro de Órdenes</span>
                <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-300">BTCUSDT</span>
              </h3>
              <OrderBook price={marketData.price} />
            </section>

            {/* Trade Form */}
            <section className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl opacity-75 pointer-events-none relative">
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                <div className="text-xs font-mono text-yellow-500 bg-black/80 px-3 py-1 rounded border border-yellow-500/30">
                  TRADING AUTOMÁTICO ACTIVO
                </div>
              </div>
              <div className="flex bg-slate-800 rounded p-1 mb-4">
                <button className="flex-1 py-1.5 text-sm font-bold rounded bg-emerald-600 text-white shadow">Comprar</button>
                <button className="flex-1 py-1.5 text-sm font-bold rounded text-slate-400 hover:text-white">Vender</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Precio (USDT)</label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded px-3 py-2">
                    <input type="text" value={marketData.price.toFixed(2)} readOnly className="bg-transparent w-full text-right text-sm text-white focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-2">
                   <span>Disponible</span>
                   <span>1.24 BTC</span>
                </div>
                <button className="w-full py-3 mt-2 rounded bg-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                  Trading Manual Bloqueado
                </button>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
