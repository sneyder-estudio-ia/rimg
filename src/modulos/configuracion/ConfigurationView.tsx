
import React, { useState } from 'react';
import { BinanceConfig, StrategyType } from '../../types';
import { Icons } from '../../components/Icons';

export const ConfigurationView = ({ 
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
