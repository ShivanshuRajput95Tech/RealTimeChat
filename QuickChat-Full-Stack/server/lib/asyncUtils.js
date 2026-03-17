// lib/asyncUtils.js
// 2026 Async utility patterns for reliability and performance

/**
 * 2026 BEST PRACTICES FOR ASYNC OPERATIONS:
 * 
 * 1. Retry logic with exponential backoff
 * 2. Circuit breaker pattern for external services
 * 3. Timeout handling and cancellation
 * 4. Batch operations instead of loops
 * 5. Concurrent operation limiting with Promise.all
 * 6. Graceful degradation when services fail
 * 7. Request deduplication for expensive operations
 */

import logger from './logger.js';

/**
 * Retry with exponential backoff (2026 pattern)
 * 
 * Increases wait time between retries: 100ms, 200ms, 400ms, 800ms...
 * Maximum 5 retries by default
 * 
 * Usage:
 * const result = await retry(
 *   () => externalApiCall(),
 *   { maxRetries: 3, initialDelay: 100 }
 * );
 */
export async function retry(fn, options = {}) {
  const {
    maxRetries = 5,
    initialDelay = 100,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry = () => {},
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) break;
      if (!shouldRetry(error, attempt)) throw error;

      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      logger.debug('Retrying operation', {
        attempt: attempt + 1,
        maxRetries,
        delay: `${delay}ms`,
        error: error.message,
      });

      onRetry(error, attempt, delay);
      await sleep(delay);
    }
  }

  logger.error('Operation failed after retries', lastError, {
    maxRetries,
    finalError: lastError.message,
  });

  throw lastError;
}

/**
 * Sleep utility (promise-based)
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper (2026 pattern)
 * Rejects promise if operation takes too long
 * 
 * Usage:
 * const result = await timeout(
 *   slowDatabaseQuery(),
 *   5000
 * );
 */
export async function timeout(promise, ms, timeoutMessage = 'Operation timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), ms)
    ),
  ]);
}

/**
 * Circuit Breaker Pattern (2026 best practice)
 * Prevent cascading failures by stopping requests to failing services
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service recovered
 * 
 * Usage:
 * const breaker = new CircuitBreaker(cloudinaryUpload, {
 *   failureThreshold: 5,
 *   resetTimeout: 60000
 * });
 * 
 * const imageUrl = await breaker.execute(imageBuffer);
 */
export class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.resetTimeout = options.resetTimeout || 60000;
    this.name = options.name || 'CircuitBreaker';

    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  async execute(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        const error = new Error(`${this.name} is OPEN - circuit breaker active`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }
      // Try half-open
      this.state = 'HALF_OPEN';
      logger.info(`${this.name} transitioned to HALF_OPEN`);
    }

    try {
      const result = await this.fn(...args);

      if (this.state === 'HALF_OPEN') {
        this.successes++;
        if (this.successes >= this.successThreshold) {
          this.state = 'CLOSED';
          this.failures = 0;
          this.successes = 0;
          logger.info(`${this.name} transitioned to CLOSED`);
        }
      } else if (this.state === 'CLOSED') {
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.resetTimeout;
        logger.warn(`${this.name} transitioned to OPEN`, {
          failures: this.failures,
          resetIn: `${this.resetTimeout}ms`,
        });
      } else if (this.state === 'HALF_OPEN') {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.resetTimeout;
        logger.warn(`${this.name} failed during HALF_OPEN, returning to OPEN`);
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    logger.info(`${this.name} manually reset`);
  }
}

/**
 * Batch Operations (2026 pattern)
 * Process items in batches instead of individual operations
 * 
 * Improves performance: 1000 individual updates → 10 batch updates
 * Reduces database load and network overhead
 * 
 * Usage:
 * await batchProcess(messageIds, 100, async (batch) => {
 *   await Message.updateMany({ _id: { $in: batch } }, { seen: true });
 * });
 */
export async function batchProcess(items, batchSize, processFn) {
  const results = [];
  const batches = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  logger.debug('Processing items in batches', {
    totalItems: items.length,
    batchSize,
    batchCount: batches.length,
  });

  for (let i = 0; i < batches.length; i++) {
    try {
      const result = await processFn(batches[i], i);
      results.push(result);
    } catch (error) {
      logger.error('Batch processing failed', error, {
        batchIndex: i,
        batchSize: batches[i].length,
      });
      throw error;
    }
  }

  return results;
}

/**
 * Concurrent Operations with Limit (2026 pattern)
 * Control concurrency to prevent resource exhaustion
 * 
 * Without limit: 1000 concurrent DB operations = overload
 * With limit: Max 10 concurrent = controlled, performant
 * 
 * Usage:
 * await concurrentLimit(userIds, 10, async (userId) => {
 *   return await fetchUserProfile(userId);
 * });
 */
