import { Pool, PoolConfig } from 'pg';
import { createClient, RedisClientType } from 'redis';

// Database configuration
export const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '5'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
};

// Redis configuration
export const redisConfig = {
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000'),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
    reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
  },
  database: parseInt(process.env.REDIS_DB || '0'),
};

// Database connection pool
let dbPool: Pool | null = null;

export function getDbPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool(dbConfig);
    
    // Handle pool errors
    dbPool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
    
    dbPool.on('connect', () => {
      console.log('Database pool connected');
    });
  }
  
  return dbPool;
}

// Redis client
let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient(redisConfig);
    
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });
    
    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });
    
    redisClient.on('end', () => {
      console.log('Redis client disconnected');
    });
    
    await redisClient.connect();
  }
  
  return redisClient;
}

// Database initialization
export async function initializeDatabase(): Promise<void> {
  const pool = getDbPool();
  
  try {
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    console.log('Database connection established');
    
    // Run migrations if needed
    await runMigrations();
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Basic migrations
async function runMigrations(): Promise<void> {
  const pool = getDbPool();
  
  const migrations = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      telegram_id BIGINT UNIQUE,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      avatar TEXT,
      is_active BOOLEAN DEFAULT true,
      preferences JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // Portfolios table
    `CREATE TABLE IF NOT EXISTS portfolios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      total_value DECIMAL(20,8) DEFAULT 0,
      total_pnl DECIMAL(20,8) DEFAULT 0,
      total_pnl_percent DECIMAL(10,4) DEFAULT 0,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    )`,
    
    // Positions table
    `CREATE TABLE IF NOT EXISTS positions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      chain VARCHAR(50),
      amount DECIMAL(20,8) NOT NULL,
      average_price DECIMAL(20,8) NOT NULL,
      current_price DECIMAL(20,8) NOT NULL,
      value DECIMAL(20,8) NOT NULL,
      pnl DECIMAL(20,8) NOT NULL,
      pnl_percent DECIMAL(10,4) NOT NULL,
      token_address VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // Orders table
    `CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
      type VARCHAR(20) NOT NULL CHECK (type IN ('market', 'limit', 'stop', 'stop-limit')),
      amount DECIMAL(20,8) NOT NULL,
      price DECIMAL(20,8),
      stop_price DECIMAL(20,8),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected', 'expired')),
      exchange VARCHAR(50) NOT NULL,
      chain VARCHAR(50),
      fee DECIMAL(20,8) DEFAULT 0,
      executed_amount DECIMAL(20,8) DEFAULT 0,
      executed_price DECIMAL(20,8),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      executed_at TIMESTAMP WITH TIME ZONE
    )`,
    
    // Trades table
    `CREATE TABLE IF NOT EXISTS trades (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
      amount DECIMAL(20,8) NOT NULL,
      price DECIMAL(20,8) NOT NULL,
      fee DECIMAL(20,8) NOT NULL,
      exchange VARCHAR(50) NOT NULL,
      chain VARCHAR(50),
      tx_hash VARCHAR(255),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // Price alerts table
    `CREATE TABLE IF NOT EXISTS price_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      condition VARCHAR(10) NOT NULL CHECK (condition IN ('above', 'below')),
      target_price DECIMAL(20,8) NOT NULL,
      current_price DECIMAL(20,8) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      is_triggered BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      triggered_at TIMESTAMP WITH TIME ZONE
    )`,
    
    // Telegram sessions table
    `CREATE TABLE IF NOT EXISTS telegram_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      telegram_id BIGINT NOT NULL,
      chat_id BIGINT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      context JSONB DEFAULT '{}',
      UNIQUE(telegram_id)
    )`,
    
    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSONB DEFAULT '{}',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      read_at TIMESTAMP WITH TIME ZONE
    )`,
    
    // Indexes for performance
    `CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id ON positions(portfolio_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_sessions_telegram_id ON telegram_sessions(telegram_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read)`,
  ];
  
  for (const migration of migrations) {
    try {
      await pool.query(migration);
    } catch (error) {
      console.error('Migration failed:', migration, error);
      throw error;
    }
  }
  
  console.log('Database migrations completed');
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
    
    if (dbPool) {
      await dbPool.end();
      dbPool = null;
    }
    
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}
