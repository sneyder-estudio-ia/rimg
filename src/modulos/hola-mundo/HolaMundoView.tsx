
import React from 'react';

export const HolaMundoView = () => {
  return (
    <div className="flex-1 w-full h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* FONDO ANIMADO SUTIL */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

        {/* CONTENIDO CENTRAL */}
        <div className="relative z-10 flex flex-col items-center animate-in zoom-in-50 duration-700">
            
            {/* CÍRCULO DECORATIVO */}
            <div className="w-32 h-32 rounded-full border border-slate-800 flex items-center justify-center mb-8 relative group">
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border border-slate-800"></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse"></div>
            </div>

            {/* TEXTO PRINCIPAL */}
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-700 tracking-tighter drop-shadow-2xl select-none">
                HOLA MUNDO
            </h1>

            {/* SUBTÍTULO TÉCNICO */}
            <div className="mt-6 flex items-center gap-4 text-xs font-mono text-slate-500 tracking-[0.3em] uppercase opacity-70">
                <span>Sistema Operativo</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>EVA v10.5</span>
            </div>

        </div>

    </div>
  );
};
