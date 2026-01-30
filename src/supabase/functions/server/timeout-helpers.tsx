/**
 * TIMEOUT PROTECTION HELPERS
 * 
 * Utilities to prevent KV and database operations from hanging indefinitely
 */

/**
 * Wraps a KV operation with timeout protection
 * @param operation - The KV operation to execute
 * @param timeoutMs - Timeout in milliseconds (default: 30 seconds - increased for stability)
 * @param operationName - Name for logging purposes
 * @returns The result of the operation or null on timeout
 */
export async function withKVTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = 30000,
  operationName: string = 'KV operation'
): Promise<T | null> {
  try {
    const result = await Promise.race([
      operation,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
    return result;
  } catch (error) {
    // Silently handle database errors - don't spam logs with Cloudflare 500s
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Only log if it's a timeout (not a database error)
    if (errorMessage.includes('timed out')) {
      console.warn(`⏱️ ${operationName} timeout after ${timeoutMs}ms`);
    } else if (errorMessage.includes('500 Internal Server Error')) {
      // Cloudflare/database error - just note it quietly
      console.warn(`⚠️ ${operationName}: Database temporarily unavailable`);
    } else {
      // Other errors - log them
      console.error(`❌ ${operationName} error:`, errorMessage.substring(0, 200));
    }
    
    return null;
  }
}

/**
 * Processes items in batches to avoid long-running operations
 * @param items - Array of items to process
 * @param batchSize - Number of items per batch
 * @param processor - Async function to process each batch
 */
export async function processBatched<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Runs an operation with a maximum execution time
 * Returns a fallback value if timeout is reached
 */
export async function withFallback<T>(
  operation: Promise<T>,
  fallbackValue: T,
  timeoutMs: number = 10000
): Promise<T> {
  try {
    return await Promise.race([
      operation,
      new Promise<T>((resolve) => 
        setTimeout(() => resolve(fallbackValue), timeoutMs)
      )
    ]);
  } catch (error) {
    console.error('Operation failed, using fallback:', error);
    return fallbackValue;
  }
}

/**
 * Retries an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a retryable error (500, timeout, network issues)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable = errorMessage.includes('500') || 
                         errorMessage.includes('timeout') || 
                         errorMessage.includes('network') ||
                         errorMessage.includes('Database error');
      
      if (attempt < maxRetries - 1 && isRetryable) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (!isRetryable) {
        // Don't retry non-retryable errors
        throw lastError;
      }
    }
  }
  
  throw lastError!;
}

/**
 * Wraps a KV get operation with both timeout and retry logic
 * Specifically for handling transient database errors like Cloudflare 500s
 */
export async function withKVTimeoutAndRetry<T>(
  kvGetOperation: () => Promise<T>,
  timeoutMs: number = 2000,
  operationName: string = 'KV operation',
  maxRetries: number = 2
): Promise<T | null> {
  try {
    // Wrap with retry logic for transient errors
    const result = await withRetry(
      async () => {
        // Wrap each retry attempt with timeout
        return await withKVTimeout(
          kvGetOperation(),
          timeoutMs,
          operationName
        );
      },
      maxRetries,
      300 // Short delay between retries (300ms, 600ms)
    );
    
    return result;
  } catch (error) {
    // All retries exhausted - return null gracefully
    console.warn(`⚠️ ${operationName}: All retries exhausted, returning null`);
    return null;
  }
}