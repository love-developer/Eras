/**
 * Server-Side Cloudflare Error Detection & Recovery
 * 
 * Handles Cloudflare Error 1105 and other infrastructure errors in the backend.
 * Since kv_store.tsx is protected, we wrap all KV operations with this utility.
 */

export interface CloudflareErrorResult {
  isCloudflareError: boolean;
  errorCode?: string;
  rayId?: string;
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
  
  // 🔥 CRITICAL: Detect database connection exhaustion (PGRST000)
  // This indicates too many concurrent connections - NOT retryable
  const isConnectionExhaustion = errorMessage.includes('PGRST000') ||
                                  errorMessage.includes('connection slots are reserved') ||
                                  errorMessage.includes('Database connection error');
  
  if (isConnectionExhaustion) {
    return {
      isCloudflareError: false,
      errorCode: 'PGRST000',
      userMessage: 'Database temporarily busy',
      technicalMessage: 'Connection pool exhaustion (too many concurrent requests)',
      shouldRetry: false, // Don't retry - it makes the problem worse
      retryAfterMs: 0
    };
  }
  
  // Check if the error message contains Cloudflare HTML (including 500 errors)
  const isCloudflareHTML = errorMessage.includes('<!DOCTYPE html>') || 
                           errorMessage.includes('cloudflare.com') ||
                           errorMessage.includes('Cloudflare Ray ID') ||
                           errorMessage.includes('Temporarily unavailable') ||
                           errorMessage.includes('Internal server error') ||
                           errorMessage.includes('Error code 500') ||
                           errorMessage.includes('Error code 502') ||
                           errorMessage.includes('Error code 503') ||
                           errorMessage.includes('Error code 504');
  
  // Extract error details from HTML if present
  let errorCode: string | undefined;
  let rayId: string | undefined;
  
  if (isCloudflareHTML) {
    // Extract error code (e.g., "1105", "500", "502", "503", "504")
    const codeMatch = errorMessage.match(/error-code\">(\ d+)</) || 
                     errorMessage.match(/Error code (\d+)/);
    errorCode = codeMatch?.[1];
    
    // Extract Ray ID (e.g., "9a04efe40a9c22d2")
    const rayIdMatch = errorMessage.match(/Ray ID: <strong[^>]*>([a-f0-9]+)<\/strong>/);
    rayId = rayIdMatch?.[1];
  }
  
  // Check for common network/gateway errors
  const isNetworkError = errorMessage.includes('Network connection lost') ||
                        errorMessage.includes('gateway error') ||
                        errorMessage.includes('ECONNRESET') ||
                        errorMessage.includes('ETIMEDOUT') ||
                        errorMessage.includes('fetch failed') ||
                        errorMessage.includes('Connection error') ||
                        errorMessage.includes('connection reset') ||
                        errorMessage.includes('connection error') ||
                        errorMessage.includes('SendRequest') ||
                        errorMessage.includes('client error') ||
                        errorMessage.includes('http2 error') ||
                        errorMessage.includes('not a result of an error') ||
                        errorMessage.includes('error sending request') ||
                        errorMessage.includes('Unable to reach database');
  
  // Determine user-friendly and technical messages
  let userMessage: string;
  let technicalMessage: string;
  let shouldRetry = true;
  let retryAfterMs = 3000; // Default 3 seconds
  
  if (isCloudflareHTML) {
    if (errorCode === '1105') {
      userMessage = 'Database temporarily unavailable. Retrying automatically...';
      technicalMessage = `Cloudflare Error 1105: Service temporarily unavailable${rayId ? ` (Ray ID: ${rayId})` : ''}`;
      retryAfterMs = 2000; // Faster retry for transient issues
    } else if (errorCode === '500') {
      userMessage = 'Server temporarily down. Retrying...';
      technicalMessage = `Cloudflare Error 500: Internal server error${rayId ? ` (Ray ID: ${rayId})` : ''}`;
      retryAfterMs = 5000; // Wait longer for server recovery
      shouldRetry = true; // Definitely retry 500 errors
    } else if (errorCode === '502' || errorCode === '503' || errorCode === '504') {
      userMessage = 'Server is experiencing high load. Please wait...';
      technicalMessage = `Cloudflare Error ${errorCode}: Gateway error${rayId ? ` (Ray ID: ${rayId})` : ''}`;
      retryAfterMs = 5000; // Wait longer for server issues
    } else {
      userMessage = 'Connection interrupted. Reconnecting...';
      technicalMessage = `Cloudflare protection active${errorCode ? ` (Error ${errorCode})` : ''}${rayId ? ` (Ray ID: ${rayId})` : ''}`;
    }
  } else if (isNetworkError) {
    userMessage = 'Network connection lost. Retrying...';
    technicalMessage = errorMessage;
    shouldRetry = true;
    retryAfterMs = 2000;
  } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    userMessage = 'Database query timed out';
    technicalMessage = errorMessage;
    shouldRetry = true;
    retryAfterMs = 3000;
  } else if (errorMessage.includes('undefined') && errorMessage.includes('Code: unknown')) {
    // Handle the specific "Database error: undefined (Code: unknown)" case
    userMessage = 'Database temporarily unavailable';
    technicalMessage = 'Database connection issue - undefined error response';
    shouldRetry = true;
    retryAfterMs = 2000;
  } else if (errorMessage.includes('PGRST002') || errorMessage.includes('schema cache')) {
    // ✅ Handle PostgREST schema cache errors (transient Supabase database issues)
    userMessage = 'Database schema cache updating. Retrying...';
    technicalMessage = 'PostgREST PGRST002: Schema cache refresh in progress';
    shouldRetry = true;
    retryAfterMs = 2000; // Short retry - schema cache updates are usually quick
  } else if (errorMessage.includes('PGRST') || errorMessage.includes('PostgREST')) {
    // ✅ Handle other PostgREST errors as potentially retryable
    userMessage = 'Database API temporarily unavailable';
    technicalMessage = errorMessage;
    shouldRetry = true;
    retryAfterMs = 3000;
  } else {
    // Not a Cloudflare error
    userMessage = error?.message || 'An error occurred';
    technicalMessage = errorMessage;
    shouldRetry = false; // Don't retry unknown errors
  }
  
