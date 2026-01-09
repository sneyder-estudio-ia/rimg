import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { EvaCore } from './src/modulos/eva/EvaCore';
import { NeuralNetworkView } from './src/modulos/red-neuronal/NeuralNetworkView';
import { ConfigurationView } from './src/modulos/configuracion/ConfigurationView';
import { AssetManagerView } from './src/modulos/activos/AssetManagerView';
import { HolaMundoView } from './src/modulos/hola-mundo/HolaMundoView';
import { Icons } from './src/components/Icons';
import { BinanceConfig, AssetConfig, View } from './src/types';

// Configuración por defecto para inicialización
const DEFAULT_CONFIG: BinanceConfig = {
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
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [dbConnected, setDbConnected] = useState(false);
  
  // --- ESTADO GLOBAL CON PERSISTENCIA (LOCALSTORAGE) ---
  
  // 1. Configuración Global (Inicialización Lazy)
  const [config, setConfig] = useState<BinanceConfig>(() => {
    try {
      const saved = localStorage.getItem('eva_config_v10');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  // 2. Matriz de Activos (Inicialización Lazy)
  const [assetConfigs, setAssetConfigs] = useState<AssetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('eva_assets_v10');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Estado Simulado de Balance
  const [accountBalance, setAccountBalance] = useState([
    { asset: 'USDT', free: '5420.50', locked: '1200.00' },
    { asset: 'BTC', free: '0.045', locked: '0.00' },
    { asset: 'ETH', free: '1.2', locked: '0.5' },
    { asset: 'SOL', free: '15.0', locked: '0.0' }
  ]);

  // --- EFECTOS DE PERSISTENCIA ---
  
  // Guardar Configuración al detectar cambios
  useEffect(() => {
    localStorage.setItem('eva_config_v10', JSON.stringify(config));
  }, [config]);

  // Guardar Activos al detectar cambios
  useEffect(() => {
    localStorage.setItem('eva_assets_v10', JSON.stringify(assetConfigs));
  }, [assetConfigs]);

  // Verificación de conexión a Supabase
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
    console.log("SYNC: Configuración guardada y persistida.");
    // Aquí se podría agregar lógica para guardar en Supabase también
  };

  const handleSaveAssets = (assets: AssetConfig[]) => {
    console.log("SYNC: Matriz de activos actualizada.");
    setAssetConfigs(assets);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <EvaCore config={config} />;
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
            savedAssetConfigs={assetConfigs}
            onSaveConfig={handleSaveAssets}
            autonomousMode={config.autonomousMode}
            onToggleAutoMode={(val) => setConfig(prev => ({ ...prev, autonomousMode: val }))}
            onNavigate={() => setCurrentView('DASHBOARD')} 
          />
        );
      case 'HOLA_MUNDO':
        return <HolaMundoView />;
      default:
        return <EvaCore config={config} />;
    }
  };

  // Componente de Navegación Lateral (Desktop)
  const SidebarItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
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

  // Componente de Navegación Inferior (Mobile)
  const MobileNavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${
        currentView === view ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <div className={`p-1 rounded-lg ${currentView === view ? 'bg-blue-500/10' : ''}`}>
        <Icon />
      </div>
      <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans overflow-hidden">
      
      {/* SIDEBAR COMPACTO (SOLO DESKTOP) */}
      <aside className="w-20 border-r border-slate-800/60 bg-slate-950/50 hidden md:flex flex-col items-center py-6 relative z-20">
        <nav className="flex-1 w-full flex flex-col items-center gap-4">
          <SidebarItem view="DASHBOARD" icon={Icons.Activity} label="Panel de Control" />
          <SidebarItem view="EVA_BRAIN" icon={Icons.Brain} label="Red Neuronal" />
          <SidebarItem view="ASSETS" icon={Icons.Coins} label="Gestor de Activos" />
          <SidebarItem view="SETTINGS" icon={Icons.Settings} label="Configuración" />
          <div className="w-8 h-[1px] bg-slate-800 my-2"></div>
          <SidebarItem view="HOLA_MUNDO" icon={Icons.Globe} label="Hola Mundo" />
        </nav>
        <div className="mt-auto mb-4">
           <div className={`w-3 h-3 rounded-full ${dbConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} title={dbConnected ? "DB Online" : "DB Offline"}></div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Scanlines Effect */}
        <div className="scan-line pointer-events-none fixed inset-0 z-50 opacity-[0.03]"></div>
        
        {/* HEADER MÓVIL (SOLO BRANDING) */}
        <div className="md:hidden px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/90 backdrop-blur z-30 sticky top-0">
           <div className="flex items-center gap-3">
              <div className="transform scale-110"><Icons.Binance /></div>
              <span className="font-bold text-white tracking-wide text-lg">EVA v10.5</span>
           </div>
           <div className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
        </div>

        {/* CONTENEDOR DE VISTAS */}
        <div className="flex-1 overflow-hidden relative flex flex-col pb-[70px] md:pb-0">
          {renderContent()}
        </div>

        {/* BARRA DE NAVEGACIÓN INFERIOR (SOLO MÓVIL) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 flex justify-around items-center z-50 backdrop-blur-md pb-safe">
            <MobileNavItem view="DASHBOARD" icon={Icons.Activity} label="Panel" />
            <MobileNavItem view="EVA_BRAIN" icon={Icons.Brain} label="Cerebro" />
            <MobileNavItem view="ASSETS" icon={Icons.Coins} label="Activos" />
            <MobileNavItem view="SETTINGS" icon={Icons.Settings} label="Ajustes" />
            <MobileNavItem view="HOLA_MUNDO" icon={Icons.Globe} label="Info" />
        </div>
      </main>

    </div>
  );
}