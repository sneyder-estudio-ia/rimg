
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient'; // Correcto: supabaseClient está en la raíz (3 niveles arriba)
import { NeuralMemory } from '../../types'; // Correcto: types.ts está en src/ (2 niveles arriba)
import { Icons } from '../../components/Icons'; // Correcto: components está en src/ (2 niveles arriba)

export const NeuralNetworkView = () => {
    const [memories, setMemories] = useState<NeuralMemory[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalAccuracy, setGlobalAccuracy] = useState(0);

    const fetchMemories = async () => {
        setLoading(true);
        try {
            // Obtener últimos 50 registros de la memoria colectiva
            const { data, error } = await supabase
                .from('eva_collective_memory')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                setMemories(data);
                // Calcular precisión simple basada en operaciones positivas
                const positiveOps = data.filter(m => m.outcome_score > 0).length;
                setGlobalAccuracy(data.length > 0 ? (positiveOps / data.length) * 100 : 0);
            }
        } catch (e) {
            console.error("Error conectando con el núcleo neuronal:", e);
        } finally {
            setLoading(false);
        }
    };

    const simulateTraining = async () => {
        // Esta función simula un trade y lo sube a la base de datos para "enseñar" a la red
        const mockOutcome = (Math.random() - 0.4) * 10; // Rango entre -4% y +6%
        const newMemory = {
            input_pattern: { rsi: 45 + Math.random() * 20, price_change: Math.random() * 2 },
            decision: Math.random() > 0.5 ? 'LONG' : 'SHORT',
            outcome_score: mockOutcome,
            strategy_used: 'MANUAL_REINFORCEMENT',
            confidence_level: 0.85 + (Math.random() * 0.14)
        };

        try {
            await supabase.from('eva_collective_memory').insert([newMemory]);
            fetchMemories(); // Recargar
        } catch (e) {
            console.error("Fallo en la sinapsis:", e);
        }
    };

    useEffect(() => {
        fetchMemories();
        // Suscripción en tiempo real a nuevos aprendizajes
        const channel = supabase
            .channel('public:eva_collective_memory')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eva_collective_memory' }, 
                () => fetchMemories()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <div className="flex-1 h-full bg-slate-950 p-4 md:p-8 overflow-y-auto font-sans relative">
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-3">
                            <Icons.Brain /> RED NEURONAL DISTRIBUIDA
                        </h1>
                        <p className="text-slate-500 font-mono text-xs mt-1">PROTOCOLO DE APRENDIZAJE GLOBAL (HIVEMIND)</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase tracking-widest">Precisión Global</div>
                        <div className={`text-2xl font-mono font-bold ${globalAccuracy > 50 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {globalAccuracy.toFixed(1)}%
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Visualizador Sináptico (Simulado) */}
                    <div className="lg:col-span-8 bg-slate-900/50 rounded-xl border border-slate-800 p-1 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                        <div className="h-[400px] flex items-center justify-center relative">
                            {/* Nodos Centrales */}
                            <div className="absolute w-32 h-32 rounded-full border border-purple-500/30 animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute w-48 h-48 rounded-full border border-cyan-500/20 animate-[spin_15s_linear_infinite_reverse]"></div>
                            
                            {/* Texto Central */}
                            <div className="text-center z-10 p-6 bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-700 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                <div className="text-4xl font-bold text-white">EVA</div>
                                <div className="text-[10px] text-purple-400 font-mono mt-1">NEURAL CORE</div>
                            </div>

                            {/* Líneas de conexión decorativas */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                                <line x1="10%" y1="10%" x2="50%" y2="50%" stroke="#a855f7" strokeWidth="1" />
                                <line x1="90%" y1="20%" x2="50%" y2="50%" stroke="#06b6d4" strokeWidth="1" />
                                <line x1="20%" y1="80%" x2="50%" y2="50%" stroke="#a855f7" strokeWidth="1" />
                                <line x1="80%" y1="90%" x2="50%" y2="50%" stroke="#06b6d4" strokeWidth="1" />
                            </svg>
                        </div>
                        
                        <div className="absolute bottom-4 right-4">
                            <button 
                                onClick={simulateTraining}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/50 transition-all hover:scale-105"
                            >
                                <Icons.Zap /> ENTRENAR MANUALMENTE
                            </button>
                        </div>
                    </div>

                    {/* Feed de Memoria */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 flex-1 overflow-hidden flex flex-col">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                Flujo de Conciencia (Live)
                            </h3>
                            
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {loading ? (
                                    <div className="text-center py-10 text-slate-600 animate-pulse">Sincronizando con la red...</div>
                                ) : memories.length === 0 ? (
                                    <div className="text-center py-10 text-slate-600">
                                        Memoria vacía. <br/> Inicia entrenamiento.
                                    </div>
                                ) : (
                                    memories.map((mem) => (
                                        <div key={mem.id} className="bg-slate-950 p-3 rounded border border-slate-800 hover:border-slate-600 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${mem.decision === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {mem.decision}
                                                </span>
                                                <span className={`text-xs font-mono ${mem.outcome_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {mem.outcome_score > 0 ? '+' : ''}{mem.outcome_score.toFixed(2)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                                                    {mem.strategy_used}
                                                </span>
                                                <span className="text-[10px] text-slate-600">
                                                    {(mem.confidence_level * 100).toFixed(0)}% Conf.
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
