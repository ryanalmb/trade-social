import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { Pool } from 'pg';
import { createClient } from 'redis';
import ccxt from 'ccxt';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';

// Load environment variables
dotenv.config();

// Logger configuration
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Database connection
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Blockchain connections
const ethereumProvider = new ethers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo'
);

const solanaConnection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Exchange connections (demo mode)
const exchanges = {
  binance: new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY || 'demo',
    secret: process.env.BINANCE_SECRET_KEY || 'demo',
    sandbox: process.env.NODE_ENV !== 'production',
  }),
  coinbase: new ccxt.coinbasepro({
    apiKey: process.env.COINBASE_API_KEY || 'demo',
    secret: process.env.COINBASE_SECRET_KEY || 'demo',
    passphrase: process.env.COINBASE_PASSPHRASE || 'demo',
    sandbox: process.env.NODE_ENV !== 'production',
  }),
};

// Express app setup
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbResult = await dbPool.query('SELECT 1');
    
    // Check Redis connection
    const redisResult = await redisClient.ping();
    
    // Check blockchain connections
    const ethBlockNumber = await ethereumProvider.getBlockNumber();
    const solanaSlot = await solanaConnection.getSlot();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'trading-engine',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbResult.rows.length > 0 ? 'healthy' : 'unhealthy',
        redis: redisResult === 'PONG' ? 'healthy' : 'unhealthy',
        ethereum: ethBlockNumber > 0 ? 'healthy' : 'unhealthy',
        solana: solanaSlot > 0 ? 'healthy' : 'unhealthy',
        exchanges: {
          binance: 'demo-mode',
          coinbase: 'demo-mode'
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        uptime: Math.round(process.uptime())
      }
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'trading-engine',
      error: 'Service unavailable'
    });
  }
});

// Trading API endpoints
app.get('/api/markets', async (req, res) => {
  try {
    // Demo market data
    const markets = {
      ethereum: {
        'ETH/USDT': { price: 2100.50, change24h: 2.5, volume: 1500000 },
        'BTC/USDT': { price: 42000.00, change24h: -1.2, volume: 2500000 },
      },
      solana: {
        'SOL/USDT': { price: 65.30, change24h: 5.8, volume: 800000 },
        'RAY/USDT': { price: 1.25, change24h: 3.2, volume: 150000 },
      }
    };
    
    res.json({
      success: true,
      data: markets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Markets API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch markets'
    });
  }
});

app.get('/api/portfolio/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Demo portfolio data
    const portfolio = {
      userId,
      totalValue: 10000.00,
      totalPnL: 250.50,
      totalPnLPercent: 2.56,
      positions: [
        {
          symbol: 'ETH/USDT',
          amount: 2.5,
          value: 5251.25,
          pnl: 125.25,
          pnlPercent: 2.44
        },
        {
          symbol: 'BTC/USDT',
          amount: 0.1,
          value: 4200.00,
          pnl: 100.00,
          pnlPercent: 2.44
        }
      ]
    };
    
    res.json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Portfolio API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio'
    });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { symbol, side, amount, price, type = 'market' } = req.body;
    
    // Validate order
    if (!symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required order parameters'
      });
    }
    
    // Demo order execution
    const order = {
      id: `order_${Date.now()}`,
      symbol,
      side,
      amount,
      price: price || 2100.50, // Demo price
      type,
      status: 'filled',
      timestamp: new Date().toISOString(),
      fee: amount * 0.001 // 0.1% fee
    };
    
    logger.info('Order executed:', order);
    
    res.json({
      success: true,
      data: order,
      message: 'Order executed successfully'
    });
  } catch (error) {
    logger.error('Order execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute order'
    });
  }
});

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Demo order history
    const orders = [
      {
        id: 'order_1701234567890',
        symbol: 'ETH/USDT',
        side: 'buy',
        amount: 1.0,
        price: 2050.00,
        type: 'market',
        status: 'filled',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        fee: 0.001
      },
      {
        id: 'order_1701234567891',
        symbol: 'BTC/USDT',
        side: 'buy',
        amount: 0.05,
        price: 41500.00,
        type: 'limit',
        status: 'filled',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        fee: 0.0005
      }
    ];
    
    res.json({
      success: true,
      data: orders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Order history API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order history'
    });
  }
});

// Readiness and liveness probes
app.get('/ready', async (req, res) => {
  try {
    await dbPool.query('SELECT 1');
    await redisClient.ping();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

app.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  await dbPool.end();
  
  // Close Redis connection
  await redisClient.quit();
  
  process.exit(0);
});

// Initialize and start server
async function startServer() {
  try {
    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');
    
    // Test database connection
    await dbPool.query('SELECT 1');
    logger.info('Connected to PostgreSQL');
    
    // Test blockchain connections
    const ethBlock = await ethereumProvider.getBlockNumber();
    logger.info(`Connected to Ethereum, latest block: ${ethBlock}`);
    
    const solanaSlot = await solanaConnection.getSlot();
    logger.info(`Connected to Solana, latest slot: ${solanaSlot}`);
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Trading Engine Service started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
