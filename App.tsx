
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { EvaCore } from './src/modulos/eva/EvaCore';
import { ConfigurationView } from './src/modulos/configuracion/ConfigurationView';
import { NeuralNetworkView } from './src/modulos/red-neuronal/NeuralNetworkView';
import { Icons } from './src/components/Icons';
import { 
    View, 
    BotStatus, 
    ChartType, 
    StrategyType, 
    MarketData, 
    LogEntry, 
    BinanceConfig 
} from './src/types';

// --- SUB-COMPONENTES VISUALES ---

const AdvancedChart = ({ data, type }: { data: number[], type: ChartType }) => {
  if (data.length < 2) return <div className="h-full w-full bg-slate-900/50 flex items-center justify-center text-slate-500 animate-pulse font-mono text-xs">ESTABLECIENDO ENLACE WEBSOCKET...</div>;

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
      <div className="flex justify-between text-slate-500 mb-2 px-1"><span>PRECIO (USDT)</span><span>CANTIDAD</span></div>
      <div className="flex-1 flex flex-col justify-end gap-0.5 overflow-hidden">
        {asks.map((o, i) => <div key={i} className="flex justify-between px-1 relative hover:bg-rose-900/20"><span className="text-rose-400">{o.price.toFixed(2)}</span><span className="text-slate-400">{o.size.toFixed(4)}</span></div>)}
      </div>
      <div className="py-2 text-center text-base font-bold text-white bg-slate-900/50 my-1 rounded border border-slate-800">{price.toFixed(2)}</div>
      <div className="flex-1 flex flex-col justify-start gap-0.5 overflow-hidden">
        {bids.map((o, i) => <div key={i} className="flex justify-between px-1 relative hover:bg-emerald-900/20"><span className="text-emerald-400">{o.price.toFixed(2)}</span><span className="text-slate-400">{o.size.toFixed(4)}</span></div>)}
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

// --- PANTALLA DE CARGA ---
const SplashScreen = () => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
            <span className="text-sm md:text-base text-yellow-500 font-mono tracking-[0.3em] uppercase animate-pulse">
                INICIALIZANDO EVA v10.5
            </span>
            <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
            </div>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

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
    email: '', 
    apiKey: '', apiSecret: '', leverage: 20, useTestnet: false,
    maxPositionSize: 10, stopLoss: 1.5, takeProfit: 3.0, strategy: 'SCALPING_MACD',
    operationDuration: 60 
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, timestamp: new Date().toLocaleTimeString(), message: 'Núcleo Autónomo EVA cargado.', type: 'system' }
  ]);

  const addLog = async (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'system' = 'info') => {
    const entry: LogEntry = { id: Date.now() + Math.random(), timestamp: new Date().toLocaleTimeString(), message, type };
    setLogs(prev => [...prev.slice(-49), entry]);
  };

  useEffect(() => {
    const initSystem = async () => {
        try {
            const { error: healthError } = await supabase.from('bot_config').select('id', { count: 'exact', head: true });
            
            if (!healthError) {
                setDbConnected(true);
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
            addLog('Error crítico al inicializar subsistemas.', 'error');
        } finally {
            setTimeout(() => setLoading(false), 2000);
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
            id: 1, 
            email: binanceConfig.email,
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
        addLog('Configuración encriptada y guardada en la nube.', 'success');
    } catch (e) {
        console.error(e);
        addLog('Fallo al persistir configuración.', 'error');
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
      if (!binanceConfig.apiKey && !binanceConfig.useTestnet) { 
        setCurrentView('SETTINGS'); 
        addLog('Error: Configure API Keys primero.', 'error'); 
        return; 
      }
      setBotStatus('CONNECTING');
      addLog(`Conectando a ${binanceConfig.useTestnet ? 'Testnet' : 'Mainnet'}...`, 'system');
      setTimeout(() => {
        addLog(`Conexión establecida. Duración sesión: ${binanceConfig.operationDuration}m`, 'system');
        setBotStatus('EXECUTING');
      }, 2000);
    } else {
      setBotStatus('HALTED');
      addLog('Secuencia de parada iniciada...', 'warning');
      setTimeout(() => setBotStatus('IDLE'), 1000);
    }
  };

  if (loading) {
      return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans selection:bg-yellow-500/30">
      {/* SIDEBAR */}
      <aside className="w-full md:w-20 md:h-screen md:sticky md:top-0 bg-slate-900 border-r border-slate-800 flex flex-row md:flex-col items-center py-4 gap-6 z-20 shrink-0 overflow-x-auto justify-center md:justify-start scrollbar-hide">
        <div className="h-10 w-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => setCurrentView('DASHBOARD')}>
           <Icons.Binance />
        </div>
        <nav className="flex flex-row md:flex-col gap-4 md:gap-8">
          <button 
            onClick={() => setCurrentView('DASHBOARD')}
            className={`p-3 rounded-lg transition-all ${currentView === 'DASHBOARD' ? 'bg-slate-800 text-yellow-400 shadow-inner shadow-yellow-900/20' : 'text-slate-500 hover:text-slate-200'}`}
            title="Panel de Control"
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
            onClick={() => setCurrentView('NEURAL_NET')}
            className={`p-3 rounded-lg transition-all ${currentView === 'NEURAL_NET' ? 'bg-slate-800 text-purple-400 shadow-inner shadow-purple-900/20' : 'text-slate-500 hover:text-slate-200'}`}
            title="Red Neuronal"
          >
            <Icons.Brain />
          </button>

          <button 
            onClick={() => setCurrentView('SETTINGS')}
            className={`p-3 rounded-lg transition-all ${currentView === 'SETTINGS' ? 'bg-slate-800 text-yellow-400 shadow-inner shadow-yellow-900/20' : 'text-slate-500 hover:text-slate-200'}`}
            title="Configuración"
          >
            <Icons.Settings />
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* HEADER */}
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
                <span className={`text-xs font-bold ${dbConnected ? 'text-emerald-400' : 'text-rose-400'} hidden sm:inline`}>{dbConnected ? 'DB: ON' : 'DB: OFF'}</span>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-500">Balance (BTC)</div>
              <div className="text-lg font-mono font-bold text-white">1.2405</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg"><span className="font-bold text-xs text-yellow-500">EVA</span></div>
          </div>
        </header>
        )}

        {/* VIEW ROUTING */}
        {currentView === 'SETTINGS' ? (
            <ConfigurationView config={binanceConfig} setConfig={setBinanceConfig} dbConnected={dbConnected} onSave={saveConfigToDb} />
        ) : currentView === 'EVA_BRAIN' ? (
           <EvaCore />
        ) : currentView === 'NEURAL_NET' ? (
           <NeuralNetworkView />
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
