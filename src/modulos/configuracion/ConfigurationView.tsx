
import React, { useState } from 'react';
import { BinanceConfig, StrategyType } from '../../types';
import { Icons } from '../../components/Icons';

// Configuración de fábrica para restauración
const FACTORY_DEFAULTS: BinanceConfig = {
    email: '',
    apiKey: '',
    apiSecret: '',
    leverage: 20,
    useTestnet: false,
    maxPositionSize: 10,
    stopLoss: 2.0,
    takeProfit: 5.0,
    strategy: 'SCALPING_MACD',
    operationDuration: 60,
    autonomousMode: false
};

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
    const [showResetModal, setShowResetModal] = useState(false);

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

    const handleFactoryReset = () => {
        setConfig(FACTORY_DEFAULTS);
        setShowResetModal(false);
        setSaved(true); // Usamos el estado saved para mostrar feedback visual verde momentáneo
        setTimeout(() => setSaved(false), 2000);
    };

    // --- MACROS DE ESTRATEGIA (PRESETS) ---
    const applyStrategyPreset = (strat: StrategyType) => {
        let updates: Partial<BinanceConfig> = {};
        
        switch (strat) {
            case 'SCALPING_MACD':
                updates = {
                    leverage: 20,
                    stopLoss: 0.5,
                    takeProfit: 1.5,
                    maxPositionSize: 15,
                    operationDuration: 45
                };
                break;
            case 'SWING_RSI':
                updates = {
                    leverage: 5,
                    stopLoss: 5.0,
                    takeProfit: 12.0,
                    maxPositionSize: 25,
                    operationDuration: 1440 // 24h
                };
                break;
            case 'AI_SENTIMENT':
                updates = {
                    leverage: 10,
                    stopLoss: 2.0,
                    takeProfit: 4.0,
                    maxPositionSize: 10,
                    operationDuration: 240 // 4h
                };
                break;
        }
        
        // Aplicar cambios
        setConfig({ ...config, strategy: strat, ...updates });
    };

    const STRATEGY_DETAILS = {
        SCALPING_MACD: {
            title: "Scalping de Alta Frecuencia",
            indicators: ["MACD (12, 26, 9)", "Bollinger Bands (20, 2)", "EMA (50)"],
            timeframe: "1m - 5m",
            logic: "Busca micro-rupturas de volatilidad confirmadas por cruces de MACD. Entradas rápidas con stops muy ajustados."
        },
        SWING_RSI: {
            title: "Swing Trading Momentum",
            indicators: ["RSI (14)", "EMA (200)", "Fibonacci Retracement"],
            timeframe: "1h - 4h",
            logic: "Identifica cambios de tendencia en zonas de sobreventa/sobrecompra a favor de la tendencia mayor (EMA 200)."
        },
        AI_SENTIMENT: {
            title: "EVA Sentiment & Order Flow",
            indicators: ["Order Book Imbalance", "Whale Watcher", "Social Sentiment"],
            timeframe: "Dinámico",
            logic: "Analiza la profundidad de mercado y el flujo de órdenes grandes para anticipar movimientos antes de que ocurran."
        }
    };

    return (
        <div className="flex-1 h-full p-6 md:p-8 overflow-y-auto bg-slate-950 custom-scrollbar relative">
            
            {/* --- MODAL FLOTANTE DE ALERTA (RESET) --- */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-slate-900 border-2 border-rose-600 rounded-xl max-w-md w-full shadow-[0_0_50px_rgba(225,29,72,0.3)] relative overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
                        {/* Scanline decorativa */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none"></div>
                        <div className="h-1 w-full bg-rose-600"></div>
                        
                        <div className="p-8 text-center relative z-10">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                                <span className="text-rose-500 transform scale-150"><Icons.Alert /></span>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">¿RESTAURAR FÁBRICA?</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Esta acción eliminará <strong className="text-rose-400">todas sus claves API, configuraciones de estrategia y preferencias personales</strong>. El sistema EVA volverá a su estado inicial.
                            </p>
                            
                            <div className="flex gap-3 justify-center">
                                <button 
                                    onClick={() => setShowResetModal(false)}
                                    className="px-6 py-3 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors border border-slate-700 text-xs tracking-wider"
                                >
                                    CANCELAR OPERACIÓN
                                </button>
                                <button 
                                    onClick={handleFactoryReset}
                                    className="px-6 py-3 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/40 text-xs tracking-wider flex items-center gap-2"
                                >
                                    <Icons.Shield /> CONFIRMAR BORRADO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                {/* Header */}
                <div className="border-b border-slate-800 pb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Icons.Settings /> CONFIGURACIÓN DEL SISTEMA
                        </h2>
                        <p className="text-slate-500 mt-2 font-mono text-sm">Versión del protocolo: EVA v10.5.3 // Acceso Administrativo</p>
                    </div>
                    {dbConnected ? 
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-2"><Icons.Database /> DB SINCRONIZADA</span> :
                        <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full text-xs font-bold flex items-center gap-2"><Icons.CloudOff /> DB DESCONECTADA</span>
                    }
                </div>

                {/* --- NODO DE AUTONOMÍA (NIVEL 5) --- */}
                <div className={`rounded-xl border-2 overflow-hidden transition-all duration-500 ${config.autonomousMode ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)]' : 'bg-slate-900/50 border-slate-800'}`}>
                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                         {config.autonomousMode && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 animate-pulse pointer-events-none"></div>}
                         
                         <div className="flex-1 relative z-10">
                             <div className="flex items-center gap-3 mb-2">
                                 <h3 className={`text-xl font-bold tracking-wider flex items-center gap-2 ${config.autonomousMode ? 'text-purple-400' : 'text-slate-300'}`}>
                                     <Icons.Brain /> MODO AUTÓNOMA (Soberanía de IA)
                                 </h3>
                                 {config.autonomousMode && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded animate-pulse">ACTIVO</span>}
                             </div>
                             <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                                AL ACTIVAR ESTE PROTOCOLO, <strong className="text-white">EVA ANULA LOS LÍMITES DE INTERVENCIÓN HUMANA</strong>. EL SISTEMA TOMARÁ DECISIONES DE COMPRA/VENTA INSTANTÁNEAS BASADAS EN SU PROPIA HEURÍSTICA SIN SOLICITAR CONFIRMACIÓN.
                             </p>
                             {config.autonomousMode && (
                                 <div className="mt-3 flex items-center gap-2 text-rose-400 text-xs font-bold font-mono">
                                     <Icons.Alert /> ADVERTENCIA: RIESGO DE CAPITAL TOTAL ASUMIDO POR EL USUARIO.
                                 </div>
                             )}
                         </div>

                         <div className="relative z-10">
                            <button 
                                onClick={() => setConfig({...config, autonomousMode: !config.autonomousMode})}
                                className={`w-20 h-10 rounded-full transition-all relative shadow-inner ${config.autonomousMode ? 'bg-purple-600 shadow-purple-900/50' : 'bg-slate-700 shadow-slate-900/50'}`}
                            >
                                <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all shadow-lg flex items-center justify-center ${config.autonomousMode ? 'left-11' : 'left-1'}`}>
                                    {config.autonomousMode ? <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping"></div> : <div className="w-2 h-2 bg-slate-400 rounded-full"></div>}
                                </div>
                            </button>
                         </div>
                    </div>
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
                    
                    {/* SECTION 3: STRATEGY CORE (AHORA MÁS FUNCIONAL) */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 text-blue-400 mb-2 border-b border-slate-800 pb-2">
                            <Icons.Cpu /> <h3 className="font-bold tracking-wider">NÚCLEO NEURONAL (ESTRATEGIA)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'SCALPING_MACD', name: 'Scalping H.F.', desc: 'Alta frecuencia. Riesgo Medio.', color: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
                                { id: 'SWING_RSI', name: 'Swing Momentum', desc: 'Mediano plazo. Riesgo Bajo.', color: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
                                { id: 'AI_SENTIMENT', name: 'EVA Sentiment AI', desc: 'Análisis Order Flow. Experimental.', color: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' }
                            ].map((strat) => (
                                <div 
                                    key={strat.id}
                                    onClick={() => setConfig({...config, strategy: strat.id as StrategyType})}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-28 overflow-hidden ${config.strategy === strat.id ? `${strat.color} bg-slate-900` : 'border-slate-800 bg-slate-950/50 hover:bg-slate-900'}`}
                                >
                                    {config.strategy === strat.id && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>}
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold ${config.strategy === strat.id ? 'text-white' : 'text-slate-400'}`}>{strat.name}</h4>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.strategy === strat.id ? 'bg-current border-transparent' : 'border-slate-600'}`}>
                                            {config.strategy === strat.id && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-tight">{strat.desc}</p>
                                </div>
                            ))}
                        </div>
                        
                        {/* PANEL DE DETALLE Y PRESETS */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-3">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Icons.Activity /> DETALLES TÁCTICOS: <span className="text-yellow-400">{STRATEGY_DETAILS[config.strategy].title}</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-3">
                                        {STRATEGY_DETAILS[config.strategy].logic}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {STRATEGY_DETAILS[config.strategy].indicators.map((ind, i) => (
                                            <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-mono">
                                                {ind}
                                            </span>
                                        ))}
                                        <span className="text-[10px] bg-slate-800 text-cyan-400 px-2 py-1 rounded border border-slate-700 font-mono">
                                            TF: {STRATEGY_DETAILS[config.strategy].timeframe}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                                    <button 
                                        onClick={() => applyStrategyPreset(config.strategy)}
                                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-4 rounded-lg border border-slate-600 flex items-center gap-2 transition-all mb-2"
                                        title="Aplica Stop Loss, Leverage y Take Profit recomendados para esta estrategia"
                                    >
                                        <Icons.Zap /> APLICAR PRESET RECOMENDADO
                                    </button>
                                    <p className="text-[10px] text-slate-500 text-center max-w-[200px]">
                                        Ajusta automáticamente Riesgo, Apalancamiento y Duración.
                                    </p>
                                </div>
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

                </div>

                {validationError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-lg flex items-center gap-3 text-rose-400 animate-pulse">
                        <Icons.Shield />
                        <span className="font-bold text-sm">{validationError}</span>
                    </div>
                )}

                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-800 mt-8">
                     <button 
                        onClick={() => setShowResetModal(true)}
                        className="text-rose-500 hover:text-rose-400 text-xs font-bold tracking-widest border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10 px-6 py-3 rounded-lg transition-all flex items-center gap-2 group"
                    >
                        <Icons.Alert /> 
                        <span className="group-hover:underline decoration-rose-500 underline-offset-4">REGRESAR A FÁBRICA</span>
                    </button>

                    <button 
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className={`px-8 py-3 rounded-lg font-bold flex items-center gap-3 transition-all ${saved ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white text-black hover:bg-slate-200'} ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
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
