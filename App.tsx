import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { EvaCore } from './src/modulos/eva/EvaCore';
import { NeuralNetworkView } from './src/modulos/red-neuronal/NeuralNetworkView';
import { ConfigurationView } from './src/modulos/configuracion/ConfigurationView';
import { AssetManagerView } from './src/modulos/activos/AssetManagerView';
import { Icons } from './src/components/Icons';
import { BinanceConfig, AssetConfig, View } from './src/types';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [dbConnected, setDbConnected] = useState(false);
  
  // Estado Global de Configuración (Valores por defecto para iniciar UI)
  const [config, setConfig] = useState<BinanceConfig>({
    email: '',
    apiKey: '',
    apiSecret: '',
    leverage: 20,
    useTestnet: false,
    maxPositionSize: 10,
    stopLoss: 2.0,
    takeProfit: 5.0,
    strategy: 'SCALPING_MACD',
    operationDuration: 60,
    autonomousMode: false
  });

  // Estado Simulado de Balance (Se pasará al Gestor de Activos)
  const [accountBalance, setAccountBalance] = useState([
    { asset: 'USDT', free: '5420.50', locked: '1200.00' },
    { asset: 'BTC', free: '0.045', locked: '0.00' },
    { asset: 'ETH', free: '1.2', locked: '0.5' },
    { asset: 'SOL', free: '15.0', locked: '0.0' }
  ]);

  // Verificación de conexión a Supabase al inicio
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('eva_collective_memory').select('count', { count: 'exact', head: true });
        setDbConnected(!error);
      } catch (e) {
        setDbConnected(false);
      }
    };
    checkConnection();
  }, []);

  const handleSaveConfig = async () => {
    console.log("Configuración guardada en memoria local y lista para sync:", config);
    // Aquí iría la lógica real de guardado en Supabase si fuera necesario
  };

  const handleSaveAssets = (assets: AssetConfig[]) => {
    console.log("Matriz de activos actualizada:", assets);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <EvaCore />;
      case 'EVA_BRAIN':
        return <NeuralNetworkView />;
      case 'SETTINGS':
        return (
          <ConfigurationView 
            config={config} 
            setConfig={setConfig} 
            dbConnected={dbConnected}
            onSave={handleSaveConfig}
          />
        );
      case 'ASSETS':
        return (
          <AssetManagerView 
            accountBalance={accountBalance}
            onSaveConfig={handleSaveAssets}
          />
        );
      default:
        return <EvaCore />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      title={label}
      className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
        currentView === view 
          ? 'bg-blue-600/10 text-blue-400' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      {currentView === view && (
        <div className="absolute inset-0 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"></div>
      )}
      <Icon />
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans overflow-hidden">
      
      {/* SIDEBAR COMPACTO */}
      <aside className="w-20 border-r border-slate-800/60 bg-slate-950/50 flex flex-col items-center py-6 relative z-20 hidden md:flex">
        
        {/* NAV SECTION START - Logo removed */}
        <nav className="flex-1 w-full flex flex-col items-center gap-4">
          <NavItem view="DASHBOARD" icon={Icons.Activity} label="Panel de Control" />
          <NavItem view="EVA_BRAIN" icon={Icons.Brain} label="Red Neuronal" />
          <NavItem view="ASSETS" icon={Icons.Coins} label="Gestor de Activos" />
          <NavItem view="SETTINGS" icon={Icons.Settings} label="Configuración" />
        </nav>

        <div className="mt-auto mb-4">
           <div className={`w-3 h-3 rounded-full ${dbConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} title={dbConnected ? "DB Online" : "DB Offline"}></div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Scanlines Effect */}
        <div className="scan-line pointer-events-none fixed inset-0 z-50 opacity-[0.03]"></div>
        
        {/* Header Mobile (Visible only on small screens) */}
        <div className="md:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
           <div className="flex items-center gap-3">
              <div className="transform scale-110"><Icons.Binance /></div>
              <span className="font-bold text-white tracking-wide">EVA v10.5</span>
           </div>
           <div className="flex gap-2">
             <button onClick={() => setCurrentView('DASHBOARD')} className={`p-2 rounded ${currentView === 'DASHBOARD' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'}`}><Icons.Activity /></button>
           </div>
        </div>

        {/* View Container */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {renderContent()}
        </div>
      </main>

    </div>
  );
}