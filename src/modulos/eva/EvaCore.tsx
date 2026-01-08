import React from 'react';

export const EvaCore = () => {
  return (
    <div className="flex-1 h-full w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Fondo sutil para mantener estética profesional */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      <h1 className="z-10 text-5xl md:text-7xl font-bold text-slate-200 tracking-tighter drop-shadow-2xl">
        Hola Mundo
      </h1>
    </div>
  );
};