  return {
    isCloudflareError: isCloudflareHTML || isNetworkError,
    errorCode,
    rayId,
    userMessage,
    technicalMessage,
    shouldRetry,
    retryAfterMs
  };
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
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 15000
  ) {
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }
  
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    while (this.attempt < this.maxAttempts) {
      try {
        const result = await operation();
        if (this.attempt > 0) {
          console.log(`✅ ${operationName} succeeded after ${this.attempt} retries`);
        }
        this.attempt = 0; // Reset on success
        return result;
      } catch (error) {
        this.attempt++;
        
        const cfError = detectCloudflareError(error);
        
        // If it's not retryable or we've exhausted retries, throw immediately
        if (!cfError.shouldRetry || this.attempt >= this.maxAttempts) {
          if (cfError.isCloudflareError) {
            // Only log on final failure if it's not a lock operation (locks fail gracefully)
            if (!operationName.includes('lock')) {
              console.warn(`⚠️ ${operationName} failed after ${this.attempt} attempts (Cloudflare outage): ${cfError.technicalMessage}`);
            }
          }
          this.attempt = 0;
          throw error;
        }
        
        // Calculate exponential backoff with jitter
        let delayMs = Math.min(
          this.baseDelayMs * Math.pow(2, this.attempt - 1),
          this.maxDelayMs
        );
        
        // Use the suggested retry delay from the error if available and larger
        if (cfError.retryAfterMs > delayMs) {
          delayMs = cfError.retryAfterMs;
        }
        
        // Add random jitter (0-25% of delay)
        const jitter = Math.random() * delayMs * 0.25;
        delayMs += jitter;
        
        // Only log retries for non-lock operations to reduce noise
        if (!operationName.includes('lock') && this.attempt === 1) {
          console.log(`🔄 ${operationName} experiencing temporary Cloudflare issues, retrying...`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error(`${operationName} failed after ${this.maxAttempts} attempts`);
  }
  
  reset() {
    this.attempt = 0;
  }
}

/**
 * Wraps a KV operation with Cloudflare error detection and retry logic
 */
export async function withCloudflareRecovery<T>(
  operation: () => Promise<T>,
  operationName: string = 'KV operation',
  options: {
    maxRetries?: number;
    fallbackValue?: T;
    quiet?: boolean;
  } = {}
): Promise<T> {
  const retry = new RetryWithBackoff(options.maxRetries || 3);
  
  try {
    return await retry.execute(operation, operationName);
  } catch (error) {
    const cfError = detectCloudflareError(error);
    
    // Only log errors if not in quiet mode
    if (cfError.isCloudflareError && !options.quiet) {
      console.error(`❌ ${operationName} failed with Cloudflare error: ${cfError.technicalMessage}`);
    }
    
    // If a fallback value is provided, return it instead of throwing
    if (options.fallbackValue !== undefined) {
      if (!options.quiet) {
        console.log(`⚠️ ${operationName} returning fallback value due to error`);
      }
      return options.fallbackValue;
    }
    
    throw error;
  }
}

/**
 * Wraps a KV get operation with recovery and fallback
 */
export async function safeKvGet<T>(
  kvGetFunc: () => Promise<T>,
  key: string,
  fallbackValue: T = null as T,
  options: { quiet?: boolean; maxRetries?: number } = {}
): Promise<T> {
  try {
    // Wrap the KV function to intercept and sanitize errors
    const sanitizedKvFunc = async () => {
      try {
        return await kvGetFunc();
      } catch (rawError: any) {
        // Sanitize Cloudflare HTML errors AND HTTP/2 errors to prevent console spam
        const errorMsg = rawError?.message || String(rawError);
        const errorDetails = rawError?.details || '';
        const fullErrorText = `${errorMsg} ${errorDetails}`.toLowerCase();
        
        // Detect HTTP/2 connection errors (these are transient infrastructure issues)
        const isHttp2Error = fullErrorText.includes('http2 error') ||
                            fullErrorText.includes('error sending request') ||
                            fullErrorText.includes('client error (sendrequest)') ||
                            fullErrorText.includes('connection error received') ||
                            fullErrorText.includes('not a result of an error');
        
        if (errorMsg.includes('<!DOCTYPE html>') || errorMsg.length > 1000 || isHttp2Error) {
          const cfError = detectCloudflareError(rawError);
          // Create a clean error with just the essential info
          const cleanError = new Error(isHttp2Error ? 'HTTP/2 connection error (transient)' : cfError.technicalMessage);
          (cleanError as any).original = 'HTML_ERROR_SUPPRESSED';
          (cleanError as any).isCloudflare = true;
          (cleanError as any).isHttp2 = isHttp2Error;
          (cleanError as any).rayId = cfError.rayId;
          (cleanError as any).errorCode = cfError.errorCode;
          throw cleanError;
        }
        throw rawError;
      }
    };
    
    return await withCloudflareRecovery(
      sanitizedKvFunc,
      `KV get \"${key}\"`,
      { maxRetries: options.maxRetries ?? 2, fallbackValue, quiet: options.quiet }
    );
  } catch (error: any) {
    // Log the error only if not in quiet mode AND not an HTTP/2 error
    if (!options.quiet && !(error as any).isHttp2) {
      const errorMsg = error?.message || String(error);
      // Check if this is a network/database error or timeout
      const isNetworkError = 
        errorMsg.includes('Network connection lost') ||
        errorMsg.includes('gateway error') ||
        errorMsg.includes('undefined') ||
        errorMsg.includes('Database error') ||
        errorMsg.includes('Query timeout') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('timed out') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('500') ||
        errorMsg.includes('502') ||
        errorMsg.includes('503') ||
        errorMsg.includes('504') ||
        errorMsg.includes('PGRST') || // ✅ Treat PostgREST errors as network errors
        errorMsg.includes('schema cache') || // ✅ Treat schema cache errors as network errors
        errorMsg.includes('HTTP/2 connection error');
      
      if (isNetworkError) {
        console.warn(`⚠️ Network/database/timeout error for \"${key}\": ${errorMsg.substring(0, 100)}`);
      } else {
        console.error(`💥 KV Store: Exception for key \"${key}\":`, error);
      }
    }
    
    // Always return fallback value instead of throwing
    return fallbackValue;
  }
}

/**
 * Wraps a KV getByPrefix operation with recovery and fallback
 */
export async function safeKvGetByPrefix<T>(
  kvGetFunc: () => Promise<T[]>,
  prefix: string,
  fallbackValue: T[] = []
): Promise<T[]> {
  // Sanitize HTML errors for prefix queries too
  const sanitizedKvFunc = async () => {
    try {
      return await kvGetFunc();
    } catch (rawError: any) {
      const errorMsg = rawError?.message || String(rawError);
      if (errorMsg.includes('<!DOCTYPE html>') || errorMsg.length > 1000) {
        const cfError = detectCloudflareError(rawError);
        const cleanError = new Error(cfError.technicalMessage);
        (cleanError as any).original = 'HTML_ERROR_SUPPRESSED';
        (cleanError as any).isCloudflare = true;
        throw cleanError;
      }
      throw rawError;
    }
  };

  return await withCloudflareRecovery(
    sanitizedKvFunc,
    `KV getByPrefix "${prefix}"`,
    { maxRetries: 2, fallbackValue } // Fewer retries for prefix queries
  );
}

/**
 * Wraps a KV set operation with recovery (no fallback, must succeed or throw)
 */
export async function safeKvSet(
  kvSetFunc: () => Promise<void>,
  key: string,
  options: { quiet?: boolean; maxRetries?: number } = {}
): Promise<void> {
  // Wrap the KV function to intercept and sanitize errors
  const sanitizedKvFunc = async () => {
    try {
      return await kvSetFunc();
    } catch (rawError: any) {
      // Sanitize Cloudflare HTML errors to prevent console spam
      const errorMsg = rawError?.message || String(rawError) || 'Unknown error';
      
      // Handle cases where error.message is undefined or empty
      if (!errorMsg || errorMsg === 'undefined' || errorMsg.trim() === '') {
        const enhancedError = new Error(`Database operation failed for key "${key}" (no error message provided)`);
        (enhancedError as any).original = rawError;
        (enhancedError as any).key = key;
        throw enhancedError;
      }
      
      if (errorMsg.includes('<!DOCTYPE html>') || errorMsg.length > 1000) {
        const cfError = detectCloudflareError(rawError);
        const cleanError = new Error(cfError.technicalMessage);
        (cleanError as any).original = 'HTML_ERROR_SUPPRESSED';
        (cleanError as any).isCloudflare = true;
        (cleanError as any).rayId = cfError.rayId;
        (cleanError as any).errorCode = cfError.errorCode;
        throw cleanError;
      }
      throw rawError;
    }
  };

  return await withCloudflareRecovery(
    sanitizedKvFunc,
    `KV set "${key}"`,
    { maxRetries: options.maxRetries ?? 3 }
  );
}

/**
 * Wraps a KV del operation with recovery
 */
export async function safeKvDel(
  kvDelFunc: () => Promise<void>,
  key: string,
  options: { quiet?: boolean; maxRetries?: number } = {}
): Promise<void> {
  // Wrap the KV function to intercept and sanitize errors
  const sanitizedKvFunc = async () => {
    try {
      return await kvDelFunc();
    } catch (rawError: any) {
      // Sanitize Cloudflare HTML errors to prevent console spam
      const errorMsg = rawError?.message || String(rawError) || 'Unknown error';
      
      // Handle cases where error.message is undefined or empty
      if (!errorMsg || errorMsg === 'undefined' || errorMsg.trim() === '') {
        const enhancedError = new Error(`Database delete operation failed for key "${key}" (no error message provided)`);
        (enhancedError as any).original = rawError;
        (enhancedError as any).key = key;
        throw enhancedError;
      }
      
      if (errorMsg.includes('<!DOCTYPE html>') || errorMsg.length > 1000) {
        const cfError = detectCloudflareError(rawError);
        const cleanError = new Error(cfError.technicalMessage);
        (cleanError as any).original = 'HTML_ERROR_SUPPRESSED';
        (cleanError as any).isCloudflare = true;
        (cleanError as any).rayId = cfError.rayId;
        (cleanError as any).errorCode = cfError.errorCode;
        throw cleanError;
      }
      throw rawError;
    }
  };

  return await withCloudflareRecovery(
    sanitizedKvFunc,
    `KV del "${key}"`,
    { maxRetries: options.maxRetries ?? 2 }
  );
}

/**
 * Wraps a KV mset operation with recovery
 */
export async function safeKvMset(
  kvMsetFunc: () => Promise<void>,
  description: string = 'multiple keys',
  options: { quiet?: boolean; maxRetries?: number } = {}
): Promise<void> {
  // Wrap the KV function to intercept and sanitize errors
  const sanitizedKvFunc = async () => {
    try {
      return await kvMsetFunc();
    } catch (rawError: any) {
      // Sanitize Cloudflare HTML errors to prevent console spam
      const errorMsg = rawError?.message || String(rawError);
      if (errorMsg.includes('<!DOCTYPE html>') || errorMsg.length > 1000) {
        const cfError = detectCloudflareError(rawError);
        const cleanError = new Error(cfError.technicalMessage);
        (cleanError as any).original = 'HTML_ERROR_SUPPRESSED';
        (cleanError as any).isCloudflare = true;
        throw cleanError;
      }
      throw rawError;
    }
  };

  return await withCloudflareRecovery(
    sanitizedKvFunc,
    `KV mset ${description}`,
    { maxRetries: options.maxRetries ?? 3 }
  );
}