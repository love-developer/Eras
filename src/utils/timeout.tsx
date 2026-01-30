/**
 * Timeout utility for handling long-running operations
 */

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Custom timeout error message
 * @returns Promise that rejects if timeout is reached
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Wraps a promise with retry logic and timeout
 * @param fn - Function that returns a promise
 * @param options - Configuration options
 * @returns Promise that retries on failure
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    timeout = 10000,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (timeout) {
        return await withTimeout(
          fn(),
          timeout,
          `Operation timed out after ${timeout}ms (attempt ${attempt + 1}/${maxRetries + 1})`
        );
      }
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
        
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Debounces an async function
 * @param fn - The async function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let resolveQueue: Array<(value: any) => void> = [];
  let rejectQueue: Array<(error: any) => void> = [];

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      resolveQueue.push(resolve);
      rejectQueue.push(reject);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        const currentResolveQueue = [...resolveQueue];
        const currentRejectQueue = [...rejectQueue];
        resolveQueue = [];
        rejectQueue = [];

        try {
          const result = await fn(...args);
          currentResolveQueue.forEach(res => res(result));
        } catch (error) {
          currentRejectQueue.forEach(rej => rej(error));
        }
      }, delay);
    });
  };
}

/**
 * Creates a cancellable promise
 * @param promise - The promise to make cancellable
 * @returns Object with promise and cancel function
 */
export function makeCancellable<T>(promise: Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
} {
  let isCancelled = false;

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise
      .then(value => {
        if (!isCancelled) {
          resolve(value);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          reject(error);
        }
      });
  });

  return {
    promise: wrappedPromise,
    cancel: () => {
      isCancelled = true;
    }
  };
}
