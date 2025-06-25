import { createLogger, format, transports, Logger } from 'winston';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

// Log context interface
export interface LogContext {
  service?: string;
  userId?: string;
  requestId?: string;
  tradeId?: string;
  orderId?: string;
  symbol?: string;
  exchange?: string;
  chain?: string;
  [key: string]: any;
}

// Custom log format
const customFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, service, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      service: service || process.env.SERVICE_NAME || 'unknown',
      message,
      ...meta
    };
    
    return JSON.stringify(logEntry);
  })
);

// Create logger instance
function createAppLogger(serviceName?: string): Logger {
  const logger = createLogger({
    level: process.env.LOG_LEVEL || LogLevel.INFO,
    format: customFormat,
    defaultMeta: {
      service: serviceName || process.env.SERVICE_NAME || 'crypto-platform'
    },
    transports: [
      // Console transport
      new transports.Console({
        format: process.env.NODE_ENV === 'development' 
          ? format.combine(
              format.colorize(),
              format.simple(),
              format.printf(({ timestamp, level, message, service, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
              })
            )
          : customFormat
      }),
      
      // File transports for production
      ...(process.env.NODE_ENV === 'production' ? [
        new transports.File({
          filename: 'logs/error.log',
          level: LogLevel.ERROR,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      ] : [])
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: [
      new transports.Console(),
      ...(process.env.NODE_ENV === 'production' ? [
        new transports.File({ filename: 'logs/exceptions.log' })
      ] : [])
    ],
    
    rejectionHandlers: [
      new transports.Console(),
      ...(process.env.NODE_ENV === 'production' ? [
        new transports.File({ filename: 'logs/rejections.log' })
      ] : [])
    ]
  });

  return logger;
}

// Default logger instance
export const logger = createAppLogger();

// Service-specific loggers
export const telegramLogger = createAppLogger('telegram-bot');
export const webAppLogger = createAppLogger('web-app');
export const tradingLogger = createAppLogger('trading-engine');

// Enhanced logging functions with context
export class ContextLogger {
  private logger: Logger;
  private context: LogContext;

  constructor(logger: Logger, context: LogContext = {}) {
    this.logger = logger;
    this.context = context;
  }

  private log(level: LogLevel, message: string, meta: any = {}) {
    this.logger.log(level, message, { ...this.context, ...meta });
  }

  error(message: string, error?: Error | any, meta: any = {}) {
    const errorMeta = error instanceof Error 
      ? { error: error.message, stack: error.stack, ...meta }
      : { error, ...meta };
    
    this.log(LogLevel.ERROR, message, errorMeta);
  }

  warn(message: string, meta: any = {}) {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta: any = {}) {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta: any = {}) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  // Trading-specific logging methods
  tradeExecuted(orderId: string, symbol: string, side: string, amount: number, price: number, meta: any = {}) {
    this.info('Trade executed', {
      orderId,
      symbol,
      side,
      amount,
      price,
      type: 'trade_execution',
      ...meta
    });
  }

  orderPlaced(orderId: string, symbol: string, side: string, amount: number, type: string, meta: any = {}) {
    this.info('Order placed', {
      orderId,
      symbol,
      side,
      amount,
      orderType: type,
      type: 'order_placement',
      ...meta
    });
  }

  priceAlert(userId: string, symbol: string, targetPrice: number, currentPrice: number, meta: any = {}) {
    this.info('Price alert triggered', {
      userId,
      symbol,
      targetPrice,
      currentPrice,
      type: 'price_alert',
      ...meta
    });
  }

  userAction(userId: string, action: string, meta: any = {}) {
    this.info('User action', {
      userId,
      action,
      type: 'user_action',
      ...meta
    });
  }

  apiRequest(method: string, path: string, statusCode: number, responseTime: number, meta: any = {}) {
    this.info('API request', {
      method,
      path,
      statusCode,
      responseTime,
      type: 'api_request',
      ...meta
    });
  }

  blockchainTransaction(chain: string, txHash: string, status: string, meta: any = {}) {
    this.info('Blockchain transaction', {
      chain,
      txHash,
      status,
      type: 'blockchain_tx',
      ...meta
    });
  }

  // Create child logger with additional context
  child(additionalContext: LogContext): ContextLogger {
    return new ContextLogger(this.logger, { ...this.context, ...additionalContext });
  }
}

// Create context loggers for each service
export const createContextLogger = (context: LogContext = {}): ContextLogger => {
  return new ContextLogger(logger, context);
};

export const createTelegramLogger = (context: LogContext = {}): ContextLogger => {
  return new ContextLogger(telegramLogger, context);
};

export const createWebAppLogger = (context: LogContext = {}): ContextLogger => {
  return new ContextLogger(webAppLogger, context);
};

export const createTradingLogger = (context: LogContext = {}): ContextLogger => {
  return new ContextLogger(tradingLogger, context);
};

// Performance monitoring
export class PerformanceLogger {
  private logger: ContextLogger;
  private startTime: number;
  private operation: string;

  constructor(logger: ContextLogger, operation: string) {
    this.logger = logger;
    this.operation = operation;
    this.startTime = Date.now();
  }

  end(meta: any = {}) {
    const duration = Date.now() - this.startTime;
    this.logger.info(`Operation completed: ${this.operation}`, {
      operation: this.operation,
      duration,
      type: 'performance',
      ...meta
    });
    return duration;
  }

  static start(logger: ContextLogger, operation: string): PerformanceLogger {
    return new PerformanceLogger(logger, operation);
  }
}

// Request ID middleware helper
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Export default logger for backward compatibility
export default logger;
