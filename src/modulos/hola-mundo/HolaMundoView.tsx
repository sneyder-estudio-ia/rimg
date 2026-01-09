import React, { useState } from 'react';
import { Icons } from '../../components/Icons';

// Componente Local para el Icono de Flecha (Chevron)
const ChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// Componente de Acordeón Reutilizable
const AccordionItem = ({ 
    title, 
    icon: Icon, 
    isOpen, 
    onClick, 
    children 
}: { 
    title: string, 
    icon: any, 
    isOpen: boolean, 
    onClick: () => void, 
    children?: React.ReactNode 
}) => {
    return (
        <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isOpen ? 'bg-slate-900/60 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}>
            <button 
                onClick={onClick}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left outline-none group"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'}`}>
                        <Icon />
                    </div>
                    <span className={`font-bold text-sm md:text-base tracking-wide ${isOpen ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {title}
                    </span>
                </div>
                <ChevronDown className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>
            
            {/* Contenido Desplegable con Animación CSS simple */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="p-5 pt-0 border-t border-slate-800/50 text-slate-400 text-sm leading-relaxed font-light">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HolaMundoView = () => {
  const [openSection, setOpenSection] = useState<string | null>('PANEL');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-y-auto selection:bg-emerald-500/30 custom-scrollbar">
      {/* Fondo ambiental */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none fixed"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in duration-700">
          
          {/* ENCABEZADO */}
          <header className="mb-12 border-b border-slate-800/60 pb-8">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-600 tracking-tighter drop-shadow-lg mb-4">
                HOLA MUNDO
              </h1>
              
              <div className="flex items-center gap-3 opacity-80">
                  <div className="w-6 h-[2px] bg-emerald-500"></div>
                  <span className="text-emerald-400 font-mono text-xs tracking-[0.2em] uppercase font-bold">
                      MANUAL DE USO & FAQ
                  </span>
              </div>
          </header>

          <div className="grid grid-cols-1 gap-12">
            
            {/* SECCIÓN 1: MANUAL DE FUNCIONES */}
            <section>
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Icons.Cpu /> MÓDULOS DEL SISTEMA
                </h2>
                <div className="flex flex-col gap-4">
                    
                    <AccordionItem 
                        title="PANEL DE CONTROL (Dashboard)" 
                        icon={Icons.Activity}
                        isOpen={openSection === 'PANEL'}
                        onClick={() => toggleSection('PANEL')}
                    >
                        <p className="mb-3">
                            El centro de comando principal de EVA. Aquí visualizas el mercado en tiempo real mediante conexión WebSocket directa a Binance.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 marker:text-emerald-500">
                            <li><strong className="text-white">Gráfico en Vivo:</strong> Visualización de velas y áreas de precio.</li>
                            <li><strong className="text-white">Libro de Órdenes:</strong> Muestra la profundidad de mercado (Bids vs Asks).</li>
                            <li><strong className="text-white">Terminal EVA_OS:</strong> Logs del sistema mostrando cada acción interna.</li>
                            <li><strong className="text-white">Trading Manual:</strong> Botones de ejecución rápida para emergencias.</li>
                        </ul>
                    </AccordionItem>

                    <AccordionItem 
                        title="RED NEURONAL (Corteza)" 
                        icon={Icons.Brain}
                        isOpen={openSection === 'NEURAL'}
                        onClick={() => toggleSection('NEURAL')}
                    >
                        <p className="mb-3">
                            El cerebro de la IA. Este módulo procesa datos matemáticos para encontrar patrones invisibles al ojo humano.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 marker:text-purple-500">
                            <li><strong className="text-white">Visualizador Sináptico:</strong> Representación gráfica del estado de "pensamiento" de EVA.</li>
                            <li><strong className="text-white">10 Habilidades:</strong> Configura qué lógicas usa el bot (RSI, Ballenas, Volatilidad, etc).</li>
                            <li><strong className="text-white">Bucle Automático:</strong> Al activarlo, EVA escanea el mercado cada 10 segundos perpetuamente.</li>
                            <li><strong className="text-white">Memoria Colectiva:</strong> Registra cada decisión en Supabase para aprender de errores pasados.</li>
                        </ul>
                    </AccordionItem>

                    <AccordionItem 
                        title="GESTOR DE ACTIVOS" 
                        icon={Icons.Coins}
                        isOpen={openSection === 'ASSETS'}
                        onClick={() => toggleSection('ASSETS')}
                    >
                        <p className="mb-3">
                            Controla qué monedas puede operar EVA y con qué riesgo.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 marker:text-yellow-500">
                            <li><strong className="text-white">Modo Autónomo (Soberano):</strong> Si se activa, EVA ignora las restricciones y busca oportunidades en cualquier activo con saldo.</li>
                            <li><strong className="text-white">Matriz Manual:</strong> Permite activar/desactivar monedas específicas (ej. solo operar BTC y ETH).</li>
                            <li><strong className="text-white">Asignación de Capital:</strong> Define qué porcentaje de tu saldo se usa por operación.</li>
                        </ul>
                    </AccordionItem>

                    <AccordionItem 
                        title="CONFIGURACIÓN" 
                        icon={Icons.Settings}
                        isOpen={openSection === 'CONFIG'}
                        onClick={() => toggleSection('CONFIG')}
                    >
                        <p className="mb-3">
                            Ajustes fundamentales de la cuenta y estrategias.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 marker:text-blue-500">
                            <li><strong className="text-white">Credenciales API:</strong> Vinculación segura con Binance (Key + Secret).</li>
                            <li><strong className="text-white">Selección de Estrategia:</strong> Elige entre Scalping (rápido), Swing (lento) o AI Sentiment.</li>
                            <li><strong className="text-white">Gestión de Riesgo:</strong> Configura Stop Loss y Take Profit globales.</li>
                        </ul>
                    </AccordionItem>

                </div>
            </section>

            {/* SECCIÓN 2: PREGUNTAS FRECUENTES */}
            <section>
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-t border-slate-800 pt-8">
                    <Icons.Alert /> PREGUNTAS FRECUENTES (FAQ)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl hover:bg-slate-900/50 transition-colors">
                        <h3 className="text-emerald-400 font-bold text-sm mb-2">¿EVA opera mientras duermo?</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Sí. Si activas el <strong>"Bucle Automático"</strong> en la Red Neuronal o el <strong>"Modo Autónomo"</strong> en Configuración, EVA mantendrá el escaneo perpetuo mientras la pestaña del navegador permanezca abierta (o el servidor desplegado).
                        </p>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl hover:bg-slate-900/50 transition-colors">
                        <h3 className="text-emerald-400 font-bold text-sm mb-2">¿Es seguro poner mis API Keys?</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Absolutamente. Las claves se guardan <strong>localmente en tu navegador</strong> (LocalStorage) y nunca se envían a ningún servidor externo que no sea Binance para ejecutar órdenes. Tú tienes el control total.
                        </p>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl hover:bg-slate-900/50 transition-colors">
                        <h3 className="text-emerald-400 font-bold text-sm mb-2">¿Qué hace el "Modo Soberano"?</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Elimina la necesidad de confirmación humana. EVA detectará una señal de compra y ejecutará la orden de mercado inmediatamente. Úsalo con precaución y una buena gestión de riesgo configurada.
                        </p>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl hover:bg-slate-900/50 transition-colors">
                        <h3 className="text-emerald-400 font-bold text-sm mb-2">¿Para qué sirve Supabase?</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Actúa como la "Memoria a Largo Plazo". EVA guarda allí cada decisión que toma. Esto permite auditar el rendimiento pasado y, en futuras versiones, permitirá que la IA aprenda de sus propios errores (Reinforcement Learning).
                        </p>
                    </div>

                </div>
            </section>

          </div>

          {/* Footer del Documento */}
          <div className="mt-12 pt-8 border-t border-slate-800 text-center">
              <p className="text-slate-600 text-xs font-mono">
                  EVA PROTOCOL v10.5 DOCUMENTATION // SECURE CHANNEL
              </p>
          </div>

      </div>
    </div>
  );
};