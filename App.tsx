import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 text-white p-4">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent animate-pulse">
          Hola Mundo
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-light">
          Modo Oscuro Activo
        </p>
      </div>
    </div>
  );
}