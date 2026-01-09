import React from 'react';

export const HolaMundoView = () => {
  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-y-auto selection:bg-emerald-500/30">
      {/* Fondo ambiental sutil para dar profundidad sin distraer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none fixed"></div>
      
      {/* Contenedor Central Flotante */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000 zoom-in-95">
          
          {/* Tipografía Masiva Centrada */}
          <h1 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-600 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] select-none break-all">
            HOLA MUNDO
          </h1>

          {/* Elemento Decorativo Estático */}
          <div className="flex items-center gap-4 mt-8 opacity-60">
              <div className="w-12 h-[1px] bg-emerald-500"></div>
              <span className="text-emerald-500 font-mono text-xs tracking-[0.3em] uppercase font-bold animate-pulse">
                  Vista Activa
              </span>
              <div className="w-12 h-[1px] bg-emerald-500"></div>
          </div>

      </div>
    </div>
  );
};