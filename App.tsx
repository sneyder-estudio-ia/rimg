import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { EvaCore } from './modulos/eva/EvaCore';

// --- TYPES ---
type View = 'DASHBOARD' | 'SETTINGS' | 'EVA_BRAIN';
type BotStatus = 'IDLE' | 'CONNECTING' | 'ANALYZING' | 'EXECUTING' | 'HALTED';
type ChartType = 'line' | 'candle' | 'bar' | 'area' | 'depth';
type StrategyType = 'SCALPING_MACD' | 'SWING_RSI' | 'AI_SENTIMENT';

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
  email: string; // Mandatory for recovery
  apiKey: string;
  apiSecret: string;
  leverage: number;
  useTestnet: boolean;
  maxPositionSize: number; // % of balance
  stopLoss: number; // %
  takeProfit: number; // %
  strategy: StrategyType;
  operationDuration: number; // minutes
}

// --- ICONS (SVG) ---
const Icons = {
  Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Bot: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 14v1"/><path d="M15 14v1"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Stop: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  Binance: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#F3BA2F"><path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6355-2.7175-2.7155 7.353-7.3288z"/></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>,
  BarChart: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
  Layers: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Database: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  CloudOff: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 7h1.8"/><path d="M5 19a4 4 0 0 1-4-4 4 4 0 0 1 4-4"/><path d="M2 2l20 20"/></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Cpu: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

// --- SUB-COMPONENTS ---

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

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  const candles = data.map((close, i) => {
    const prevClose = i > 0 ? data[i - 1] : close;
    const open = prevClose;
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

        {type === 'line' && <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />}
        {type === 'area' && <><polygon fill="url(#chartGradient)" points={areaPoints} /><polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" /></>}
        {(type === 'candle' || type === 'bar') && candles.map((c, i) => (
            <g key={i}>
                <line x1={c.x + candleWidth/2} y1={c.yHigh} x2={c.x + candleWidth/2} y2={c.yLow} stroke={c.color} strokeWidth="1" />
                {type === 'candle' ? (
                   <rect x={c.x + 1} y={Math.min(c.yOpen, c.yClose)} width={Math.max(1, candleWidth - 2)} height={Math.max(1, Math.abs(c.yClose - c.yOpen))} fill={c.color} />
                ) : (
                    <path d={`M${c.x},${c.yOpen} H${c.x + candleWidth/2} V${c.yClose} H${c.x + candleWidth}`} stroke={c.color} strokeWidth="1.5" fill="none" />
                )}
            </g>
        ))}
        {type === 'depth' && (
            <>
                <polygon points={`0,${height} ${width/2},${height} ${width/2},${height*0.4} 0,${height*0.2}`} fill="url(#depthBid)" stroke="#10b981" strokeWidth="2"/>
                <polygon points={`${width},${height} ${width/2},${height} ${width/2},${height*0.45} ${width},${height*0.2}`} fill="url(#depthAsk)" stroke="#f43f5e" strokeWidth="2"/>
                <line x1={width/2} y1={0} x2={width/2} y2={height} strokeDasharray="4" stroke="#475569" strokeWidth="1" />
            </>
        )}
      </svg>
      {type !== 'depth' && (
          <div className="absolute right-0 top-0 bottom-0 w-full pointer-events-none">
            <div className="absolute right-0 border-t border-dashed border-slate-600 w-full" style={{ top: `${100 - ((data[data.length - 1] - min) / range) * 100}%` }}>
              <span className={`absolute right-1 -top-3 text-xs px-1 rounded font-bold ${isUp ? 'bg-emerald-900/80 text-emerald-400' : 'bg-rose-900/80 text-rose-400'}`}>{data[data.length - 1].toFixed(2)}</span>
            </div>
          </div>
      )}
    </div>
  );
};

const OrderBook = ({ price }: { price: number }) => {
  const asks = Array.from({ length: 8 }).map((_, i) => ({ price: price + (i * 5) + Math.random(), size: Math.random() * 2 })).reverse();
  const bids = Array.from({ length: 8 }).map((_, i) => ({ price: price - (i * 5) - Math.random(), size: Math.random() * 2 }));

  return (
    <div className="flex flex-col h-full text-xs font-mono">
      <div className="flex justify-between text-slate-500 mb-2 px-1"><span>Precio</span><span>Cant.</span></div>
      <div className="flex-1 flex flex-col justify-end gap-0.5 overflow-hidden">
        {asks.map((o, i) => <div key={i} className="flex justify-between px-1 relative"><span className="text-rose-400">{o.price.toFixed(2)}</span><span className="text-slate-400">{o.size.toFixed(4)}</span></div>)}
      </div>
      <div className="py-2 text-center text-base font-bold text-white bg-slate-900/50 my-1 rounded border border-slate-800">{price.toFixed(2)}</div>
      <div className="flex-1 flex flex-col justify-start gap-0.5 overflow-hidden">
        {bids.map((o, i) => <div key={i} className="flex justify-between px-1 relative"><span className="text-emerald-400">{o.price.toFixed(2)}</span><span className="text-slate-400">{o.size.toFixed(4)}</span></div>)}
      </div>
    </div>
  );
};

const BotTerminal = ({ logs, status }: { logs: LogEntry[], status: BotStatus }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  return (
    <div className="h-full flex flex-col bg-black rounded-lg border border-slate-800 font-mono text-xs overflow-hidden relative shadow-inner shadow-slate-900 group">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <span className="flex items-center gap-2 text-yellow-400 font-bold"><Icons.Binance /> BINANCE_EXEC_V3</span>
        <div className="flex gap-2 items-center"><div className={`h-2 w-2 rounded-full ${status === 'EXECUTING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div></div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 opacity-90 max-h-[200px] md:max-h-none">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 break-all">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'}>{log.type === 'system' ? '# ' : '> '}{log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="scan-line"></div>
    </div>
  );
};

// --- CONFIGURATION VIEW ---

const ConfigurationView = ({ 
    config, 
    setConfig, 
    dbConnected,
    onSave
}: { 
    config: BinanceConfig, 
    setConfig: (c: BinanceConfig) => void,
    dbConnected: boolean,
    onSave: () => void
}) => {
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSaveClick = async () => {
        if (!config.email || config.email.trim() === '') {
            setValidationError("El correo electrónico es OBLIGATORIO para recuperación.");
            return;
        }
        setValidationError(null);
        setIsSaving(true);
        await onSave();
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="border-b border-slate-800 pb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Icons.Settings /> CONFIGURACIÓN DEL SISTEMA
                        </h2>
                        <p className="text-slate-500 mt-2 font-mono text-sm">Versión del protocolo: EVA v10.5.2 // Acceso Administrativo</p>
                    </div>
                    {dbConnected ? 
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-2"><Icons.Database /> DB SINCRONIZADA</span> :
                        <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full text-xs font-bold flex items-center gap-2"><Icons.CloudOff /> DB DESCONECTADA</span>
                    }
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* SECTION 0: IDENTITY (MANDATORY) */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2 border-b border-slate-800 pb-2">
                            <Icons.User /> <h3 className="font-bold tracking-wider">IDENTIDAD DEL OPERADOR</h3>
                        </div>
                        
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase flex justify-between">
                                    <span>Correo de Recuperación</span>
                                    <span className="text-rose-500 text-[10px] tracking-wider font-bold border border-rose-500/30 px-1 rounded bg-rose-500/10">OBLIGATORIO</span>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="email" 
                                        value={config.email}
                                        onChange={(e) => {
                                            setConfig({...config, email: e.target.value});
                                            if (e.target.value) setValidationError(null);
                                        }}
                                        className={`w-full bg-slate-950 border ${validationError && !config.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} rounded-lg p-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono`}
                                        placeholder="usuario@ejemplo.com"
                                    />
                                    {validationError && !config.email && (
                                        <div className="absolute right-3 top-3 text-rose-500 animate-pulse text-xs font-bold">REQUERIDO</div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2">
                                    * Este correo es el único método para recuperar el acceso y la configuración de sus estrategias en caso de pérdida de sesión.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* LEFT COLUMN: API + TIME */}
                    <div className="space-y-8">
                        {/* SECTION 1: API CONNECTION */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-yellow-400 mb-2 border-b border-slate-800 pb-2">
                                <Icons.Binance /> <h3 className="font-bold tracking-wider">CONEXIÓN EXCHANGE</h3>
                            </div>
                            
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">API Key (Solo Lectura/Trading)</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            value={config.apiKey}
                                            onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-yellow-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all font-mono"
                                            placeholder="Ingrese su clave API..."
                                        />
                                        <div className="absolute right-3 top-3 text-slate-600"><Icons.Shield /></div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Secret Key</label>
                                    <input 
                                        type="password" 
                                        value={config.apiSecret}
                                        onChange={(e) => setConfig({...config, apiSecret: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-yellow-400 focus:border-yellow-500 outline-none font-mono"
                                        placeholder="Ingrese su clave secreta..."
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-sm text-slate-300">Modo Testnet (Sandbox)</span>
                                    <button 
                                        onClick={() => setConfig({...config, useTestnet: !config.useTestnet})}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${config.useTestnet ? 'bg-yellow-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${config.useTestnet ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: TIME CONFIG (NEW) */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-purple-400 mb-2 border-b border-slate-800 pb-2">
                                <Icons.Clock /> <h3 className="font-bold tracking-wider">TEMPORIZADOR DE MISIÓN</h3>
                            </div>
                            
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Duración de Sesión</label>
                                        <span className="text-xs font-mono text-white bg-slate-800 px-2 py-0.5 rounded">
                                            {config.operationDuration < 60 
                                                ? `${config.operationDuration} min` 
                                                : `${(config.operationDuration / 60).toFixed(1)} Horas`}
                                        </span>
                                    </div>
                                    <input 
                                        type="range" min="15" max="1440" step="15"
                                        value={config.operationDuration}
                                        onChange={(e) => setConfig({...config, operationDuration: parseInt(e.target.value)})}
                                        className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                                        <span>15m</span>
                                        <span>12h</span>
                                        <span>24h</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">
                                        * EVA detendrá automáticamente la ejecución y cerrará posiciones al finalizar este periodo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* RIGHT COLUMN: RISK MANAGEMENT */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-2 text-rose-400 mb-2 border-b border-slate-800 pb-2">
                            <Icons.Shield /> <h3 className="font-bold tracking-wider">PROTOCOLOS DE RIESGO</h3>
                        </div>
                        
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Apalancamiento (Leverage)</label>
                                    <span className="text-xs font-mono text-white bg-slate-800 px-2 py-0.5 rounded">{config.leverage}x</span>
                                </div>
                                <input 
                                    type="range" min="1" max="125" step="1"
                                    value={config.leverage}
                                    onChange={(e) => setConfig({...config, leverage: parseInt(e.target.value)})}
                                    className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Stop Loss (%)</label>
                                    <input 
                                        type="number" step="0.1"
                                        value={config.stopLoss}
                                        onChange={(e) => setConfig({...config, stopLoss: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-white focus:border-rose-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Take Profit (%)</label>
                                    <input 
                                        type="number" step="0.1"
                                        value={config.takeProfit}
                                        onChange={(e) => setConfig({...config, takeProfit: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Max Posición (% Saldo)</label>
                                    <input 
                                        type="number" step="1" max="100"
                                        value={config.maxPositionSize}
                                        onChange={(e) => setConfig({...config, maxPositionSize: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: STRATEGY CORE */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 text-blue-400 mb-2 border-b border-slate-800 pb-2">
                            <Icons.Cpu /> <h3 className="font-bold tracking-wider">NÚCLEO NEURONAL (ESTRATEGIA)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'SCALPING_MACD', name: 'Scalping H.F.', desc: 'Alta frecuencia. Basado en MACD y Bollinger. Riesgo Medio.', color: 'border-yellow-500/50 bg-yellow-500/10' },
                                { id: 'SWING_RSI', name: 'Swing Momentum', desc: 'Operaciones a mediano plazo. Cruces de RSI y medias móviles. Riesgo Bajo.', color: 'border-blue-500/50 bg-blue-500/10' },
                                { id: 'AI_SENTIMENT', name: 'EVA Sentiment AI', desc: 'Análisis de sentimiento de mercado + Order Flow. Experimental.', color: 'border-purple-500/50 bg-purple-500/10' }
                            ].map((strat) => (
                                <div 
                                    key={strat.id}
                                    onClick={() => setConfig({...config, strategy: strat.id as StrategyType})}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${config.strategy === strat.id ? strat.color : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white">{strat.name}</h4>
                                        <div className={`w-4 h-4 rounded-full border-2 ${config.strategy === strat.id ? 'bg-white border-transparent' : 'border-slate-600'}`}></div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">{strat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {validationError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-lg flex items-center gap-3 text-rose-400 animate-pulse">
                        <Icons.Shield />
                        <span className="font-bold text-sm">{validationError}</span>
                    </div>
                )}

                <div className="pt-8 flex justify-end">
                    <button 
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className={`px-8 py-3 rounded-lg font-bold flex items-center gap-3 transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-slate-200'} ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isSaving ? (
                            <>GUARDANDO EN DB...</>
                        ) : (
                            <>
                                <Icons.Save />
                                {saved ? 'CONFIGURACIÓN GUARDADA' : 'GUARDAR CAMBIOS'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SPLASH SCREEN ---
const SplashScreen = () => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
            <span className="text-sm md:text-base text-yellow-500 font-mono tracking-[0.3em] uppercase animate-pulse">
                CARGANDO SISTEMA EVA v10.5
            </span>
            <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
            </div>
        </div>
    </div>
);

// --- MAIN APP ---

export default function App() {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<MarketData>({
    price: 64230.50, change24h: 2.4, high24h: 65100.00, low24h: 63900.20, volume: "1.2B"
  });
  const [priceHistory, setPriceHistory] = useState<number[]>(Array.from({ length: 50 }, () => 64000 + Math.random() * 500));
  const [botStatus, setBotStatus] = useState<BotStatus>('IDLE');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  
  const [binanceConfig, setBinanceConfig] = useState<BinanceConfig>({
    email: '', // Initialize empty
    apiKey: '', apiSecret: '', leverage: 20, useTestnet: false,
    maxPositionSize: 10, stopLoss: 1.5, takeProfit: 3.0, strategy: 'SCALPING_MACD',
    operationDuration: 60 // Default 60 minutes
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, timestamp: new Date().toLocaleTimeString(), message: 'Núcleo Autónomo EVA cargado.', type: 'system' }
  ]);

  const addLog = async (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'system' = 'info') => {
    const entry: LogEntry = { id: Date.now() + Math.random(), timestamp: new Date().toLocaleTimeString(), message, type };
    setLogs(prev => [...prev.slice(-49), entry]);
    if (dbConnected) {
        // Optional: Save logs to DB if needed, removed for brevity/perf
    }
  };

  // INITIALIZATION & DB CONFIG LOAD
  useEffect(() => {
    const initSystem = async () => {
        try {
            // 1. Check DB Connection
            const { error: healthError } = await supabase.from('bot_config').select('id', { count: 'exact', head: true });
            
            if (!healthError) {
                setDbConnected(true);
                
                // 2. Fetch Config
                const { data, error } = await supabase.from('bot_config').select('*').single();
                
                if (data && !error) {
                    setBinanceConfig({
                        email: data.email || '',
                        apiKey: data.api_key || '',
                        apiSecret: data.api_secret || '',
                        leverage: data.leverage || 20,
                        useTestnet: data.use_testnet || false,
                        maxPositionSize: data.max_position_size || 10,
                        stopLoss: data.stop_loss || 1.5,
                        takeProfit: data.take_profit || 3.0,
                        strategy: (data.strategy as StrategyType) || 'SCALPING_MACD',
                        operationDuration: data.operation_duration_minutes || 60
                    });
                    addLog('Configuración sincronizada desde Base de Datos', 'success');
                } else {
                    addLog('No se encontró configuración previa. Usando valores por defecto.', 'warning');
                }
            } else {
                addLog('Modo Offline: No se pudo conectar a la base de datos.', 'error');
            }
        } catch (e) {
            console.error(e);
            addLog('Error crítico al inicializar.', 'error');
        } finally {
            // Artificial delay to show the "Hola Mundo" splash screen
            setTimeout(() => setLoading(false), 2500);
        }
    };

    initSystem();
  }, []);

  const saveConfigToDb = async () => {
    if (!dbConnected) {
        addLog('No se puede guardar: Base de datos desconectada', 'error');
        return;
    }
    try {
        const { error } = await supabase.from('bot_config').upsert({
            id: 1, // Singleton ID
            email: binanceConfig.email, // Save email
            api_key: binanceConfig.apiKey,
            api_secret: binanceConfig.apiSecret,
            leverage: binanceConfig.leverage,
            use_testnet: binanceConfig.useTestnet,
            max_position_size: binanceConfig.maxPositionSize,
            stop_loss: binanceConfig.stopLoss,
            take_profit: binanceConfig.takeProfit,
            strategy: binanceConfig.strategy,
            operation_duration_minutes: binanceConfig.operationDuration,
            updated_at: new Date().toISOString()
        });

        if (error) throw error;
        addLog('Configuración guardada exitosamente en la nube.', 'success');
    } catch (e) {
        console.error(e);
        addLog('Error al guardar configuración.', 'error');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const volatility = (Math.random() - 0.5) * 50;
        const newPrice = prev.price + volatility;
        setPriceHistory(h => [...h.slice(1), newPrice]);
        return { ...prev, price: newPrice, change24h: prev.change24h + (volatility / 1000) };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (botStatus !== 'EXECUTING') return;
    const analysisInterval = setInterval(() => {
      if (Math.random() > 0.7) addLog(`Análisis (${binanceConfig.strategy}): Señal detectada`, 'info');
    }, 2000);
    const executionInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        const orderId = Math.floor(Math.random() * 90000000) + 10000000;
        addLog(`Orden #${orderId} ENVIADA. Apalancamiento: ${binanceConfig.leverage}x`, 'info');
        setTimeout(() => addLog(`Orden #${orderId} EJECUTADA.`, 'success'), 800);
      }
    }, 4500);
    return () => { clearInterval(analysisInterval); clearInterval(executionInterval); };
  }, [botStatus, binanceConfig]);

  const toggleBot = () => {
    if (botStatus === 'IDLE' || botStatus === 'HALTED') {
      if (!binanceConfig.apiKey) { setCurrentView('SETTINGS'); addLog('Error: Configure API Keys primero.', 'error'); return; }
      setBotStatus('CONNECTING');
      addLog(`Conectando a ${binanceConfig.useTestnet ? 'Testnet' : 'Mainnet'}...`, 'system');
      setTimeout(() => {
        addLog(`Conexión establecida. Duración sesión: ${binanceConfig.operationDuration}m`, 'system');
        setBotStatus('EXECUTING');
      }, 2000);
    } else {
      setBotStatus('HALTED');
      setTimeout(() => setBotStatus('IDLE'), 1000);
    }
  };

  if (loading) {
      return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans selection:bg-yellow-500/30">
      {/* SIDEBAR */}
      <aside className="w-full md:w-20 md:h-screen md:sticky md:top-0 bg-slate-900 border-r border-slate-800 flex flex-row md:flex-col items-center py-4 gap-6 z-20 shrink-0 overflow-x-auto justify-center md:justify-start">
        <div className="h-10 w-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] shrink-0 cursor-pointer" onClick={() => setCurrentView('DASHBOARD')}>
           <Icons.Binance />
        </div>
        <nav className="flex flex-row md:flex-col gap-4 md:gap-8">
          <button 
            onClick={() => setCurrentView('DASHBOARD')}
            className={`p-3 rounded-lg transition-all ${currentView === 'DASHBOARD' ? 'bg-slate-800 text-yellow-400 shadow-inner shadow-yellow-900/20' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <Icons.Activity />
          </button>
          
          <button 
            onClick={() => setCurrentView('EVA_BRAIN')}
            className={`p-3 rounded-lg transition-all ${currentView === 'EVA_BRAIN' ? 'bg-slate-800 text-yellow-400 shadow-inner shadow-yellow-900/20' : 'text-slate-500 hover:text-slate-200'}`}
            title="EVA Core"
          >
            <Icons.Bot />
          </button>

          <button 
            onClick={() => setCurrentView('SETTINGS')}
            className={`p-3 rounded-lg transition-all ${currentView === 'SETTINGS' ? 'bg-slate-800 text-yellow-400 shadow-inner shadow-yellow-900/20' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <Icons.Settings />
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* HEADER (Conditional or Shared) */}
        {currentView === 'DASHBOARD' && (
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-4 sm:px-6 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">BTC / USDT <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">BINANCE</span></h1>
            <div className="hidden sm:block h-8 w-px bg-slate-800 mx-2"></div>
            <div className={`text-xl sm:text-2xl font-mono font-medium ${marketData.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{marketData.price.toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${dbConnected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
                {dbConnected ? <span className="text-emerald-400"><Icons.Database /></span> : <span className="text-rose-400"><Icons.CloudOff /></span>}
                <span className={`text-xs font-bold ${dbConnected ? 'text-emerald-400' : 'text-rose-400'}`}>{dbConnected ? 'DB: ON' : 'DB: OFF'}</span>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-500">Balance (BTC)</div>
              <div className="text-lg font-mono font-bold text-white">1.2405</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center"><span className="font-bold text-xs text-yellow-500">EVA</span></div>
          </div>
        </header>
        )}

        {/* VIEW ROUTING */}
        {currentView === 'SETTINGS' ? (
            <ConfigurationView config={binanceConfig} setConfig={setBinanceConfig} dbConnected={dbConnected} onSave={saveConfigToDb} />
        ) : currentView === 'EVA_BRAIN' ? (
           <EvaCore />
        ) : (
            <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto">
                <div className="lg:col-span-9 flex flex-col gap-4">
                    <section className="h-[400px] lg:h-[500px] bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col shadow-xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 z-10 gap-2">
                            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                                {(['line', 'candle', 'bar', 'area'] as ChartType[]).map(t => (
                                    <button key={t} onClick={() => setChartType(t)} className={`p-1.5 rounded transition-all ${chartType === t ? 'bg-slate-800 text-yellow-400' : 'text-slate-500'}`}>
                                        {t === 'line' ? <Icons.Activity /> : t === 'candle' ? <Icons.Chart /> : t === 'bar' ? <Icons.BarChart /> : <Icons.Layers />}
                                    </button>
                                ))}
                                <button onClick={() => setChartType('depth')} className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${chartType === 'depth' ? 'bg-slate-800 text-yellow-400' : 'text-slate-500'}`}>DEPTH</button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500"><span className={`w-2 h-2 rounded-full ${botStatus === 'EXECUTING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span> WebSocket</div>
                        </div>
                        <div className="flex-1 relative z-10"><AdvancedChart data={priceHistory} type={chartType} /></div>
                    </section>
                    <section className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 h-[300px] md:h-auto min-h-[300px] rounded-xl overflow-hidden"><BotTerminal logs={logs} status={botStatus} /></div>
                        <div className="w-full md:w-72 bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col justify-between shadow-xl gap-4 relative">
                            {botStatus === 'EXECUTING' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50 animate-pulse"></div>}
                            <div>
                                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Icons.Binance /> AGENTE AUTÓNOMO</h3>
                                <div className="space-y-4">
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Estrategia Activa</label>
                                        <div className="text-xs text-yellow-400 font-mono">{binanceConfig.strategy}</div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">PNL 24h</span><span className="text-emerald-400 font-mono">+$1,240.50</span></div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[65%]"></div></div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={toggleBot} disabled={botStatus === 'CONNECTING'} className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${botStatus === 'IDLE' || botStatus === 'HALTED' ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]' : botStatus === 'CONNECTING' ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.2)]'}`}>
                                {botStatus === 'IDLE' || botStatus === 'HALTED' ? <><Icons.Play /> INICIAR MOTOR</> : botStatus === 'CONNECTING' ? 'CONECTANDO...' : <><Icons.Stop /> DETENER SISTEMA</>}
                            </button>
                        </div>
                    </section>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <section className="h-[400px] lg:h-[calc(100%-350px)] min-h-[400px] bg-slate-900/50 rounded-xl border border-slate-800 p-3 shadow-xl overflow-hidden flex flex-col">
                        <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex justify-between"><span>Libro de Órdenes</span><span className="text-[10px] bg-slate-800 px-1 rounded text-slate-300">BTCUSDT</span></h3>
                        <OrderBook price={marketData.price} />
                    </section>
                    <section className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl opacity-75 pointer-events-none relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10"><div className="text-xs font-mono text-yellow-500 bg-black/80 px-3 py-1 rounded border border-yellow-500/30">TRADING AUTOMÁTICO ACTIVO</div></div>
                        <div className="flex bg-slate-800 rounded p-1 mb-4"><button className="flex-1 py-1.5 text-sm font-bold rounded bg-emerald-600 text-white shadow">Comprar</button><button className="flex-1 py-1.5 text-sm font-bold rounded text-slate-400 hover:text-white">Vender</button></div>
                        <div className="space-y-3">
                            <div><label className="text-xs text-slate-500 mb-1 block">Precio (USDT)</label><div className="flex items-center bg-slate-950 border border-slate-700 rounded px-3 py-2"><input type="text" value={marketData.price.toFixed(2)} readOnly className="bg-transparent w-full text-right text-sm text-white focus:outline-none" /></div></div>
                            <div className="flex justify-between text-xs text-slate-500 pt-2"><span>Disponible</span><span>1.24 BTC</span></div>
                            <button className="w-full py-3 mt-2 rounded bg-slate-700 text-slate-400 font-bold uppercase tracking-wider">Trading Manual Bloqueado</button>
                        </div>
                    </section>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}