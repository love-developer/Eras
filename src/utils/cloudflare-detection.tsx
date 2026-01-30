/**
 * Cloudflare Error Detection and Recovery Utility
 * 
 * Detects when Supabase is blocked by Cloudflare and provides
 * user-friendly error messages and recovery strategies.
 */

export interface CloudflareErrorResult {
  isCloudflareError: boolean;
  errorCode?: string;
  rayId?: string;
  timestamp?: string;
  userMessage: string;
  technicalMessage: string;
  shouldRetry: boolean;
  retryAfterMs: number;
}

/**
 * Detects if an error is from Cloudflare blocking the request
 */
export function detectCloudflareError(error: any): CloudflareErrorResult {
  const errorMessage = error?.message || error?.toString() || '';
  
  // Check if the error message contains Cloudflare HTML
  const isCloudflareHTML = errorMessage.includes('<!DOCTYPE html>') || 
                           errorMessage.includes('cloudflare.com') ||
                           errorMessage.includes('Cloudflare Ray ID');
  
  // Extract error details from HTML if present
  let errorCode: string | undefined;
  let rayId: string | undefined;
  let timestamp: string | undefined;
  
  if (isCloudflareHTML) {
    // Extract error code (e.g., "1105")
    const codeMatch = errorMessage.match(/error-code">(\d+)</);
    errorCode = codeMatch?.[1];
    
    // Extract Ray ID (e.g., "9a04efe40a9c22d2")
    const rayIdMatch = errorMessage.match(/Ray ID: <strong[^>]*>([a-f0-9]+)<\/strong>/);
    rayId = rayIdMatch?.[1];
    
    // Extract timestamp (e.g., "2025-11-18 05:06:11 UTC")
    const timestampMatch = errorMessage.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC)/);
    timestamp = timestampMatch?.[1];
  }
  
  // Determine user-friendly and technical messages
  let userMessage: string;
  let technicalMessage: string;
  let shouldRetry = true;
  let retryAfterMs = 3000; // Default 3 seconds
  
  if (isCloudflareHTML) {
    if (errorCode === '1105') {
      userMessage = 'Database temporarily unavailable. Retrying automatically...';
      technicalMessage = `Cloudflare Error 1105: Service temporarily unavailable${rayId ? ` (Ray ID: ${rayId})` : ''}`;
      retryAfterMs = 5000; // Wait 5 seconds for infrastructure issues
    } else if (errorCode === '502' || errorCode === '503' || errorCode === '504') {
      userMessage = 'Server is experiencing high load. Please wait...';
      technicalMessage = `Cloudflare Error ${errorCode}: Gateway error${rayId ? ` (Ray ID: ${rayId})` : ''}`;
      retryAfterMs = 8000; // Wait longer for server issues
    } else {
      userMessage = 'Connection interrupted. Reconnecting...';
      technicalMessage = `Cloudflare protection active${errorCode ? ` (Error ${errorCode})` : ''}${rayId ? ` (Ray ID: ${rayId})` : ''}`;
    }
  } else {
    // Not a Cloudflare error
    userMessage = error?.message || 'An error occurred';
    technicalMessage = errorMessage;
  }
  
  return {
    isCloudflareError: isCloudflareHTML,
    errorCode,
    rayId,
    timestamp,
    userMessage,
    technicalMessage,
    shouldRetry,
    retryAfterMs
  };
}

/**
 * Connection health status
 */
export interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'unavailable';
  message: string;
  lastError?: CloudflareErrorResult;
  consecutiveErrors: number;
}

/**
 * Tracks connection health over time
 */
export class ConnectionHealthMonitor {
  private consecutiveErrors = 0;
  private lastError?: CloudflareErrorResult;
  private lastSuccessTime = Date.now();
  
  recordSuccess() {
    this.consecutiveErrors = 0;
    this.lastError = undefined;
    this.lastSuccessTime = Date.now();
  }
  
  recordError(error: any): CloudflareErrorResult {
    const cfError = detectCloudflareError(error);
    
    if (cfError.isCloudflareError) {
      this.consecutiveErrors++;
      this.lastError = cfError;
    }
    
    return cfError;
  }
  
  getHealth(): ConnectionHealth {
    const timeSinceSuccess = Date.now() - this.lastSuccessTime;
    
    if (this.consecutiveErrors === 0) {
      return {
        status: 'healthy',
        message: 'Connected',
        consecutiveErrors: 0
      };
    }
    
    if (this.consecutiveErrors <= 2 && timeSinceSuccess < 30000) {
      return {
        status: 'degraded',
        message: 'Connection unstable',
        lastError: this.lastError,
        consecutiveErrors: this.consecutiveErrors
      };
    }
    
    return {
      status: 'unavailable',
      message: 'Database temporarily unavailable',
      lastError: this.lastError,
      consecutiveErrors: this.consecutiveErrors
    };
  }
  
  reset() {
    this.consecutiveErrors = 0;
    this.lastError = undefined;
    this.lastSuccessTime = Date.now();
  }
}

/**
 * Implements exponential backoff with jitter for retries
 */
export class RetryWithBackoff {
  private attempt = 0;
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  
  constructor(
    maxAttempts = 5,
    baseDelayMs = 1000,
    maxDelayMs = 30000
  ) {
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }
  
  async execute<T>(
    operation: () => Promise<T>,
    onError?: (error: CloudflareErrorResult, attempt: number) => void
  ): Promise<T> {
    while (this.attempt < this.maxAttempts) {
      try {
        const result = await operation();
        this.attempt = 0; // Reset on success
        return result;
      } catch (error) {
        this.attempt++;
        
        const cfError = detectCloudflareError(error);
        
        // If it's not a Cloudflare error or we've exhausted retries, throw immediately
        if (!cfError.isCloudflareError || this.attempt >= this.maxAttempts) {
          this.attempt = 0;
          throw error;
        }
        
        // Calculate exponential backoff with jitter
        const exponentialDelay = Math.min(
          this.baseDelayMs * Math.pow(2, this.attempt - 1),
          this.maxDelayMs
        );
        
        // Add random jitter (0-25% of delay)
        const jitter = Math.random() * exponentialDelay * 0.25;
        const delayMs = exponentialDelay + jitter;
        
        console.log(`🔄 Retry attempt ${this.attempt}/${this.maxAttempts} after ${Math.round(delayMs)}ms...`);
        console.log(`   Reason: ${cfError.userMessage}`);
        
        if (onError) {
          onError(cfError, this.attempt);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error('Max retry attempts exceeded');
  }
  
  reset() {
    this.attempt = 0;
  }
}

/**
 * Wraps a database operation with Cloudflare error detection and retry logic
 */
export async function withCloudflareRecovery<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    onError?: (error: CloudflareErrorResult, attempt: number) => void;
    onRecovery?: () => void;
  } = {}
): Promise<T> {
  const retry = new RetryWithBackoff(options.maxRetries || 3);
  
  try {
    const result = await retry.execute(operation, options.onError);
    
    if (options.onRecovery) {
      options.onRecovery();
    }
    
    return result;
  } catch (error) {
    const cfError = detectCloudflareError(error);
    
    if (cfError.isCloudflareError) {
      console.error('❌ Cloudflare error after all retries:', cfError.technicalMessage);
    }
    
    throw error;
  }
}
