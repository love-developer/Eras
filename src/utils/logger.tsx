// Production Logging Utility for Eras
// Provides log levels and conditional logging based on environment

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableEmojis: boolean;
  scrubSensitiveData: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Sensitive data patterns to scrub from logs
const SENSITIVE_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  { pattern: /Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi, replacement: 'Bearer [TOKEN_REDACTED]' },
  { pattern: /eyJ[A-Za-z0-9_-]{10,}/g, replacement: '[JWT_REDACTED]' },
  { pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, replacement: '[UUID_REDACTED]' },
  { pattern: /(password|pwd|token|secret|key)["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: '$1: [REDACTED]' },
];

class Logger {
  private config: LogConfig;

  constructor() {
    // Default to 'info' in production, 'debug' in development
    const isDev = typeof window !== 'undefined' 
      ? window.location.hostname === 'localhost' 
      : Deno?.env?.get('DENO_ENV') !== 'production';
    
    this.config = {
      level: isDev ? 'debug' : 'info',
      enableTimestamps: true,
      enableEmojis: isDev, // Emojis only in dev
      scrubSensitiveData: !isDev, // Scrub in production only
    };
  }

  setLevel(level: LogLevel) {
    this.config.level = level;
  }

  setConfig(config: Partial<LogConfig>) {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private scrubSensitiveData(data: any): any {
    if (!this.config.scrubSensitiveData) {
      return data;
    }

    // Handle different data types
    if (typeof data === 'string') {
      let scrubbed = data;
      for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
        scrubbed = scrubbed.replace(pattern, replacement);
      }
      return scrubbed;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.scrubSensitiveData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const scrubbed: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Scrub sensitive keys entirely
        if (/password|token|secret|key|auth|credential/i.test(key)) {
          scrubbed[key] = '[REDACTED]';
        } else {
          scrubbed[key] = this.scrubSensitiveData(value);
        }
      }
      return scrubbed;
    }

    return data;
  }

  private formatMessage(emoji: string, level: string, ...args: any[]): any[] {
    const prefix = this.config.enableEmojis ? `${emoji} [${level.toUpperCase()}]` : `[${level.toUpperCase()}]`;
    const timestamp = this.config.enableTimestamps ? `[${new Date().toISOString()}]` : '';
    
    // Scrub sensitive data from all arguments
    const scrubbedArgs = args.map(arg => this.scrubSensitiveData(arg));
    
    if (timestamp) {
      return [timestamp, prefix, ...scrubbedArgs];
    }
    return [prefix, ...scrubbedArgs];
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('🔍', 'debug', ...args));
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(...this.formatMessage('ℹ️', 'info', ...args));
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('⚠️', 'warn', ...args));
    }
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('❌', 'error', ...args));
    }
  }

  // Specialized logging methods with contextual prefixes
  auth(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('🔐', 'auth', ...args));
    }
  }

  achievement(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('🏆', 'achievement', ...args));
    }
  }

  capsule(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('📦', 'capsule', ...args));
    }
  }

  echo(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('💫', 'echo', ...args));
    }
  }

  media(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('🎬', 'media', ...args));
    }
  }

  delivery(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('📨', 'delivery', ...args));
    }
  }

  performance(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('⚡', 'performance', ...args));
    }
  }

  database(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('💾', 'database', ...args));
    }
  }

  // Production-safe method for logging user actions (no sensitive data)
  userAction(action: string, metadata?: Record<string, any>) {
    if (this.shouldLog('info')) {
      console.log(...this.formatMessage('👤', 'user-action', action, metadata ? this.scrubSensitiveData(metadata) : ''));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// For backward compatibility, export individual functions
export const log = {
  debug: (...args: any[]) => logger.debug(...args),
  info: (...args: any[]) => logger.info(...args),
  warn: (...args: any[]) => logger.warn(...args),
  error: (...args: any[]) => logger.error(...args),
  auth: (...args: any[]) => logger.auth(...args),
  achievement: (...args: any[]) => logger.achievement(...args),
  capsule: (...args: any[]) => logger.capsule(...args),
  echo: (...args: any[]) => logger.echo(...args),
  media: (...args: any[]) => logger.media(...args),
  delivery: (...args: any[]) => logger.delivery(...args),
  performance: (...args: any[]) => logger.performance(...args),
  database: (...args: any[]) => logger.database(...args),
  userAction: (action: string, metadata?: Record<string, any>) => logger.userAction(action, metadata),
};