
import React from 'react';

export const HolaMundoView = () => {
  return (
    <div className="flex-1 w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* FONDO OSCURO ABSOLUTO */}
        <div className="absolute inset-0 bg-slate-950 pointer-events-none"></div>

        {/* CONTENIDO CENTRAL */}
        <div className="relative z-10 flex flex-col items-center justify-center animate-in zoom-in-90 duration-1000">
            
            {/* LOGO SIMPLIFICADO */}
            <div className="mb-8">
               <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse"></div>
            </div>

            {/* TEXTO HOLA MUNDO CENTRADO */}
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-widest select-none">
                HOLA MUNDO
            </h1>

            <p className="mt-4 text-slate-500 font-mono text-sm tracking-widest uppercase">
                EVA v10.5 // SYSTEM ONLINE
            </p>

        </div>

    </div>
  );
};
