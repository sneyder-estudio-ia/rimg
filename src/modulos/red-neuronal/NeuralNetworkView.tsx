
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { NeuralMemory } from '../../types';
import { Icons } from '../../components/Icons';
import { getCandles } from '../../services/binanceService';
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
    const [memories, setMemories] = useState<NeuralMemory[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [globalAccuracy, setGlobalAccuracy] = useState(0);
    const [marketSnapshot, setMarketSnapshot] = useState<{rsi: number, vol: number, price: number} | null>(null);
    
    // --- ESTADO DE LAS 10 HABILIDADES ---
    const [config, setConfig] = useState<NeuralConfig>({
        learningRate: 0.65, // Peso del RSI (0.0 - 1.0)
        riskTolerance: 50,  // Umbral neutro
        sentimentAnalysis: true,
        whaleTracking: true,
        patternRecognition: true,
        newsIntegration: false,
        volatilityShield: true,
        arbitrageScanner: false,
        darkPoolDetection: false,
        quantumMode: false
    });

    const toggleConfig = (key: keyof NeuralConfig) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const fetchMemories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('eva_collective_memory')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                setMemories(data);
                // "Accuracy" en este contexto real será el porcentaje de confianza promedio de las últimas ejecuciones
                const avgConfidence = data.reduce((acc, curr) => acc + curr.confidence_level, 0) / (data.length || 1);
                setGlobalAccuracy(avgConfidence * 100);
            }
        } catch (e) {
            console.error("Error conectando con el núcleo neuronal:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE ANÁLISIS REAL (NO SIMULADA) ---
    const analyzeMarketReal = async () => {
        setProcessing(true);
        try {
            // 1. OBTENCIÓN DE DATOS REALES (Sensory Input)
            const candles = await getCandles('BTCUSDT', '15m', 50);
            if (candles.length < 15) throw new Error("Datos de mercado insuficientes");

            const closePrices = candles.map(c => c.close);
            const volumes = candles.map(c => c.volume);
            const currentPrice = closePrices[closePrices.length - 1];

            // 2. PROCESAMIENTO MATEMÁTICO (Neural Processing)
            const rsi = calculateRSI(closePrices, 14);
            const volatility = calculateVolatility(closePrices.slice(-10));
            const isWhale = detectWhaleActivity(volumes);

            setMarketSnapshot({ rsi, vol: volatility, price: currentPrice });

            // 3. PONDERACIÓN DE DECISIÓN (Weighted Decision)
            // Score va de -100 (Sell Fuerte) a 100 (Buy Fuerte)
            let score = 0;

            // Capa 1: RSI (Sentimiento)
            if (config.sentimentAnalysis) {
                if (rsi < 30) score += 40 * config.learningRate; // Oversold -> Buy
                if (rsi > 70) score -= 40 * config.learningRate; // Overbought -> Sell
                // RSI Neutral tiende a 0
            }

            // Capa 2: Ballenas (Volumen)
            if (config.whaleTracking && isWhale) {
                // Si hay ballena, seguimos la tendencia de la última vela
                const lastCandle = candles[candles.length - 1];
                const isGreen = lastCandle.close > lastCandle.open;
                score += isGreen ? 25 : -25;
            }

            // Capa 3: Escudo de Volatilidad (Inhibición)
            if (config.volatilityShield && volatility > (currentPrice * 0.01)) {
                score = score * 0.5; // Reducimos la confianza si el mercado está muy loco
            }

            // Capa 4: Modo Cuántico (Inversión)
            if (config.quantumMode) {
                score = -score;
            }

            // Ajuste por Tolerancia al Riesgo
            // Si riskTolerance es alto (100), operaciones pequeñas se ejecutan.
            // Si es bajo (0), necesitamos un score muy alto.
            const threshold = 100 - config.riskTolerance; 

            let decision = 'HOLD';
            if (score > threshold / 2) decision = 'LONG';
            if (score < -(threshold / 2)) decision = 'SHORT';

            // Confianza basada en la magnitud del score absoluto
            const confidence = Math.min(Math.abs(score) / 100, 0.99);

            // 4. MEMORIA A LARGO PLAZO (Supabase)
            const newMemory = {
                input_pattern: { 
                    rsi: rsi.toFixed(2), 
                    volatility: volatility.toFixed(2),
                    whale_detected: isWhale,
                    price: currentPrice
                },
                decision: decision,
                outcome_score: score, // Guardamos el "Neural Score" calculado
                strategy_used: config.quantumMode ? 'QUANTUM_HEURISTIC' : 'STANDARD_NEURAL_V2',
                confidence_level: confidence
            };

            await supabase.from('eva_collective_memory').insert([newMemory]);
            await fetchMemories();

        } catch (e) {
            console.error("Fallo en el análisis neuronal:", e);
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        fetchMemories();
        const channel = supabase
            .channel('public:eva_collective_memory')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eva_collective_memory' }, 
                () => fetchMemories()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const AbilityToggle = ({ label, active, onClick, color = "emerald" }: { label: string, active: boolean, onClick: () => void, color?: string }) => (
        <div 
            onClick={onClick}
            className={`cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-all hover:scale-[1.02] ${active 
                ? `bg-${color}-500/10 border-${color}-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]` 
                : 'bg-slate-900 border-slate-700 opacity-60 hover:opacity-100'}`}
        >
            <span className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? `bg-${color}-500` : 'bg-slate-600'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${active ? 'left-4.5' : 'left-0.5'}`}></div>
            </div>
        </div>
    );

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
                    <div className="flex gap-4 text-right">
                         <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Nodos Activos</div>
                            <div className="text-xl font-mono font-bold text-cyan-400">
                                {Object.values(config).filter(v => v === true || (typeof v === 'number' && v > 0)).length}/10
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Confianza Media</div>
                            <div className={`text-xl font-mono font-bold ${globalAccuracy > 50 ? 'text-emerald-400' : 'text-yellow-400'}`}>
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
                            
                            {marketSnapshot && (
                                <div className="absolute top-4 left-4 z-20 space-y-1 font-mono text-xs">
                                    <div className="text-slate-400">INPUT REAL (BTC)</div>
                                    <div className={`${marketSnapshot.rsi > 70 ? 'text-rose-400' : marketSnapshot.rsi < 30 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        RSI: {marketSnapshot.rsi.toFixed(2)}
                                    </div>
                                    <div className="text-blue-400">VOL: {marketSnapshot.vol.toFixed(2)}</div>
                                    <div className="text-white">PRC: {marketSnapshot.price.toFixed(2)}</div>
                                </div>
                            )}

                            <div className="h-full min-h-[300px] flex items-center justify-center relative">
                                {/* Efectos visuales reactivos a la configuración */}
                                <div className={`absolute w-32 h-32 rounded-full border border-purple-500/30 animate-[spin_10s_linear_infinite] ${processing ? 'border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.8)] duration-75' : ''}`}></div>
                                <div className={`absolute w-48 h-48 rounded-full border border-cyan-500/20 animate-[spin_15s_linear_infinite_reverse] ${processing ? 'border-cyan-500' : ''}`}></div>
                                
                                <div className="text-center z-10 p-6 bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-700 shadow-2xl">
                                    <div className="text-4xl font-bold text-white tracking-tighter">EVA</div>
                                    <div className="text-[10px] text-purple-400 font-mono mt-1">
                                        {processing ? 'CALCULANDO...' : 'SISTEMA LISTO'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-4 right-4 z-20">
                                <button 
                                    onClick={analyzeMarketReal}
                                    disabled={processing}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${processing ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]'}`}
                                >
                                    <Icons.Zap /> {processing ? 'PROCESANDO DATA...' : 'EJECUTAR ANÁLISIS SINÁPTICO'}
                                </button>
                            </div>
                        </div>

                        {/* 2. PANEL DE 10 HABILIDADES (CORTEX CONTROL) */}
                        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-4 text-slate-300 border-b border-slate-800 pb-2">
                                <Icons.Settings /> 
                                <h3 className="text-sm font-bold uppercase tracking-wider">Corteza Funcional (Pesos Reales)</h3>
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

                                {/* Habilidades 3-10: Switches */}
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
                                     className={`cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-all hover:scale-[1.02] ${config.quantumMode 
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
                                        <div className="text-xs text-slate-500 animate-pulse">Recuperando registros...</div>
                                    </div>
                                ) : memories.length === 0 ? (
                                    <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded">
                                        Sin datos de análisis previos. <br/> Ejecuta el escáner.
                                    </div>
                                ) : (
                                    memories.map((mem) => (
                                        <div key={mem.id} className="bg-slate-950 p-3 rounded border border-slate-800 hover:border-slate-600 transition-colors group">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex gap-2">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${mem.decision === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : mem.decision === 'SHORT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                        {mem.decision}
                                                    </span>
                                                    {mem.strategy_used === 'QUANTUM_HEURISTIC' && <span className="text-[10px] text-fuchsia-400 font-bold px-1 border border-fuchsia-500/30 rounded bg-fuchsia-500/10">INV</span>}
                                                </div>
                                                <span className={`text-xs font-mono font-bold text-slate-300`}>
                                                    Conf: {(mem.confidence_level * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                                                    RSI: {mem.input_pattern?.rsi} | V: {mem.input_pattern?.volatility}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
