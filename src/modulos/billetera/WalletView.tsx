
import React from 'react';
import { Icons } from '../../components/Icons';

interface WalletViewProps {
    accountBalance: { asset: string, free: string, locked: string }[];
    onNavigate: (view: any) => void;
    onRefresh: () => void;
    isLoading: boolean;
    hasApiKeys: boolean;
}

export const WalletView = ({ accountBalance, onNavigate, onRefresh, isLoading, hasApiKeys }: WalletViewProps) => {
    // 1. FILTRO DE CAPITAL: Solo mostrar activos donde (free + locked) > 0
    const fundedAssets = accountBalance.filter(item => {
        const total = parseFloat(item.free) + parseFloat(item.locked);
        return total > 0;
    });

    // Calcular patrimonio total estimado en USDT (Simplificado)
    // Nota: Esto suma los USDT directos. Para un total real en USD de portafolio se requeriría multiplicar cada crypto por su precio actual.
    // EVA v11 implementará el cálculo de portafolio total.
    const usdtBalance = fundedAssets.find(a => a.asset === 'USDT' || a.asset === 'FDUSD');
    const totalLiquidity = usdtBalance 
        ? parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked) 
        : 0;

    return (
        <div className="flex-1 h-full bg-slate-950 p-4 md:p-8 overflow-y-auto font-sans relative custom-scrollbar">
             {/* BACKGROUND FX */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none fixed"></div>
             
             <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Icons.Wallet /> BÓVEDA DIGITAL
                        </h1>
                        <p className="text-slate-500 font-mono text-xs mt-1">
                            CONEXIÓN BINANCE MAINNET // DATOS REALES
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="text-right hidden md:block">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Activos Financiados</div>
                            <div className="text-2xl font-mono font-bold text-white">{fundedAssets.length}</div>
                        </div>
                        <button 
                            onClick={onRefresh}
                            disabled={isLoading}
                            className={`p-3 rounded-lg border transition-all ${isLoading ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-900 border-slate-700 text-cyan-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <div className={`${isLoading ? 'animate-spin' : ''}`}>
                                <Icons.Zap />
                            </div>
                        </button>
                    </div>
                </div>

                {!hasApiKeys ? (
                    <div className="p-12 text-center border-2 border-rose-900/50 bg-rose-950/10 rounded-2xl">
                         <div className="w-16 h-16 bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-900/50">
                            <Icons.Shield />
                        </div>
                        <h3 className="text-white font-bold text-lg">ACCESO DENEGADO</h3>
                        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                            La bóveda digital requiere credenciales API de Binance para visualizar sus fondos reales.
                        </p>
                        <button 
                            onClick={() => onNavigate('SETTINGS')}
                            className="mt-6 px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-sm transition-colors"
                        >
                            CONFIGURAR API KEYS
                        </button>
                    </div>
                ) : (
                    <>
                        {/* RESUMEN DE LIQUIDEZ (USDT) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150">
                                    <Icons.Binance />
                                </div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Liquidez Estable (USDT/FDUSD)</h3>
                                <div className="text-4xl font-mono font-bold text-white tracking-tight flex items-baseline gap-1">
                                    {isLoading ? (
                                        <span className="text-slate-600 animate-pulse text-2xl">CARGANDO...</span>
                                    ) : (
                                        <>
                                            <span className="text-2xl text-slate-500">$</span>
                                            {totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </>
                                    )}
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-950/30 w-fit px-2 py-1 rounded border border-emerald-900/50">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    FONDO DISPONIBLE PARA TRADING
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center items-start space-y-4">
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Estado del enlace: <strong className="text-emerald-400">ENCRIPTADO & SEGURO</strong>.
                                    <br/>
                                    EVA tiene permisos de <em>Lectura</em> y <em>Spot Trading</em>. No se permiten retiros.
                                </p>
                                <button 
                                    onClick={() => onNavigate('ASSETS')}
                                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Icons.Settings /> GESTIONAR ASIGNACIÓN
                                </button>
                            </div>
                        </div>

                        {/* LISTA DE ACTIVOS (GRID) */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 pl-1 flex items-center gap-2">
                                <Icons.Coins /> Inventario Criptográfico Real
                            </h3>

                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="h-40 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse"></div>
                                    ))}
                                </div>
                            ) : fundedAssets.length === 0 ? (
                                <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                        <Icons.Wallet />
                                    </div>
                                    <h3 className="text-slate-300 font-bold">Billetera Vacía</h3>
                                    <p className="text-slate-500 text-xs mt-2">No se encontraron activos con saldo positivo en la cuenta conectada.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {fundedAssets.map((asset) => {
                                        const total = parseFloat(asset.free) + parseFloat(asset.locked);
                                        const isStable = ['USDT', 'USDC', 'FDUSD', 'DAI'].includes(asset.asset);
                                        
                                        return (
                                            <div key={asset.asset} className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:bg-slate-800 transition-all group relative overflow-hidden">
                                                {/* Barra decorativa superior */}
                                                <div className={`absolute top-0 left-0 right-0 h-1 ${isStable ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                                
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner ${isStable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                            {asset.asset[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-lg">{asset.asset}</div>
                                                            <div className="text-[10px] text-slate-500 font-mono">Spot Wallet</div>
                                                        </div>
                                                    </div>
                                                    {parseFloat(asset.locked) > 0 && (
                                                        <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                            En Orden
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-2 font-mono text-sm">
                                                    <div className="flex justify-between p-2 bg-slate-950/50 rounded border border-slate-800/50">
                                                        <span className="text-slate-500 text-[10px] uppercase">Disponible</span>
                                                        <span className="text-slate-200 font-bold">{parseFloat(asset.free).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between p-2 bg-slate-950/50 rounded border border-slate-800/50">
                                                        <span className="text-slate-500 text-[10px] uppercase">Bloqueado</span>
                                                        <span className="text-slate-400">{parseFloat(asset.locked).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 border-t border-slate-800 mt-2">
                                                        <span className="text-slate-400 text-[10px] font-bold uppercase mt-1">Total</span>
                                                        <span className={`font-bold ${isStable ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                            {total.toLocaleString()} {asset.asset}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}

             </div>
        </div>
    );
};
