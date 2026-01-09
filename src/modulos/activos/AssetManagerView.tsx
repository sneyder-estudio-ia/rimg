import React, { useState, useEffect } from 'react';
import { AssetConfig } from '../../types';
import { Icons } from '../../components/Icons';

// Lista maestra de activos soportados por EVA
const MASTER_ASSET_LIST = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'];

interface AssetManagerProps {
    accountBalance: { asset: string, free: string, locked: string }[];
    savedAssetConfigs: AssetConfig[];
    onSaveConfig: (configs: AssetConfig[]) => void;
    autonomousMode: boolean; 
    onToggleAutoMode: (enabled: boolean) => void; 
    onNavigate: () => void; // NUEVA PROP DE NAVEGACIÓN
}

export const AssetManagerView = ({ 
    accountBalance, 
    savedAssetConfigs, 
    onSaveConfig,
    autonomousMode,
    onToggleAutoMode,
    onNavigate
}: AssetManagerProps) => {
    
    const [assets, setAssets] = useState<AssetConfig[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    
    // Inicializar mezclando la lista maestra con los saldos reales y la CONFIGURACIÓN GUARDADA
    useEffect(() => {
        const mergedAssets: AssetConfig[] = MASTER_ASSET_LIST.map(symbol => {
            const savedConfig = savedAssetConfigs.find(config => config.symbol === symbol);
            
            const balanceData = accountBalance.find(b => b.asset === symbol);
            const totalBalance = balanceData 
                ? parseFloat(balanceData.free) + parseFloat(balanceData.locked) 
                : 0;

            if (savedConfig) {
                return {
                    ...savedConfig,
                    balance: totalBalance
                };
            }

            return {
                symbol,
                isActive: totalBalance > 0,
                allocationPercent: totalBalance > 0 ? 50 : 0,
                strategyOverride: 'GLOBAL',
                riskFactor: 5,
                balance: totalBalance
            };
        });

        // Añadir activos extra detectados en balance
        accountBalance.forEach(b => {
            if (!MASTER_ASSET_LIST.includes(b.asset) && b.asset !== 'USDT' && b.asset !== 'USDC' && b.asset !== 'FDUSD') {
                 const totalBalance = parseFloat(b.free) + parseFloat(b.locked);
                 const savedConfig = savedAssetConfigs.find(config => config.symbol === b.asset);
                 
                 if (savedConfig) {
                     mergedAssets.push({ ...savedConfig, balance: totalBalance });
                 } else if (totalBalance > 0) {
                     mergedAssets.push({
                        symbol: b.asset,
                        isActive: true,
                        allocationPercent: 50,
                        strategyOverride: 'GLOBAL',
                        riskFactor: 5,
                        balance: totalBalance
                     });
                 }
            }
        });

        setAssets(mergedAssets);
    }, [accountBalance, savedAssetConfigs]);

    const updateAsset = (symbol: string, updates: Partial<AssetConfig>) => {
        setAssets(prev => prev.map(a => a.symbol === symbol ? { ...a, ...updates } : a));
    };

    const handleSave = () => {
        setSaving(true);
        // Simulamos un guardado "Complejo" al núcleo
        setTimeout(() => {
            if (autonomousMode) {
                console.log("GUARDANDO CONFIGURACIÓN: MODO AUTO SOBERANO ACTIVADO");
                const fundedAssets = assets.filter(a => a.balance > 0).map(a => ({...a, isActive: true}));
                onSaveConfig(fundedAssets); 
            } else {
                onSaveConfig(assets);
            }
            
            setSaving(false);
            
            // --- PROTOCOLO DE ALERTA Y REDIRECCIÓN ---
            alert("✓ MATRIZ DE ACTIVOS SINCRONIZADA CON ÉXITO.\n\nEL PROTOCOLO EVA REINICIARÁ EL ANÁLISIS EN EL PANEL PRINCIPAL.");
            onNavigate();

        }, 1000);
    };

    const filteredAssets = assets.filter(a => a.symbol.includes(searchTerm.toUpperCase()));

    return (
        <div className="flex-1 h-full bg-slate-950 p-4 md:p-8 overflow-y-auto font-sans relative custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">
                
                {/* Header Complejo */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Icons.Coins /> PROTOCOLO DE ASIGNACIÓN DE ACTIVOS
                        </h1>
                        <p className="text-slate-500 font-mono text-xs mt-1">
                            CONFIGURACIÓN TÁCTICA POR MONEDA // VINCULACIÓN EVA-CORE
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="BUSCAR ACTIVO..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs font-mono text-white focus:border-yellow-500 outline-none w-48"
                                disabled={autonomousMode}
                            />
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${saving ? 'bg-slate-700 cursor-wait' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}
                        >
                            {saving ? 'SINCRONIZANDO...' : <><Icons.Save /> GUARDAR MATRIZ</>}
                        </button>
                    </div>
                </div>

                {/* --- NODO MAESTRO: ASIGNACIÓN AUTOMÁTICA --- */}
                <div className={`p-6 rounded-xl border transition-all relative overflow-hidden group ${autonomousMode ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)]' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Icons.Brain />
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                         <div className="flex-1">
                            <h2 className={`text-xl font-bold flex items-center gap-3 transition-colors ${autonomousMode ? 'text-indigo-400' : 'text-slate-300'}`}>
                                <Icons.Zap /> NODO DE EJECUCIÓN SOBERANA (AUTOMÁTICO)
                            </h2>
                            <p className="text-slate-500 font-mono text-xs mt-2 max-w-2xl leading-relaxed">
                                AL ACTIVAR ESTE PROTOCOLO, <strong className={autonomousMode ? "text-indigo-300" : ""}>EVA ASUME EL CONTROL TOTAL</strong>. ESCANEARÁ Y OPERARÁ AUTÓNOMAMENTE CUALQUIER ACTIVO CON SALDO POSITIVO EN LA CUENTA, IGNORANDO LA MATRIZ MANUAL INFERIOR Y APLICANDO ESTRATEGIAS DE OPORTUNIDAD GLOBAL.
                            </p>
                         </div>
                         
                         <div className="flex items-center gap-5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                            <div className="text-right">
                                <div className={`font-mono text-xs font-bold ${autonomousMode ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`}>
                                    {autonomousMode ? 'SISTEMA AUTÓNOMO: ONLINE' : 'CONTROL MANUAL: ACTIVO'}
                                </div>
                                <div className="text-[10px] text-slate-600 font-mono mt-1">
                                    {autonomousMode ? 'ESCANEO DE CARTERA: CONTINUO' : 'SELECCIÓN POR USUARIO'}
                                </div>
                            </div>
                            <button 
                                onClick={() => onToggleAutoMode(!autonomousMode)}
                                className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${autonomousMode ? 'bg-indigo-500 shadow-indigo-900/50' : 'bg-slate-700 shadow-slate-900/50'}`}
                            >
                                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${autonomousMode ? 'translate-x-8' : 'translate-x-0'}`}></div>
                            </button>
                         </div>
                    </div>
                    
                    {/* Background FX for Auto Mode */}
                    {autonomousMode && (
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-5 animate-pulse pointer-events-none"></div>
                    )}
                </div>

                {/* Grid de Tarjetas Complejas (Deshabilitado visualmente si AutoMode es ON) */}
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-500 ${autonomousMode ? 'opacity-40 grayscale pointer-events-none blur-[1px]' : ''}`}>
                    {filteredAssets.map((asset) => (
                        <div 
                            key={asset.symbol} 
                            className={`relative rounded-xl border-2 transition-all duration-300 overflow-hidden ${asset.isActive 
                                ? 'bg-slate-900/80 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' 
                                : 'bg-slate-950 border-slate-800 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}
                        >
                            {/* Cabecera de Tarjeta */}
                            <div className={`px-5 py-3 border-b flex justify-between items-center ${asset.isActive ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-slate-800'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${asset.isActive ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                        {asset.symbol[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white tracking-wide">{asset.symbol} / USDT</div>
                                        <div className="text-[10px] font-mono text-slate-400">
                                            BALANCE: <span className={asset.balance > 0 ? 'text-emerald-400' : 'text-slate-600'}>{asset.balance.toFixed(4)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => updateAsset(asset.symbol, { isActive: !asset.isActive })}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${asset.isActive ? 'bg-yellow-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${asset.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Cuerpo de Configuración (Solo visible si activo) */}
                            {asset.isActive && (
                                <div className="p-5 space-y-5">
                                    
                                    {/* 1. Asignación de Capital */}
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase">
                                            <span>Potencia de Asignación</span>
                                            <span className="text-yellow-400 font-mono">{asset.allocationPercent}%</span>
                                        </div>
                                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400" 
                                                style={{ width: `${asset.allocationPercent}%` }}
                                            ></div>
                                            <input 
                                                type="range" min="0" max="100" 
                                                value={asset.allocationPercent}
                                                onChange={(e) => updateAsset(asset.symbol, { allocationPercent: parseInt(e.target.value) })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* 2. Estrategia Override */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Estrategia</label>
                                            <select 
                                                value={asset.strategyOverride}
                                                onChange={(e) => updateAsset(asset.symbol, { strategyOverride: e.target.value as any })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded text-xs text-white p-2 outline-none focus:border-yellow-500 font-mono"
                                            >
                                                <option value="GLOBAL">GLOBAL (Default)</option>
                                                <option value="SCALPING">SCALPING (Agresivo)</option>
                                                <option value="SWING">SWING (Pasivo)</option>
                                                <option value="HOLD">ACUMULACIÓN</option>
                                            </select>
                                        </div>

                                        {/* 3. Factor de Riesgo */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Factor Riesgo</label>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => updateAsset(asset.symbol, { riskFactor: Math.max(1, asset.riskFactor - 1) })}
                                                    className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 font-bold"
                                                >-</button>
                                                <div className="flex-1 text-center font-mono text-sm font-bold text-rose-400 bg-slate-950 py-0.5 rounded border border-slate-800">
                                                    {asset.riskFactor}/10
                                                </div>
                                                <button 
                                                    onClick={() => updateAsset(asset.symbol, { riskFactor: Math.min(10, asset.riskFactor + 1) })}
                                                    className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 font-bold"
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-slate-800 mt-2">
                                         <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <div className={`w-2 h-2 rounded-full ${asset.balance > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                            {asset.balance > 0 ? 'ACTIVO DETECTADO EN CARTERA' : 'SIN FONDOS DISPONIBLES'}
                                         </div>
                                    </div>
                                </div>
                            )}
                            
                            {!asset.isActive && (
                                <div className="p-5 flex items-center justify-center h-40">
                                    <div className="text-center">
                                        <div className="text-slate-600 text-xs font-mono mb-2">SISTEMA DESVINCULADO</div>
                                        <button 
                                            onClick={() => updateAsset(asset.symbol, { isActive: true })}
                                            className="text-[10px] border border-slate-700 text-slate-400 px-3 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors"
                                        >
                                            ACTIVAR NODO
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};