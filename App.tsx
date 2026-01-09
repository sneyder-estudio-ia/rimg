
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { EvaCore } from './src/modulos/eva/EvaCore';
import { NeuralNetworkView } from './src/modulos/red-neuronal/NeuralNetworkView';
import { ConfigurationView } from './src/modulos/configuracion/ConfigurationView';
import { AssetManagerView } from './src/modulos/activos/AssetManagerView';
import { HolaMundoView } from './src/modulos/hola-mundo/HolaMundoView';
import { WalletView } from './src/modulos/billetera/WalletView';
import { IntroAnimation } from './src/modulos/intro/IntroAnimation';
import { Icons } from './src/components/Icons';
import { getAccountInfo } from './src/services/binanceService';
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
  const [showIntro, setShowIntro] = useState(true); // Estado para controlar la intro
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [dbConnected, setDbConnected] = useState(false);
  
  // --- ESTADO DE ALERTA DE FONDOS ---
  const [showLowFundsAlert, setShowLowFundsAlert] = useState(false);
  const [totalLiquidityDetected, setTotalLiquidityDetected] = useState(0);

  // --- SISTEMA DE LOGGING CENTRALIZADO (NÚCLEO OMNISCIENTE) ---
  const [systemLogs, setSystemLogs] = useState<string[]>([
      "EVA_SYS_INIT: Núcleo central inicializado.",
      "MEMORY_ALLOC: Enlazando módulos neuronales...",
      "READY: Esperando flujo de datos."
  ]);

  const addSystemLog = (msg: string, type: 'INFO' | 'WARN' | 'EXEC' | 'SYS' = 'INFO') => {
      const time = new Date().toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const prefix = type === 'EXEC' ? '⚡ EXEC:' : type === 'WARN' ? '⚠️ WARN:' : type === 'SYS' ? '🚀 SYS:' : 'ℹ️ INFO:';
      // Mantenemos solo los últimos 50 logs para rendimiento
      setSystemLogs(prev => [...prev.slice(-49), `[${time}] ${prefix} ${msg}`]);
  };

  // --- ESTADO GLOBAL CON PERSISTENCIA (LOCALSTORAGE) ---
  
  // 1. Configuración Global (Inicialización Lazy)
  const [config, setConfig] = useState<BinanceConfig>(() => {
    try {
      const saved = localStorage.getItem('eva_config_v10');
      if (saved) addSystemLog("Configuración recuperada de almacenamiento local.", 'SYS');
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

  // --- ESTADO DE BALANCE REAL (Cero Latencia Mental: Sin datos Mock) ---
  const [accountBalance, setAccountBalance] = useState<{ asset: string, free: string, locked: string }[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // --- FUNCIÓN DE SINCRONIZACIÓN REAL BINANCE ---
  const fetchWalletData = async () => {
    if (!config.apiKey || !config.apiSecret) {
        if(currentView === 'WALLET') addSystemLog("WALLET_ERR: API Keys no configuradas. Configure en Ajustes.", 'WARN');
        return;
    }

    setIsLoadingBalance(true);
    try {
        const data = await getAccountInfo(config.apiKey, config.apiSecret);
        if (data && data.balances) {
            setAccountBalance(data.balances);
            addSystemLog("WALLET_SYNC: Bóveda sincronizada con Binance Mainnet.", 'SYS');

            // --- DETECCIÓN DE FONDOS (LÓGICA CRÍTICA) ---
            const usdt = data.balances.find((b: any) => b.asset === 'USDT');
            const fdusd = data.balances.find((b: any) => b.asset === 'FDUSD');
            
            const totalUSDT = usdt ? parseFloat(usdt.free) + parseFloat(usdt.locked) : 0;
            const totalFDUSD = fdusd ? parseFloat(fdusd.free) + parseFloat(fdusd.locked) : 0;
            const totalLiquidity = totalUSDT + totalFDUSD;

            setTotalLiquidityDetected(totalLiquidity);

            // Si hay conexión correcta PERO menos de 5 USD, activar alerta (SOLO SI NO ESTAMOS EN DASHBOARD)
            // Si estamos en dashboard, dejamos que EvaCore maneje el bloqueo al intentar iniciar.
            if (totalLiquidity < 5 && currentView === 'WALLET') {
                setShowLowFundsAlert(true);
                addSystemLog(`CRITICAL: Liquidez insuficiente (${totalLiquidity.toFixed(2)} USD).`, 'WARN');
            }
        }
    } catch (error: any) {
        console.error(error);
        addSystemLog(`WALLET_FAIL: Error de conexión API: ${error.message}`, 'WARN');
    } finally {
        setIsLoadingBalance(false);
    }
  };

  // --- EFECTOS DE PERSISTENCIA ---
  
  // Guardar Configuración al detectar cambios
  useEffect(() => {
    localStorage.setItem('eva_config_v10', JSON.stringify(config));
  }, [config]);

  // Guardar Activos al detectar cambios
  useEffect(() => {
    localStorage.setItem('eva_assets_v10', JSON.stringify(assetConfigs));
  }, [assetConfigs]);

  // Trigger de actualización de billetera al entrar en vistas relevantes
  useEffect(() => {
      if (currentView === 'WALLET' || currentView === 'ASSETS' || currentView === 'DASHBOARD') {
          // Intentamos sincronizar si hay keys configuradas
          if (config.apiKey && config.apiSecret) {
              fetchWalletData();
          }
      }
  }, [currentView, config.apiKey]);

  // Verificación de conexión a Supabase
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('eva_collective_memory').select('count', { count: 'exact', head: true });
        const isConnected = !error;
        setDbConnected(isConnected);
        addSystemLog(`Estado de Base de Datos: ${isConnected ? 'CONECTADO' : 'ERROR DE CONEXIÓN'}`, isConnected ? 'SYS' : 'WARN');
      } catch (e) {
        setDbConnected(false);
        addSystemLog("Fallo crítico al contactar Supabase.", 'WARN');
      }
    };
    checkConnection();
  }, []);

  const handleSaveConfig = async () => {
    addSystemLog("SYNC: Configuración guardada y persistida.", 'SYS');
    // Intentar reconectar wallet si se guardan nuevas keys
    fetchWalletData();
  };

  const handleSaveAssets = (assets: AssetConfig[]) => {
    addSystemLog(`SYNC: Matriz de activos actualizada. ${assets.length} activos rastreados.`, 'SYS');
    setAssetConfigs(assets);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
            <EvaCore 
                config={config} 
                logs={systemLogs} 
                onLog={addSystemLog}
                totalLiquidity={totalLiquidityDetected} // <--- SE PASA LA LIQUIDEZ AL NÚCLEO
            />
        );
      case 'EVA_BRAIN':
        return (
            <NeuralNetworkView 
                onLog={addSystemLog} 
            />
        );
      case 'WALLET':
        return (
            <WalletView 
                accountBalance={accountBalance}
                onNavigate={(view) => setCurrentView(view)}
                onRefresh={fetchWalletData}
                isLoading={isLoadingBalance}
                hasApiKeys={!!config.apiKey && !!config.apiSecret}
            />
        );
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
            onToggleAutoMode={(val) => {
                setConfig(prev => ({ ...prev, autonomousMode: val }));
                addSystemLog(`MODO AUTÓNOMO: ${val ? 'ACTIVADO' : 'DESACTIVADO'}`, 'WARN');
            }}
            onNavigate={() => setCurrentView('DASHBOARD')} 
            onLog={addSystemLog}
          />
        );
      case 'HOLA_MUNDO':
        return <HolaMundoView />;
      default:
        return <EvaCore config={config} logs={systemLogs} onLog={addSystemLog} totalLiquidity={totalLiquidityDetected} />;
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
    <>
      {/* ALERTA CRÍTICA DE FONDOS INSUFICIENTES (GLOBAL) */}
      {showLowFundsAlert && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-rose-950/20 border-2 border-rose-600 rounded-2xl max-w-lg w-full p-8 shadow-[0_0_100px_rgba(225,29,72,0.2)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>
                  
                  <div className="relative z-10 text-center">
                      <div className="w-20 h-20 bg-rose-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500 animate-pulse">
                          <div className="transform scale-150 text-rose-500"><Icons.Alert /></div>
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">ERROR DE CAPITAL</h2>
                      <div className="h-1 w-24 bg-rose-600 mx-auto mb-6 rounded-full"></div>
                      
                      <p className="text-slate-300 mb-2 font-mono text-sm">EVA HA DETECTADO UNA LIQUIDEZ CRÍTICA DE:</p>
                      <div className="text-4xl font-mono font-bold text-rose-500 mb-6">${totalLiquidityDetected.toFixed(2)} USDT</div>
                      
                      <p className="text-slate-400 text-sm mb-8 leading-relaxed border border-rose-900/50 bg-rose-900/10 p-4 rounded-lg">
                          El protocolo requiere un mínimo de <strong>10 USDT</strong> para ejecutar operaciones en Binance. Por favor deposite fondos o convierta activos.
                      </p>

                      <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => window.open('https://www.binance.com/es/my/wallet/account/main', '_blank')}
                            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg tracking-widest text-sm shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center gap-2"
                        >
                            <Icons.Wallet /> DEPOSITAR EN BINANCE
                        </button>
                        <button 
                            onClick={() => {
                                setShowLowFundsAlert(false);
                            }}
                            className="w-full py-3 bg-transparent border border-slate-700 text-slate-500 hover:text-slate-300 font-bold rounded-lg text-xs"
                        >
                            IGNORAR Y CONTINUAR (SOLO LECTURA)
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* RENDERIZADO CONDICIONAL DE LA INTRO */}
      {showIntro ? (
        <IntroAnimation onComplete={() => setShowIntro(false)} />
      ) : (
        <div className="flex h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans overflow-hidden animate-in fade-in duration-1000">
          
          {/* SIDEBAR COMPACTO (SOLO DESKTOP) */}
          <aside className="w-20 border-r border-slate-800/60 bg-slate-950/50 hidden md:flex flex-col items-center py-6 relative z-20">
            <nav className="flex-1 w-full flex flex-col items-center gap-4">
              <SidebarItem view="DASHBOARD" icon={Icons.Activity} label="Panel de Control" />
              <SidebarItem view="EVA_BRAIN" icon={Icons.Brain} label="Red Neuronal" />
              <SidebarItem view="WALLET" icon={Icons.Wallet} label="Billetera" />
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
                <MobileNavItem view="WALLET" icon={Icons.Wallet} label="Wallet" />
                <MobileNavItem view="ASSETS" icon={Icons.Coins} label="Activos" />
                <MobileNavItem view="SETTINGS" icon={Icons.Settings} label="Ajustes" />
            </div>
          </main>

        </div>
      )}
    </>
  );
}
