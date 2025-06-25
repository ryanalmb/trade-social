import express from 'express';
import { Telegraf } from 'telegraf';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { Pool } from 'pg';
import { createClient } from 'redis';

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
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'telegram-bot',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbResult.rows.length > 0 ? 'healthy' : 'unhealthy',
        redis: redisResult === 'PONG' ? 'healthy' : 'unhealthy',
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
      service: 'telegram-bot',
      error: 'Service unavailable'
    });
  }
});

// Readiness probe
app.get('/ready', async (req, res) => {
  try {
    await dbPool.query('SELECT 1');
    await redisClient.ping();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

// Liveness probe
app.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Telegram bot setup
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Bot commands
bot.start((ctx) => {
  ctx.reply('🚀 Welcome to Enterprise Crypto Trading Platform!\n\nUse /help to see available commands.');
});

bot.help((ctx) => {
  const helpMessage = `
🤖 *Enterprise Crypto Trading Bot*

*Available Commands:*
/start - Start the bot
/help - Show this help message
/portfolio - View your portfolio
/buy - Buy cryptocurrency
/sell - Sell cryptocurrency
/price - Get current prices
/settings - Bot settings

*Coming Soon:*
- Advanced trading features
- Copy trading
- Portfolio analytics
- Social features

Type any command to get started!
  `;
  ctx.replyWithMarkdown(helpMessage);
});

bot.command('portfolio', (ctx) => {
  ctx.reply('📊 Portfolio feature coming soon! This will show your trading portfolio with real-time P&L.');
});

bot.command('buy', (ctx) => {
  ctx.reply('💰 Buy feature coming soon! This will allow you to buy cryptocurrencies across multiple exchanges.');
});

bot.command('sell', (ctx) => {
  ctx.reply('💸 Sell feature coming soon! This will allow you to sell cryptocurrencies with optimal routing.');
});

bot.command('price', (ctx) => {
  ctx.reply('📈 Price feature coming soon! This will show real-time prices from multiple exchanges.');
});

bot.command('settings', (ctx) => {
  ctx.reply('⚙️ Settings feature coming soon! This will allow you to configure your trading preferences.');
});

// Webhook endpoint for Telegram
app.use(bot.webhookCallback('/telegram/webhook'));

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
  
  // Stop the bot
  bot.stop();
  
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
    
    // Set webhook for Telegram bot
    if (process.env.TELEGRAM_WEBHOOK_URL) {
      await bot.telegram.setWebhook(process.env.TELEGRAM_WEBHOOK_URL);
      logger.info('Telegram webhook set');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Telegram Bot Service started on port ${PORT}`);
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
