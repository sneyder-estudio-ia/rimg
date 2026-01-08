
export type View = 'DASHBOARD' | 'SETTINGS' | 'EVA_BRAIN' | 'NEURAL_NET';
export type BotStatus = 'IDLE' | 'CONNECTING' | 'ANALYZING' | 'EXECUTING' | 'HALTED';
export type ChartType = 'line' | 'candle' | 'bar' | 'area' | 'depth';
export type StrategyType = 'SCALPING_MACD' | 'SWING_RSI' | 'AI_SENTIMENT';

export interface MarketData {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
}

export interface BinanceConfig {
  email: string; // Mandatory for recovery
  apiKey: string;
  apiSecret: string;
  leverage: number;
  useTestnet: boolean;
  maxPositionSize: number; // % of balance
  stopLoss: number; // %
  takeProfit: number; // %
  strategy: StrategyType;
  operationDuration: number; // minutes
}

export interface NeuralMemory {
    id: string;
    input_pattern: any;
    decision: string;
    outcome_score: number;
    strategy_used: string;
    confidence_level: number;
    created_at: string;
}