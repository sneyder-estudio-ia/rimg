
import React, { useState, useEffect } from 'react';

// --- ICONOS LOCALES PARA ESTE MÓDULO ---
const Icons = {
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  TrendingDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Cpu: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
};

// --- DATOS SIMULADOS (MOCK DATA) ---
const MOCK_STRATEGIES = [
  { id: 1, name: 'SCALPING_MACD_V2', status: 'ACTIVE', risk: 'HIGH', allocation: '40%' },
  { id: 2, name: 'SWING_BTC_LITE', status: 'WAITING', risk: 'LOW', allocation: '25%' },
  { id: 3, name: 'AI_SENTIMENT_ANALYSIS', status: 'ANALYZING', risk: 'MED', allocation: '35%' },
];

const MOCK_COINS = [
  { id: 'BTC', pair: 'BTC/USDT', type: 'LONG', entry: 64200, current: 64550, pnl: 350.50 },
  { id: 'SOL', pair: 'SOL/USDT', type: 'SHORT', entry: 145.20, current: 148.10, pnl: -29.00 },
  { id: 'ETH', pair: 'ETH/USDT', type: 'LONG', entry: 3400, current: 3420, pnl: 20.00 },
];

export const EvaCore = () => {
  const [balance, setBalance] = useState(12450.00);
  const [profit, setProfit] = useState(1850.50);
  const [loss, setLoss] = useState(320.10);

  const netPnl = profit - loss;
  
  let alertStatus = 'NEUTRAL';
  let alertColor = 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
  let alertMessage = 'ALERTA AMARILLA // RENDIMIENTO ESTABLE';
  let glowEffect = 'shadow-yellow-900/20';

  if (netPnl > 500) {
    alertStatus = 'WINNING';
    alertColor = 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10';
    alertMessage = 'ALERTA VERDE // SISTEMA EN GANANCIA';
    glowEffect = 'shadow-emerald-900/20';
  } else if (netPnl < 0) {
    alertStatus = 'LOSING';
    alertColor = 'text-rose-500 border-rose-500/50 bg-rose-500/10';
    alertMessage = 'ALERTA ROJA // PÉRDIDAS DETECTADAS';
    glowEffect = 'shadow-rose-900/20';
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setProfit(prev => prev + (Math.random() > 0.6 ? Math.random() * 5 : 0));
      setLoss(prev => prev + (Math.random() > 0.8 ? Math.random() * 2 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 h-full w-full bg-slate-950 relative overflow-y-auto p-4 md:p-8 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/30 via-slate-950 to-slate-950 pointer-events-none fixed"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-4 gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
                    <Icons.Cpu /> ESTADÍSTICA DE COMBATE
                </h1>
                <p className="text-slate-500 font-mono text-xs mt-1">METRICAS EN TIEMPO REAL // NODO: EVA-01</p>
            </div>
            
            <div className={`px-6 py-3 rounded-lg border-2 font-bold font-mono tracking-widest flex items-center gap-3 animate-pulse shadow-lg ${alertColor} ${glowEffect}`}>
                <Icons.Alert />
                {alertMessage}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-blue-500"><Icons.Wallet /></div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Capital Total</h3>
                <div className="text-3xl font-mono text-white font-bold">${balance.toFixed(2)}</div>
                <div className="h-1 w-full bg-slate-800 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[75%]"></div>
                </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500"><Icons.TrendingUp /></div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Ganancia Realizada</h3>
                <div className="text-3xl font-mono text-emerald-400 font-bold flex items-center gap-2">
                    +${profit.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-600 font-mono mt-2">RENDIMIENTO POSITIVO</div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-rose-500"><Icons.TrendingDown /></div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pérdida (Stop Loss)</h3>
                <div className="text-3xl font-mono text-rose-400 font-bold">-${loss.toFixed(2)}</div>
                <div className="text-[10px] text-rose-800 font-mono mt-2">RIESGO CONTROLADO</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        ESTRATEGIAS NEURONALES
                    </h3>
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">CPU: 34%</span>
                </div>
                <div className="space-y-3">
                    {MOCK_STRATEGIES.map((strat) => (
                        <div key={strat.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                            <div>
                                <div className="text-sm font-bold text-slate-200">{strat.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1">
                                    RIESGO: <span className={strat.risk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}>{strat.risk}</span> // ASIGNACIÓN: {strat.allocation}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${strat.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                                <span className="text-xs font-mono text-slate-400">{strat.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        MONEDAS EN OPERACIÓN
                    </h3>
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">3 ACTIVAS</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="text-slate-500 border-b border-slate-800">
                            <tr>
                                <th className="pb-2 pl-2">PAR</th>
                                <th className="pb-2">TIPO</th>
                                <th className="pb-2 text-right">ENTRADA</th>
                                <th className="pb-2 text-right">PNL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {MOCK_COINS.map((coin) => (
                                <tr key={coin.id} className="group hover:bg-slate-800/30">
                                    <td className="py-3 pl-2 font-bold text-slate-200">{coin.pair}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${coin.type === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {coin.type}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right text-slate-400">${coin.entry.toLocaleString()}</td>
                                    <td className={`py-3 text-right font-bold ${coin.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {coin.pnl >= 0 ? '+' : ''}{coin.pnl.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
