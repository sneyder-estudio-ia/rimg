import React from 'react';

export const EvaCore = () => {
  return (
    <div className="flex-1 h-full w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Fondo estético sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/30 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      {/* Contenido centrado */}
      <div className="z-10 text-center animate-in fade-in zoom-in duration-700 p-4">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-600 tracking-tighter drop-shadow-2xl">
          Hola Mundo
        </h1>
        <div className="mt-4 h-1 w-32 bg-yellow-500/50 mx-auto rounded-full blur-[2px]"></div>
      </div>
    </div>
  );
};