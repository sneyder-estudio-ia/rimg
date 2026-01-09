import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../supabaseClient';
import { NeuralMemory } from '../../types';
import { Icons } from '../../components/Icons';
import { getCandles, subscribeToTicker } from '../../services/binanceService';
import { calculateRSI, calculateVolatility, detectWhaleActivity } from '../../utils/neuralMath';

// --- INTERFACES LOCALES ---
interface NeuralConfig {
    learningRate: number;      // Ponderación de RSI
    riskTolerance: number;     // Umbral de decisión (Agresividad)
    sentimentAnalysis: boolean;// Activa lógica RSI
    whaleTracking: boolean;    // Activa lógica Volumen
    patternRecognition: boolean;// Activa Volatilidad
    newsIntegration: boolean;  // (Placeholder para V11)
    volatilityShield: boolean; // Penaliza decisiones en alta volatilidad
    arbitrageScanner: boolean; // (Placeholder)
    darkPoolDetection: boolean;// (Placeholder)
    quantumMode: boolean;      // Invierte lógica (Contrarian Trading)
}

export const NeuralNetworkView = () => {
    // --- ESTADO DE DATOS VIVOS ---
    const [memories, setMemories] = useState<NeuralMemory[]>([]);
    const [livePrice, setLivePrice] = useState<number>(0);
    const [liveRsi, setLiveRsi] = useState<number>(50);
    
    // --- ESTADO DEL SISTEMA ---
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [autoLoop, setAutoLoop] = useState(false); // BUCLE CORTICAL
    const [globalAccuracy, setGlobalAccuracy] = useState(0);
    
    const processingRef = useRef(false); // Ref para evitar race conditions en el loop
    
    // --- ESTADO DE LAS 10 HABILIDADES ---
    const [config, setConfig] = useState<NeuralConfig>({
        learningRate: 0.65, 
        riskTolerance: 50,  
        sentimentAnalysis: true,
        whaleTracking: true,
        patternRecognition: true,
        newsIntegration: false,
        volatilityShield: true,
        arbitrageScanner: false,
        darkPoolDetection: false,
        quantumMode: false
    });

    // --- REF DE CONFIGURACIÓN VIVA (CRÍTICO PARA EL BUCLE) ---
    const configRef = useRef(config);

    useEffect(() => {
        configRef.current = config;
    }, [config]);

    const toggleConfig = (key: keyof NeuralConfig) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- 1. CONEXIÓN SENSORIAL (WEBSOCKET & SUPABASE) ---
    useEffect(() => {
        fetchMemories();
        
        const channel = supabase
            .channel('public:eva_collective_memory')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eva_collective_memory' }, 
                (payload) => {
                    const newMem = payload.new as NeuralMemory;
                    setMemories(prev => [newMem, ...prev].slice(0, 50));
                }
            )
            .subscribe();

        const ws = subscribeToTicker('BTCUSDT', (data) => {
            setLivePrice(data.price);
        });

        return () => { 
            supabase.removeChannel(channel);
            ws.close();
        };
    }, []);

    // --- 2. LOOP CORTICAL (AUTO-ANÁLISIS) ---
    useEffect(() => {
        let interval: any;
        if (autoLoop) {
            analyzeMarketReal(); 
            interval = setInterval(() => {
                if (!processingRef.current) {
                    analyzeMarketReal();
                }
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [autoLoop]);

    // --- 3. CÁLCULO DE PRECISIÓN REAL ---
    useEffect(() => {
        if (memories.length > 0 && livePrice > 0) {
            calculateRealTimeAccuracy();
        }
    }, [memories, livePrice]);

    const calculateRealTimeAccuracy = () => {
        let hits = 0;
        let total = 0;
        
        memories.slice(0, 20).forEach(mem => {
            const entryPrice = mem.input_pattern.price;
            const decision = mem.decision;
            
            if (decision === 'HOLD') return;

            const priceDiff = livePrice - entryPrice;
            if ((decision === 'LONG' && priceDiff > 0) || (decision === 'SHORT' && priceDiff < 0)) {
                hits++;
            }
            total++;
        });

        if (total > 0) {
            setGlobalAccuracy((hits / total) * 100);
        }
    };

    const fetchMemories = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('eva_collective_memory')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setMemories(data);
        } catch (e) {
            console.error("Error conectando con el núcleo neuronal:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- 4. LÓGICA DE ANÁLISIS REAL (CON REF VIVA) ---
    const analyzeMarketReal = async () => {
        if (processingRef.current) return;
        processingRef.current = true;
        setProcessing(true);

        try {
            const currentConfig = configRef.current;

            const candles = await getCandles('BTCUSDT', '15m', 50);
            if (candles.length < 20) throw new Error("Datos insuficientes de Binance");

            const closePrices = candles.map(c => c.close);
            const volumes = candles.map(c => c.volume);
            const currentPrice = closePrices[closePrices.length - 1];

            const rsi = calculateRSI(closePrices, 14);
            const volatility = calculateVolatility(closePrices.slice(-10));
            const isWhale = detectWhaleActivity(volumes);

            setLiveRsi(rsi);

            let score = 0;

            if (currentConfig.sentimentAnalysis) {
                if (rsi < 30) score += (40 * currentConfig.learningRate); 
                else if (rsi > 70) score -= (40 * currentConfig.learningRate);
                else score += (50 - rsi) * 0.5 * currentConfig.learningRate;
            }

            if (currentConfig.whaleTracking && isWhale) {
                const lastCandle = candles[candles.length - 1];
                const isGreen = lastCandle.close > lastCandle.open;
                score += isGreen ? 25 : -25;
            }

            if (currentConfig.volatilityShield && volatility > (currentPrice * 0.005)) {
                score = score * 0.6;
            }

            if (currentConfig.quantumMode) score = -score;

            const threshold = 100 - currentConfig.riskTolerance; 
            let decision = 'HOLD';
            
            if (score > (threshold / 3)) decision = 'LONG';
            if (score < -(threshold / 3)) decision = 'SHORT';

            const confidence = Math.min(Math.abs(score) / 50, 0.99);

            if (decision !== 'HOLD') {
                const newMemory = {
                    input_pattern: { 
                        rsi: rsi.toFixed(2), 
                        volatility: volatility.toFixed(2),
                        whale_detected: isWhale,
                        price: currentPrice
                    },
                    decision: decision,
                    outcome_score: score, 
                    strategy_used: currentConfig.quantumMode ? 'QUANTUM_HEURISTIC' : 'STANDARD_NEURAL_V2',
                    confidence_level: confidence
                };

                await supabase.from('eva_collective_memory').insert([newMemory]);
            }

        } catch (e) {
            console.error("Fallo en el análisis neuronal:", e);
        } finally {
            setProcessing(false);
            processingRef.current = false;
        }
    };

    // --- COMPONENTE INTERRUPTOR REPARADO ---
    // Usamos switch case explícito para que Tailwind no purgue las clases
    const AbilityToggle = ({ label, active, onClick, color = "emerald" }: { label: string, active: boolean, onClick: () => void, color?: string }) => {
        
        const getStyles = (c: string) => {
            switch(c) {
                case 'blue': return { bg: 'bg-blue-500/10', border: 'border-blue-500/50', dot: 'bg-blue-500', shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.1)]' };
                case 'indigo': return { bg: 'bg-indigo-500/10', border: 'border-indigo-500/50', dot: 'bg-indigo-500', shadow: 'shadow-[0_0_10px_rgba(99,102,241,0.1)]' };
                case 'purple': return { bg: 'bg-purple-500/10', border: 'border-purple-500/50', dot: 'bg-purple-500', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.1)]' };
                case 'yellow': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', dot: 'bg-yellow-500', shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.1)]' };
                case 'emerald': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', dot: 'bg-emerald-500', shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.1)]' };
                case 'orange': return { bg: 'bg-orange-500/10', border: 'border-orange-500/50', dot: 'bg-orange-500', shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.1)]' };
                case 'slate': return { bg: 'bg-slate-500/10', border: 'border-slate-500/50', dot: 'bg-slate-500', shadow: 'shadow-[0_0_10px_rgba(100,116,139,0.1)]' };
                default: return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', dot: 'bg-emerald-500', shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.1)]' };
            }
        };

        const theme = getStyles(color);

        return (
            <div 
                onClick={onClick}
                className={`cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-all hover:scale-[1.02] select-none ${active 
                    ? `${theme.bg} ${theme.border} ${theme.shadow}` 
                    : 'bg-slate-900 border-slate-700 opacity-60 hover:opacity-100'}`}
            >
                <span className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? theme.dot : 'bg-slate-600'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${active ? 'left-4.5' : 'left-0.5'}`}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 h-full bg-slate-950 p-4 md:p-8 overflow-y-auto font-sans relative custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-3">
                            <Icons.Brain /> RED NEURONAL V2.0
                        </h1>
                        <p className="text-slate-500 font-mono text-xs mt-1">SISTEMA CORTICAL REAL // BTC-USDT FEED</p>
                    </div>
                    <div className="flex gap-6 text-right items-center">
                         <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Precio Live</div>
                            <div className="text-xl font-mono font-bold text-white">
                                ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Precisión Real</div>
                            <div className={`text-xl font-mono font-bold ${globalAccuracy > 55 ? 'text-emerald-400' : globalAccuracy < 45 ? 'text-rose-400' : 'text-yellow-400'}`}>
                                {globalAccuracy.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* COLUMNA IZQUIERDA: VISUALIZADOR Y CONTROLES */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        
                        {/* 1. VISUALIZADOR SINÁPTICO */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-1 relative overflow-hidden group min-h-[300px]">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                            
                            {/* DATA OVERLAY */}
                            <div className="absolute top-4 left-4 z-20 space-y-1 font-mono text-xs bg-black/50 p-2 rounded border border-slate-800 backdrop-blur-sm">
                                <div className="text-slate-400 font-bold mb-1 border-b border-slate-700 pb-1">INPUT SENSORIAL (Binance)</div>
                                <div className={`${liveRsi > 70 ? 'text-rose-400' : liveRsi < 30 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    RSI (14): {liveRsi.toFixed(2)}
                                </div>
                                <div className="text-blue-400">ESTADO: {autoLoop ? 'BUCLE ACTIVO' : 'ESPERA MANUAL'}</div>
                            </div>

                            <div className="h-full min-h-[300px] flex items-center justify-center relative">
                                {/* Efectos visuales reactivos a la configuración y estado */}
                                <div className={`absolute w-32 h-32 rounded-full border-2 animate-[spin_10s_linear_infinite] transition-all duration-1000 ${
                                    processing ? 'border-purple-500 shadow-[0_0_60px_rgba(168,85,247,0.6)]' : 
                                    autoLoop ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-slate-700'
                                }`}></div>
                                
                                <div className={`absolute w-48 h-48 rounded-full border border-dashed animate-[spin_15s_linear_infinite_reverse] transition-colors ${
                                    liveRsi < 30 ? 'border-emerald-500/40' : liveRsi > 70 ? 'border-rose-500/40' : 'border-cyan-500/20'
                                }`}></div>
                                
                                <div className="text-center z-10 p-6 bg-slate-950/90 backdrop-blur-md rounded-full border border-slate-700 shadow-2xl relative">
                                    {processing && <div className="absolute inset-0 rounded-full border-2 border-purple-500 animate-ping opacity-20"></div>}
                                    <div className="text-4xl font-bold text-white tracking-tighter">EVA</div>
                                    <div className={`text-[10px] font-mono mt-1 ${processing ? 'text-purple-400 animate-pulse' : autoLoop ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {processing ? 'CALCULANDO...' : autoLoop ? 'MONITOREO VIVO' : 'STANDBY'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                                <button 
                                    onClick={() => setAutoLoop(!autoLoop)}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border ${
                                        autoLoop 
                                        ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20' 
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                    }`}
                                >
                                    {autoLoop ? <><Icons.Stop /> DETENER BUCLE</> : <><Icons.Play /> ACTIVAR BUCLE AUTOMÁTICO</>}
                                </button>

                                {!autoLoop && (
                                    <button 
                                        onClick={analyzeMarketReal}
                                        disabled={processing}
                                        className="px-4 py-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
                                    >
                                        <Icons.Zap /> ESCANEO ÚNICO
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. PANEL DE 10 HABILIDADES (CORTEX CONTROL) */}
                        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-4 text-slate-300 border-b border-slate-800 pb-2">
                                <Icons.Settings /> 
                                <h3 className="text-sm font-bold uppercase tracking-wider">Corteza Funcional (Configuración Real)</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Habilidad 1: Learning Rate (Slider) */}
                                <div className="p-3 rounded-lg border border-slate-700 bg-slate-950">
                                    <div className="flex justify-between mb-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">1. Peso RSI (Influencia)</label>
                                        <span className="text-[10px] font-mono text-cyan-400">{(config.learningRate * 100).toFixed(0)}%</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="100" 
                                        value={config.learningRate * 100}
                                        onChange={(e) => setConfig({...config, learningRate: parseInt(e.target.value) / 100})}
                                        className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Habilidad 2: Risk Tolerance (Slider) */}
                                <div className="p-3 rounded-lg border border-slate-700 bg-slate-950">
                                    <div className="flex justify-between mb-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">2. Agresividad (Threshold)</label>
                                        <span className={`text-[10px] font-mono ${config.riskTolerance > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{config.riskTolerance}%</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="100" 
                                        value={config.riskTolerance}
                                        onChange={(e) => setConfig({...config, riskTolerance: parseInt(e.target.value)})}
                                        className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${config.riskTolerance > 70 ? 'accent-rose-500' : 'accent-emerald-500'}`}
                                    />
                                </div>

                                {/* Habilidades 3-10: Switches REPARADOS */}
                                <AbilityToggle 
                                    label="3. Lógica RSI Real" 
                                    active={config.sentimentAnalysis} 
                                    onClick={() => toggleConfig('sentimentAnalysis')} 
                                    color="blue"
                                />
                                <AbilityToggle 
                                    label="4. Detección Volumen" 
                                    active={config.whaleTracking} 
                                    onClick={() => toggleConfig('whaleTracking')} 
                                    color="indigo"
                                />
                                <AbilityToggle 
                                    label="5. Fractalidad (Pasivo)" 
                                    active={config.patternRecognition} 
                                    onClick={() => toggleConfig('patternRecognition')} 
                                    color="purple"
                                />
                                <AbilityToggle 
                                    label="6. API Noticias (Off)" 
                                    active={config.newsIntegration} 
                                    onClick={() => toggleConfig('newsIntegration')} 
                                    color="yellow"
                                />
                                <AbilityToggle 
                                    label="7. Escudo Volatilidad" 
                                    active={config.volatilityShield} 
                                    onClick={() => toggleConfig('volatilityShield')} 
                                    color="emerald"
                                />
                                <AbilityToggle 
                                    label="8. Arbitraje (Off)" 
                                    active={config.arbitrageScanner} 
                                    onClick={() => toggleConfig('arbitrageScanner')} 
                                    color="orange"
                                />
                                <AbilityToggle 
                                    label="9. Dark Pool (Off)" 
                                    active={config.darkPoolDetection} 
                                    onClick={() => toggleConfig('darkPoolDetection')} 
                                    color="slate"
                                />
                                <div onClick={() => toggleConfig('quantumMode')} 
                                     className={`cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-all hover:scale-[1.02] select-none ${config.quantumMode 
                                        ? 'bg-fuchsia-500/20 border-fuchsia-500/60 shadow-[0_0_15px_rgba(217,70,239,0.2)]' 
                                        : 'bg-slate-900 border-slate-700 opacity-60'}`}>
                                    <span className={`text-xs font-bold ${config.quantumMode ? 'text-fuchsia-300' : 'text-slate-400'}`}>10. INVERTIR LÓGICA</span>
                                    <div className={`w-3 h-3 rounded-full ${config.quantumMode ? 'bg-fuchsia-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* COLUMNA DERECHA: FEED DE MEMORIA */}
                    <div className="lg:col-span-4 flex flex-col h-full">
                        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 flex-1 overflow-hidden flex flex-col h-[600px] lg:h-auto shadow-xl">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Memoria de Mercado</span>
                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">SUPABASE</span>
                            </h3>
                            
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        <div className="text-xs text-slate-500 animate-pulse">Sincronizando registros...</div>
                                    </div>
                                ) : memories.length === 0 ? (
                                    <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded">
                                        Sin datos. <br/> Activa el Bucle Automático.
                                    </div>
                                ) : (
                                    memories.map((mem) => {
                                        // Calcular resultado visual si es posible
                                        const entryPrice = mem.input_pattern.price;
                                        const pnl = livePrice - entryPrice;
                                        const isWin = (mem.decision === 'LONG' && pnl > 0) || (mem.decision === 'SHORT' && pnl < 0);
                                        const isNeutral = mem.decision === 'HOLD';
                                        
                                        return (
                                            <div key={mem.id} className={`p-3 rounded border transition-colors group ${isWin && !isNeutral ? 'bg-emerald-950/30 border-emerald-500/30' : !isWin && !isNeutral ? 'bg-rose-950/30 border-rose-500/30' : 'bg-slate-950 border-slate-800'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex gap-2 items-center">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${mem.decision === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : mem.decision === 'SHORT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                            {mem.decision}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                            @ {entryPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <span className={`text-xs font-mono font-bold ${isWin && !isNeutral ? 'text-emerald-400' : !isWin && !isNeutral ? 'text-rose-400' : 'text-slate-500'}`}>
                                                        {isNeutral ? '---' : isWin ? 'WIN' : 'LOSS'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                                                        RSI: {mem.input_pattern?.rsi} | Vol: {mem.input_pattern?.volatility}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600">
                                                        {new Date(mem.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};