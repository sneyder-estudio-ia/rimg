
import React from 'react';
import { MarketData } from '../../types';

// --- ICONOS LOCALES PARA ESTE MÓDULO ---
const Icons = {
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  TrendingDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Cpu: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
};

// --- ESTRATEGIAS ---
const MOCK_STRATEGIES = [
  { id: 1, name: 'SCALPING_MACD_REAL', status: 'ACTIVE', risk: 'HIGH', allocation: '100%' },
];

interface EvaCoreProps {
    marketData: MarketData;
    accountBalance: { asset: string, free: string, locked: string }[];
}

export const EvaCore = ({ marketData, accountBalance }: EvaCoreProps) => {
  // Filtrar balances reales significativos
  const significantBalances = accountBalance.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
  
  // Calcular valor estimado en USDT (muy básico, asumiendo USDT como base)
  const usdtBalance = significantBalances.find(b => b.asset === 'USDT');
  const totalUsdt = usdtBalance ? parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked) : 0;

  // Lógica de Alerta basada en movimiento de precio real
  let alertStatus = 'NEUTRAL';
  let alertColor = 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
  let alertMessage = 'ESPERANDO SEÑAL';
  let glowEffect = 'shadow-yellow-900/20';

  if (marketData.change24h > 2) {
    alertStatus = 'WINNING';
    alertColor = 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10';
    alertMessage = 'TENDENCIA ALCISTA FUERTE';
    glowEffect = 'shadow-emerald-900/20';
  } else if (marketData.change24h < -2) {
    alertStatus = 'LOSING';
    alertColor = 'text-rose-500 border-rose-500/50 bg-rose-500/10';
    alertMessage = 'TENDENCIA BAJISTA - PRECAUCIÓN';
    glowEffect = 'shadow-rose-900/20';
  }

  return (
    <div className="flex-1 h-full w-full bg-slate-950 relative overflow-y-auto p-4 md:p-8 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/30 via-slate-950 to-slate-950 pointer-events-none fixed"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-4 gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
                    <Icons.Cpu /> NÚCLEO DE EJECUCIÓN
                </h1>
                <p className="text-slate-500 font-mono text-xs mt-1">CONEXIÓN DIRECTA BINANCE // SIN LATENCIA</p>
            </div>
            
            <div className={`px-6 py-3 rounded-lg border-2 font-bold font-mono tracking-widest flex items-center gap-3 animate-pulse shadow-lg ${alertColor} ${glowEffect}`}>
                <Icons.Alert />
                {alertMessage}
            </div>
        </div>

        {/* CONTENEDORES DE DINERO (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-blue-500"><Icons.Wallet /></div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Balance USDT (Disp.)</h3>
                <div className="text-3xl font-mono text-white font-bold">
                    {usdtBalance ? parseFloat(usdtBalance.free).toFixed(2) : '0.00'}
                    <span className="text-sm text-slate-500 ml-2">USDT</span>
                </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500"><Icons.TrendingUp /></div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Precio Real BTC</h3>
                <div className={`text-3xl font-mono font-bold flex items-center gap-2 ${marketData.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${marketData.price.toFixed(2)}
                </div>
                <div className={`text-[10px] font-mono mt-2 ${marketData.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    CAMBIO 24H: {marketData.change24h > 0 ? '+' : ''}{marketData.change24h}%
                </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-rose-500"><Icons.TrendingDown /></div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Volumen 24h</h3>
                <div className="text-3xl font-mono text-slate-300 font-bold">{marketData.volume}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-2">LIQUIDEZ DE MERCADO</div>
            </div>
        </div>

        {/* SECCIÓN INFERIOR: CARTERA REAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        ACTIVOS EN CARTERA (SPOT)
                    </h3>
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">{significantBalances.length} ACTIVOS</span>
                </div>
                <div className="overflow-x-auto">
                    {significantBalances.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">No se detectaron fondos o API Key no configurada.</div>
                    ) : (
                        <table className="w-full text-left text-xs font-mono">
                            <thead className="text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="pb-2 pl-2">ACTIVO</th>
                                    <th className="pb-2 text-right">LIBRE</th>
                                    <th className="pb-2 text-right">BLOQUEADO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {significantBalances.map((asset) => (
                                    <tr key={asset.asset} className="group hover:bg-slate-800/30">
                                        <td className="py-3 pl-2 font-bold text-slate-200">{asset.asset}</td>
                                        <td className="py-3 text-right text-emerald-400">{parseFloat(asset.free).toFixed(4)}</td>
                                        <td className="py-3 text-right text-rose-400">{parseFloat(asset.locked).toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        ESTRATEGIAS
                    </h3>
                </div>
                <div className="space-y-3">
                    {MOCK_STRATEGIES.map((strat) => (
                        <div key={strat.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                            <div>
                                <div className="text-sm font-bold text-slate-200">{strat.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1">
                                    ASIGNACIÓN: {strat.allocation}
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
        </div>
      </div>
    </div>
  );
};
