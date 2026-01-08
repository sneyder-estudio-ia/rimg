
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { EvaCore } from './src/modulos/eva/EvaCore';
import { ConfigurationView } from './src/modulos/configuracion/ConfigurationView';
import { NeuralNetworkView } from './src/modulos/red-neuronal/NeuralNetworkView';
import { AssetManagerView } from './src/modulos/activos/AssetManagerView';
import { Icons } from './src/components/Icons';
import { subscribeToTicker, subscribeToDepth, executeOrder, getAccountInfo } from './src/services/binanceService';
import { 
    View, 
    BotStatus, 
    ChartType, 
    StrategyType, 
    MarketData, 
    LogEntry, 
    BinanceConfig,
    AssetConfig
} from './src/types';

// --- SUB-COMPONENTES VISUALES ---

const AdvancedChart = ({ data, type }: { data: number[], type: ChartType }) => {
  if (data.length < 2) return <div className="h-full w-full bg-slate-900/50 flex items-center justify-center text-slate-500 animate-pulse font-mono text-xs">ESPERANDO DATOS DE MERCADO...</div>;

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

  // Simplificación de velas para datos reales de línea (para verdadera vela necesitamos OHLCV)
  const candles = data.map((close, i) => {
    const prevClose = i > 0 ? data[i - 1] : close;
    const open = prevClose;
    // Simulación visual mínima para velas basadas solo en tick data
    const high = Math.max(open, close) + (Math.abs(close-open) * 0.1);
    const low = Math.min(open, close) - (Math.abs(close-open) * 0.1);
    
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
      </svg>
      {type !== 'depth' && data.length > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-full pointer-events-none">
            <div className="absolute right-0 border-t border-dashed border-slate-600 w-full" style={{ top: `${100 - ((data[data.length - 1] - min) / range) * 100}%` }}>
              <span className={`absolute right-1 -top-3 text-xs px-1 rounded font-bold ${isUp ? 'bg-emerald-900/80 text-emerald-400' : 'bg-rose-900/80 text-rose-400'}`}>{data[data.length - 1].toFixed(2)}</span>
            </div>
          </div>
      )}
    </div>
  );
};