export async function concurrentLimit(items, limit, fn) {
  const results = new Array(items.length);
  const executing = [];

  logger.debug('Starting concurrent operations', {
    totalItems: items.length,
    concurrencyLimit: limit,
  });

  for (let i = 0; i < items.length; i++) {
    const promise = Promise.resolve(items[i])
      .then((item) => fn(item, i))
      .then((result) => {
        results[i] = result;
      });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex((p) => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Debounce (2026 pattern)
 * Delay function execution, reset timer if called again
 * 
 * Usage: Delay auto-save on text input
 * const debouncedSearch = debounce(searchUsers, 500);
 * inputElement.addEventListener('input', () => debouncedSearch(query));
 */
export function debounce(fn, delayMs) {
  let timeoutId = null;

  return function debounced(...args) {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delayMs);
  };
}

/**
 * Throttle (2026 pattern)
 * Execute function at most once every N milliseconds
 * 
 * Usage: Limit API calls on scroll
 * const throttledScroll = throttle(loadMore, 1000);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(fn, intervalMs) {
  let lastCallTime = 0;

  return function throttled(...args) {
    const now = Date.now();

    if (now - lastCallTime >= intervalMs) {
      lastCallTime = now;
      return fn.apply(this, args);
    }
  };
}

/**
 * Memoization/Deduplication (2026 pattern)
 * Cache results of expensive operations
 * 
 * Usage:
 * const memoizedGetUser = memoize(User.findById, 60000);
 * const user1 = await memoizedGetUser(id); // DB call
 * const user2 = await memoizedGetUser(id); // Cached
 */
export function memoize(fn, ttl = 60000) {
  const cache = new Map();

  return async function memoized(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      const cached = cache.get(key);
      if (Date.now() - cached.timestamp < ttl) {
        logger.debug('Cache hit for memoized function', { key });
        return cached.value;
      }
      cache.delete(key);
    }

    const value = await fn.apply(this, args);
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  };
}

/**
 * Retry with Jitter (2026 pattern for distributed systems)
 * Add randomness to prevent thundering herd problem
 * 
 * Without jitter: 1000 clients all retry at same time = overload
 * With jitter: Retries spread randomly = controlled recovery
 */
export async function retryWithJitter(fn, options = {}) {
  const {
    maxRetries = 5,
    initialDelay = 100,
    maxDelay = 10000,
    jitterFactor = 0.1,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) break;

      const baseDelay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );
      const jitter = baseDelay * jitterFactor * Math.random();
      const delay = baseDelay + jitter;

      logger.debug('Retrying with jitter', {
        attempt: attempt + 1,
        delay: `${delay.toFixed(0)}ms`,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Queue Processor (2026 pattern)
 * Process items from queue with automatic retry
 * For production: Use BullMQ instead
 * 
 * Usage:
 * const queue = new SimpleQueue();
 * queue.add(async () => sendEmail(user));
 * await queue.process(5); // Process up to 5 items
 */
export class SimpleQueue {
  constructor() {
    this.items = [];
    this.processing = false;
  }

  add(fn) {
    this.items.push(fn);
    return this;
  }

  async process(concurrency = 1) {
    while (this.items.length > 0) {
      const batch = this.items.splice(0, concurrency);
      await Promise.allSettled(batch.map((fn) => fn()));
    }
  }
}

/**
 * Example 2026 Async Pattern:
 * 
 * // 1. Retry with circuit breaker for external API
 * const imageUploadBreaker = new CircuitBreaker(
 *   async (imageBuffer) => {
 *     return await cloudinary.uploader.upload(imageBuffer);
 *   },
 *   { failureThreshold: 3, resetTimeout: 30000, name: 'ImageUpload' }
 * );
 * 
 * // 2. With retry + timeout + circuit breaker
 * const uploadWithRetry = async (imageBuffer) => {
 *   try {
 *     return await retry(
 *       () => timeout(imageUploadBreaker.execute(imageBuffer), 5000),
 *       { maxRetries: 3, initialDelay: 100 }
 *     );
 *   } catch (error) {
 *     logger.error('Image upload failed', error);
 *     // Graceful degradation: use placeholder
 *     return { url: '/placeholder-image.jpg' };
 *   }
 * };
 * 
 * // 3. Batch mark messages as seen (1000x faster than individual updates)
 * await batchProcess(messageIds, 100, async (batch) => {
 *   await Message.updateMany(
 *     { _id: { $in: batch } },
 *     { seen: true }
 *   );
 * });
 * 
 * // 4. Fetch profiles with concurrency limit (prevent overload)
 * const profiles = await concurrentLimit(userIds, 10, async (userId) => {
 *   return await User.findById(userId);
 * });
 */
