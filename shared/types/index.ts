// Shared TypeScript types for the crypto trading platform

export interface User {
  id: string;
  telegramId?: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    priceAlerts: boolean;
    tradeExecutions: boolean;
    portfolioUpdates: boolean;
    marketNews: boolean;
  };
  trading: {
    defaultSlippage: number;
    autoApprove: boolean;
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
  };
  display: {
    currency: 'USD' | 'EUR' | 'BTC' | 'ETH';
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}

export interface Portfolio {
  userId: string;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: Position[];
  lastUpdated: Date;
}

export interface Position {
  id: string;
  symbol: string;
  chain: BlockchainNetwork;
  amount: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  tokenAddress?: string;
}

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop-limit';
  amount: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected' | 'expired';
  exchange: string;
  chain?: BlockchainNetwork;
  fee: number;
  executedAmount: number;
  executedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
}

export interface Market {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
  exchange: string;
  chain?: BlockchainNetwork;
  lastUpdated: Date;
}

export interface Trade {
  id: string;
  orderId: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  fee: number;
  exchange: string;
  chain?: BlockchainNetwork;
  txHash?: string;
  timestamp: Date;
}

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface TelegramSession {
  userId: string;
  telegramId: number;
  chatId: number;
  isActive: boolean;
  lastActivity: Date;
  context?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  requestId?: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  timestamp: Date;
  checks: {
    database?: 'healthy' | 'unhealthy';
    redis?: 'healthy' | 'unhealthy';
    ethereum?: 'healthy' | 'unhealthy';
    solana?: 'healthy' | 'unhealthy';
    exchanges?: Record<string, 'healthy' | 'unhealthy' | 'demo-mode'>;
    memory?: {
      used: number;
      total: number;
      unit: string;
    };
    uptime?: number;
  };
}

export type BlockchainNetwork = 
  | 'ethereum'
  | 'solana' 
  | 'bsc'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'avalanche'
  | 'fantom';

export type Exchange = 
  | 'binance'
  | 'coinbase'
  | 'kraken'
  | 'uniswap'
  | 'pancakeswap'
  | 'sushiswap'
  | 'jupiter';

export interface ExchangeConfig {
  name: Exchange;
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
  sandbox: boolean;
  rateLimit: number;
  fees: {
    maker: number;
    taker: number;
  };
}

export interface BlockchainConfig {
  network: BlockchainNetwork;
  rpcUrl: string;
  chainId: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
}

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  minOrderSize: number;
  maxOrderSize: number;
  priceDecimals: number;
  quantityDecimals: number;
  isActive: boolean;
  exchanges: Exchange[];
  chains: BlockchainNetwork[];
}

export interface CopyTradeSettings {
  isEnabled: boolean;
  followedTraders: string[];
  maxCopyAmount: number;
  copyRatio: number;
  stopLoss?: number;
  takeProfit?: number;
  allowedSymbols: string[];
  excludedSymbols: string[];
}

export interface SocialPost {
  id: string;
  userId: string;
  content: string;
  type: 'trade' | 'analysis' | 'news' | 'discussion';
  attachments?: {
    images?: string[];
    trades?: string[];
    charts?: string[];
  };
  likes: number;
  comments: number;
  shares: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'price_alert' | 'trade_execution' | 'portfolio_update' | 'system' | 'social';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}