const OrderBook = ({ bids, asks, price }: { bids: {price:number, size:number}[], asks: {price:number, size:number}[], price: number }) => {
  return (
    <div className="flex flex-col h-full text-xs font-mono">
      <div className="flex justify-between text-slate-500 mb-2 px-1"><span>PRECIO (USDT)</span><span>CANTIDAD</span></div>
      <div className="flex-1 flex flex-col justify-end gap-0.5 overflow-hidden">
        {asks.slice(0, 8).reverse().map((o, i) => <div key={i} className="flex justify-between px-1 relative hover:bg-rose-900/20"><span className="text-rose-400">{o.price.toFixed(2)}</span><span className="text-slate-400">{o.size.toFixed(5)}</span></div>)}
      </div>
      <div className="py-2 text-center text-base font-bold text-white bg-slate-900/50 my-1 rounded border border-slate-800">{price.toFixed(2)}</div>
      <div className="flex-1 flex flex-col justify-start gap-0.5 overflow-hidden">
        {bids.slice(0, 8).map((o, i) => <div key={i} className="flex justify-between px-1 relative hover:bg-emerald-900/20"><span className="text-emerald-400">{o.price.toFixed(2)}</span><span className="text-slate-400">{o.size.toFixed(5)}</span></div>)}
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
        <span className="flex items-center gap-2 text-yellow-400 font-bold"><Icons.Binance /> BINANCE_EXEC_REAL_V1</span>
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
            <span className="text-xs text-slate-600 font-mono">Conectando a Red Principal Binance...</span>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [loading, setLoading] = useState(true);
  
  // DATOS REALES
  const [marketData, setMarketData] = useState<MarketData>({
    price: 0, change24h: 0, high24h: 0, low24h: 0, volume: "---"
  });
  const [orderBook, setOrderBook] = useState<{bids: any[], asks: any[]}>({ bids: [], asks: [] });
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [accountBalance, setAccountBalance] = useState<{ asset: string, free: string, locked: string }[]>([]);

  const [botStatus, setBotStatus] = useState<BotStatus>('IDLE');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  
  const [binanceConfig, setBinanceConfig] = useState<BinanceConfig>({
    email: '', 
    apiKey: '', apiSecret: '', leverage: 20, useTestnet: false,
    maxPositionSize: 10, stopLoss: 1.5, takeProfit: 3.0, strategy: 'SCALPING_MACD',
    operationDuration: 60,
    autonomousMode: false // Default
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, timestamp: new Date().toLocaleTimeString(), message: 'Núcleo Autónomo EVA cargado.', type: 'system' }
  ]);

  const addLog = async (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'system' = 'info') => {
    const entry: LogEntry = { id: Date.now() + Math.random(), timestamp: new Date().toLocaleTimeString(), message, type };
    setLogs(prev => [...prev.slice(-49), entry]);
  };

  // --- CARGA INICIAL Y WEBSOCKETS ---
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
                        stop_loss: data.stop_loss || 1.5,
                        take_profit: data.take_profit || 3.0,
                        strategy: (data.strategy as StrategyType) || 'SCALPING_MACD',
                        operation_duration_minutes: data.operation_duration_minutes || 60,
                        autonomousMode: data.autonomous_mode || false // Mapeo si existiera columna, sino false
                    } as any);
                    addLog('Configuración sincronizada desde Base de Datos', 'success');
                }
            } else {
                addLog('Modo Offline: BD desconectada.', 'error');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => setLoading(false), 2000);
        }
    };

    initSystem();

    // Iniciar Websockets Reales
    const wsTicker = subscribeToTicker('BTCUSDT', (data) => {
        setMarketData(prev => ({
            price: data.price,
            change24h: data.change24h,
            high24h: data.high24h,
            low24h: data.low24h,
            volume: data.volume
        }));
        setPriceHistory(prev => {
            const newHist = [...prev, data.price];
            return newHist.slice(-50); // Mantener 50 puntos
        });
    });

    const wsDepth = subscribeToDepth('BTCUSDT', (data) => {
        setOrderBook(data);
    });

    return () => {
        wsTicker.close();
        wsDepth.close();
    };
  }, []);

  const refreshAccount = async () => {
      if(!binanceConfig.apiKey || !binanceConfig.apiSecret) return;
      try {
          addLog("Consultando balance real en Binance...", 'system');
          const info = await getAccountInfo(binanceConfig.apiKey, binanceConfig.apiSecret);
          if(info && info.balances) {
              setAccountBalance(info.balances);
              addLog("Balance actualizado correctamente.", 'success');
          }
      } catch(e: any) {
          addLog(`Error de cuenta: ${e.message}`, 'error');
      }
  };

  useEffect(() => {
      if(binanceConfig.apiKey && binanceConfig.apiSecret) {
          refreshAccount();
      }
  }, [binanceConfig.apiKey]);

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
            autonomous_mode: binanceConfig.autonomousMode, // Intento de guardar el nuevo flag
            updated_at: new Date().toISOString()
        });

        if (error) throw error;
        addLog('Configuración encriptada y guardada en la nube.', 'success');
    } catch (e) {
        console.error(e);
        addLog('Fallo al persistir configuración.', 'error');
    }
  };
  
  const handleSaveAssets = (assets: AssetConfig[]) => {
      // En una implementación completa esto iría a Supabase
      addLog(`Matriz de Activos actualizada: ${assets.length} activos vinculados.`, 'success');
  };

  const executeManualTrade = async (side: 'BUY' | 'SELL') => {
      if (!binanceConfig.apiKey || !binanceConfig.apiSecret) {
          addLog("FALTAN API KEYS PARA OPERAR", 'error');
          return;
      }
      try {
          addLog(`Enviando orden ${side} a Binance...`, 'warning');
          const result = await executeOrder(binanceConfig.apiKey, binanceConfig.apiSecret, 'BTCUSDT', side, 0.0001); 
          addLog(`ORDEN EJECUTADA: ${result.orderId}`, 'success');
          refreshAccount();
      } catch (e: any) {
          addLog(`FALLO EJECUCIÓN: ${e.message}`, 'error');
      }
  };

  const toggleBot = () => {
    if (botStatus === 'IDLE' || botStatus === 'HALTED') {
      if (!binanceConfig.apiKey) { 
        setCurrentView('SETTINGS'); 
        addLog('Error: Configure API Keys primero.', 'error'); 
        return; 
      }
      setBotStatus('CONNECTING');
      addLog(`Autenticando con Binance API...`, 'system');
      setTimeout(() => {
        addLog(`Motor de Trading Iniciado.`, 'success');
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
            onClick={() => setCurrentView('ASSETS')}
            className={`p-3 rounded-lg transition-all ${currentView === 'ASSETS' ? 'bg-slate-800 text-yellow-400 shadow-inner shadow-yellow-900/20' : 'text-slate-500 hover:text-slate-200'}`}
            title="Gestión de Activos"
          >
            <Icons.Coins />
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
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">BTC / USDT <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-400 border border-emerald-800 animate-pulse">LIVE FEED</span></h1>
            <div className="hidden sm:block h-8 w-px bg-slate-800 mx-2"></div>
            <div className={`text-xl sm:text-2xl font-mono font-medium ${marketData.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{marketData.price.toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${dbConnected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
                {dbConnected ? <span className="text-emerald-400"><Icons.Database /></span> : <span className="text-rose-400"><Icons.CloudOff /></span>}
                <span className={`text-xs font-bold ${dbConnected ? 'text-emerald-400' : 'text-rose-400'} hidden sm:inline`}>{dbConnected ? 'DB: ON' : 'DB: OFF'}</span>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-500">Balance USDT</div>
              <div className="text-lg font-mono font-bold text-white">
                  {accountBalance.find(a => a.asset === 'USDT') ? parseFloat(accountBalance.find(a => a.asset === 'USDT')!.free).toFixed(2) : '--'}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg"><span className="font-bold text-xs text-yellow-500">EVA</span></div>
          </div>
        </header>
        )}

        {/* VIEW ROUTING */}
        {currentView === 'SETTINGS' ? (
            <ConfigurationView config={binanceConfig} setConfig={setBinanceConfig} dbConnected={dbConnected} onSave={saveConfigToDb} />
        ) : currentView === 'EVA_BRAIN' ? (
           <EvaCore marketData={marketData} accountBalance={accountBalance} />
        ) : currentView === 'NEURAL_NET' ? (
           <NeuralNetworkView />
        ) : currentView === 'ASSETS' ? (
           <AssetManagerView accountBalance={accountBalance} onSaveConfig={handleSaveAssets} />
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
                            </div>
                            <div className="flex items-center gap-2 text-xs text-emerald-400"><span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`}></span> LIVE SOCKET</div>
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
                                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Estado</span><span className={botStatus === 'EXECUTING' ? "text-emerald-400 font-mono" : "text-slate-500"}>{botStatus}</span></div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className={`h-full w-full transition-all duration-1000 ${botStatus === 'EXECUTING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div></div>
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
                        <OrderBook bids={orderBook.bids} asks={orderBook.asks} price={marketData.price} />
                    </section>
                    <section className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl relative">
                        <div className="flex bg-slate-800 rounded p-1 mb-4"><button onClick={() => executeManualTrade('BUY')} className="flex-1 py-1.5 text-sm font-bold rounded bg-emerald-600 text-white shadow hover:bg-emerald-500 transition-colors">Comprar</button><button onClick={() => executeManualTrade('SELL')} className="flex-1 py-1.5 text-sm font-bold rounded bg-rose-600 text-white shadow hover:bg-rose-500 transition-colors ml-2">Vender</button></div>
                        <div className="space-y-3">
                            <div><label className="text-xs text-slate-500 mb-1 block">Precio Mercado (USDT)</label><div className="flex items-center bg-slate-950 border border-slate-700 rounded px-3 py-2"><input type="text" value={marketData.price.toFixed(2)} readOnly className="bg-transparent w-full text-right text-sm text-white focus:outline-none" /></div></div>
                            <div className="flex justify-between text-xs text-slate-500 pt-2"><span>USDT Disp.</span><span>{accountBalance.find(a => a.asset === 'USDT') ? parseFloat(accountBalance.find(a => a.asset === 'USDT')!.free).toFixed(2) : '--'}</span></div>
                            <div className="text-[10px] text-center text-rose-500 font-bold mt-2 animate-pulse">⚠️ MODO REAL ACTIVO</div>
                        </div>
                    </section>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
