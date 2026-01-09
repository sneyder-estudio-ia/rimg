
import React, { useEffect, useRef, useState } from 'react';

export const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState(0); // 0: Boot, 1: Loading, 2: Hello, 3: Exit
  const [opacity, setOpacity] = useState(1);

  // --- EFECTO DE PARTÍCULAS (WARP SPEED) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    // Ajuste por resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Configuración de estrellas
    const stars: { x: number; y: number; z: number }[] = [];
    const starCount = 400;
    const speed = 2; // Velocidad de viaje

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width
      });
    }

    let animationFrameId: number;

    const render = () => {
      // Fondo con trail effect
      ctx.fillStyle = 'rgba(2, 6, 23, 0.4)'; // Slate-950 con opacidad para trail
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      stars.forEach((star) => {
        // Mover estrella hacia la cámara
        star.z -= speed;
        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        // Proyección 3D
        const k = 128.0 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        // Tamaño y color basado en cercanía
        const size = (1 - star.z / width) * 3;
        const shade = Math.floor((1 - star.z / width) * 255);
        
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 50})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- SECUENCIA DE TEXTO Y FINALIZACIÓN ---
  useEffect(() => {
    const sequence = async () => {
      // Fase 1: Boot
      await typeText("EVA PROTOCOL v10.5", 50);
      await wait(800);
      
      // Fase 2: Loading Kernel
      setPhase(1);
      await typeText("INITIALIZING NEURAL CORE...", 30);
      await wait(1500);

      // Fase 3: Hola Mundo
      setPhase(2);
      await typeText("HOLA MUNDO", 100);
      await wait(2000);

      // Fase 4: Salida
      setPhase(3);
      setOpacity(0);
      await wait(1000); // Tiempo para la transición CSS
      onComplete();
    };

    sequence();
  }, [onComplete]);

  // Helper para escribir texto tipo máquina de escribir
  const typeText = (fullText: string, speed: number) => {
    return new Promise<void>((resolve) => {
      let i = 0;
      setText('');
      const interval = setInterval(() => {
        setText(fullText.substring(0, i + 1));
        i++;
        if (i === fullText.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000"
      style={{ opacity: opacity }}
    >
      {/* 1. CANVAS DE FONDO (Warp Speed) */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* 2. ESTRUCTURA 3D CSS (El Núcleo) */}
      <div className="relative z-10 perspective-container">
        <div className={`gyroscope ${phase === 2 ? 'expand-core' : ''}`}>
           {/* Anillo Exterior */}
           <div className="ring ring-1"></div>
           {/* Anillo Medio */}
           <div className="ring ring-2"></div>
           {/* Anillo Interior */}
           <div className="ring ring-3"></div>
           {/* Núcleo Central */}
           <div className="core-sphere"></div>
        </div>
      </div>

      {/* 3. TEXTO Y UI */}
      <div className="relative z-10 mt-12 text-center h-24">
        <div className={`font-mono font-bold tracking-[0.3em] transition-all duration-500 ${phase === 2 ? 'text-4xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]' : 'text-xl text-cyan-500'}`}>
          {text}
          <span className="animate-pulse">_</span>
        </div>
        
        {/* Barra de progreso decorativa */}
        {phase < 2 && (
            <div className="w-64 h-1 bg-slate-800 mt-4 mx-auto rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 animate-progress-bar"></div>
            </div>
        )}
      </div>

      {/* ESTILOS CSS INYECTADOS PARA 3D (Scoped) */}
      <style>{`
        .perspective-container {
          perspective: 1000px;
          transform-style: preserve-3d;
        }

        .gyroscope {
          position: relative;
          width: 200px;
          height: 200px;
          transform-style: preserve-3d;
          animation: float 6s ease-in-out infinite;
        }

        .expand-core {
            animation: expand-burst 2s forwards;
        }

        .ring {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 2px solid transparent;
          box-shadow: 0 0 20px rgba(0,0,0,0);
        }

        .ring-1 {
          border-top: 4px solid #06b6d4; /* Cyan */
          border-bottom: 4px solid #06b6d4;
          animation: spin-x 4s linear infinite;
        }

        .ring-2 {
          width: 80%; height: 80%;
          top: 10%; left: 10%;
          border-left: 4px solid #a855f7; /* Purple */
          border-right: 4px solid #a855f7;
          animation: spin-y 5s linear infinite reverse;
        }

        .ring-3 {
          width: 60%; height: 60%;
          top: 20%; left: 20%;
          border: 2px dashed #10b981; /* Emerald */
          animation: spin-z 10s linear infinite;
        }

        .core-sphere {
            position: absolute;
            top: 35%; left: 35%;
            width: 30%; height: 30%;
            background: radial-gradient(circle, #fff 0%, #06b6d4 50%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 30px #06b6d4;
            animation: pulse-core 2s ease-in-out infinite;
        }

        @keyframes spin-x {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(180deg); }
        }
        @keyframes spin-y {
          0% { transform: rotateY(0deg) rotateX(0deg); }
          100% { transform: rotateY(360deg) rotateX(180deg); }
        }
        @keyframes spin-z {
          0% { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-core {
          0%, 100% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes progress-bar {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        @keyframes expand-burst {
            0% { transform: scale(1); }
            50% { transform: scale(1.5); filter: brightness(2); }
            100% { transform: scale(0.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
