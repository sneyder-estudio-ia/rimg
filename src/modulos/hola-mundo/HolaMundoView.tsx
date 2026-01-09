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
                className="w-full flex items-center justify-between p-4 active:bg-slate-800/50 transition-colors text-left outline-none group"
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
    <div className="w-full h-full bg-slate-950 relative overflow-y-auto selection:bg-emerald-500/30 custom-scrollbar pb-24 md:pb-0">
      {/* Fondo ambiental */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none fixed"></div>
      
      {/* CONTENIDO CENTRADO Y RESPONSIVO */}
      <div className="relative z-10 w-full min-h-full flex flex-col items-center">
          
          {/* SECCIÓN HERO CENTRADA */}
          <header className="w-full py-16 md:py-24 px-6 flex flex-col items-center justify-center text-center border-b border-slate-800/60 bg-gradient-to-b from-transparent to-slate-950/50">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                 <div className="transform scale-150 text-emerald-400"><Icons.Globe /></div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 tracking-tighter drop-shadow-2xl mb-4">
                HOLA MUNDO
              </h1>
              
              <div className="flex items-center gap-3 opacity-80 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-emerald-400 font-mono text-xs tracking-[0.2em] uppercase font-bold">
                      SISTEMA OPERATIVO MÓVIL
                  </span>
              </div>
          </header>

          {/* CONTENEDOR DE MANUAL (Ancho controlado) */}
          <div className="w-full max-w-3xl px-4 md:px-8 py-8 space-y-12">
            
            {/* SECCIÓN 1: MANUAL DE FUNCIONES */}
            <section className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
                <h2 className="text-center md:text-left text-lg font-bold text-white mb-6 flex items-center justify-center md:justify-start gap-2">
                    <Icons.Cpu /> MÓDULOS DEL SISTEMA
                </h2>
                <div className="flex flex-col gap-4">
                    
                    <AccordionItem 
                        title="PANEL DE CONTROL" 
                        icon={Icons.Activity}
                        isOpen={openSection === 'PANEL'}
                        onClick={() => toggleSection('PANEL')}
                    >
                        <p className="mb-3">
                            El centro de comando principal de EVA. Aquí visualizas el mercado en tiempo real mediante conexión WebSocket directa a Binance.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
                            <li><strong className="text-white">Gráfico en Vivo:</strong> Velas japonesas y herramientas técnicas.</li>
                            <li><strong className="text-white">Libro de Órdenes:</strong> Profundidad de mercado (Bids vs Asks).</li>
                            <li><strong className="text-white">Terminal EVA_OS:</strong> Logs del sistema en tiempo real.</li>
                        </ul>
                    </AccordionItem>

                    <AccordionItem 
                        title="RED NEURONAL" 
                        icon={Icons.Brain}
                        isOpen={openSection === 'NEURAL'}
                        onClick={() => toggleSection('NEURAL')}
                    >
                        <p className="mb-3">
                            El cerebro de la IA. Procesa datos matemáticos para encontrar patrones invisibles.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-purple-500">
                            <li><strong className="text-white">Visualizador Sináptico:</strong> Estado de "pensamiento" de EVA.</li>
                            <li><strong className="text-white">Bucle Automático:</strong> Escaneo perpetuo cada 10s.</li>
                            <li><strong className="text-white">Memoria Colectiva:</strong> Aprendizaje basado en Supabase.</li>
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
                        <ul className="list-disc pl-5 space-y-2 marker:text-yellow-500">
                            <li><strong className="text-white">Modo Soberano:</strong> EVA opera todo activo con saldo positivo.</li>
                            <li><strong className="text-white">Matriz Manual:</strong> Activa/desactiva monedas específicas.</li>
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
                        <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                            <li><strong className="text-white">API Keys:</strong> Vinculación segura con Binance.</li>
                            <li><strong className="text-white">Estrategia:</strong> Scalping vs Swing.</li>
                            <li><strong className="text-white">Riesgo:</strong> Stop Loss y Take Profit globales.</li>
                        </ul>
                    </AccordionItem>

                </div>
            </section>

            {/* SECCIÓN 2: TARJETAS FAQ (Grid responsivo) */}
            <section className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
                <h2 className="text-center md:text-left text-lg font-bold text-white mb-6 flex items-center justify-center md:justify-start gap-2 border-t border-slate-800 pt-8">
                    <Icons.Alert /> FAQ RÁPIDO
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl text-center md:text-left">
                        <h3 className="text-emerald-400 font-bold text-sm mb-2 flex items-center justify-center md:justify-start gap-2"><Icons.Clock /> ¿Opera durmiendo?</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Sí. Con el <strong>"Bucle Automático"</strong> activo, EVA mantiene el escaneo perpetuo.
                        </p>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl text-center md:text-left">
                        <h3 className="text-emerald-400 font-bold text-sm mb-2 flex items-center justify-center md:justify-start gap-2"><Icons.Shield /> ¿Es seguro?</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Tus claves API se guardan <strong>localmente</strong>. Tú tienes el control total.
                        </p>
                    </div>

                </div>
            </section>

          </div>

          {/* Footer del Documento */}
          <div className="mt-auto py-8 w-full text-center border-t border-slate-800/50 bg-slate-950">
              <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest">
                  EVA PROTOCOL v10.5 | MOBILE EDITION
              </p>
          </div>

      </div>
    </div>
  );
};