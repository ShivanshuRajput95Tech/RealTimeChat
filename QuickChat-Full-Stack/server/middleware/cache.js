import redis from "../lib/redis.js";
import logger from "../lib/logger.js";

// Cache middleware for API responses
export const cacheMiddleware = (options = {}) => {
    const {
        ttl = 300, // 5 minutes default
        keyGenerator = null,
        condition = null,
        invalidateOn = [],
    } = options;

    return async (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== "GET") {
            return next();
        }

        // Check condition function
        if (condition && !condition(req)) {
            return next();
        }

        // Generate cache key
        const cacheKey = keyGenerator 
            ? keyGenerator(req)
            : generateDefaultCacheKey(req);

        try {
            // Try to get cached response
            const cachedData = await redis.get(cacheKey);
            
            if (cachedData) {
                logger.debug(`Cache hit: ${cacheKey}`);
                const parsed = JSON.parse(cachedData);
                
                // Set cache headers
                res.set("X-Cache", "HIT");
                res.set("X-Cache-Key", cacheKey);
                res.set("Cache-Control", `public, max-age=${ttl}`);
                
                return res.status(parsed.status || 200).json(parsed.data);
            }

            // Cache miss - continue to route handler
            logger.debug(`Cache miss: ${cacheKey}`);
            res.set("X-Cache", "MISS");
            res.set("X-Cache-Key", cacheKey);

            // Override res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = async (data) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const cacheData = {
                        status: res.statusCode,
                        data: data,
                        timestamp: new Date().toISOString(),
                    };
                    
                    await redis.set(cacheKey, JSON.stringify(cacheData), ttl);
                    logger.debug(`Cached: ${cacheKey} for ${ttl}s`);
                }

                // Set cache headers
                res.set("Cache-Control", `public, max-age=${ttl}`);
                
                return originalJson(data);
            };

            next();
        } catch (error) {
            logger.error(`Cache middleware error: ${error.message}`);
            // Don't fail the request if cache fails
            next();
        }
    };
};

// Generate default cache key from request
const generateDefaultCacheKey = (req) => {
    const { originalUrl, user } = req;
    const userId = user?._id || "anonymous";
    return `api:${userId}:${originalUrl}`;
};

// Cache invalidation middleware
export const cacheInvalidationMiddleware = (patterns = []) => {
    return async (req, res, next) => {
        // Store original end function
        const originalEnd = res.end.bind(res);
        
        // Override end to invalidate cache after successful response
        res.end = async (...args) => {
            try {
                // Only invalidate on successful mutations
                if (req.method !== "GET" && res.statusCode >= 200 && res.statusCode < 300) {
                    await Promise.all(
                        patterns.map(async (pattern) => {
                            const resolvedPattern = typeof pattern === "function" 
                                ? pattern(req) 
                                : pattern;
                            
                            if (resolvedPattern) {
                                const deleted = await redis.delPattern(resolvedPattern);
                                logger.debug(`Invalidated ${deleted} cache entries for pattern: ${resolvedPattern}`);
                            }
                        })
                    );
                }
            } catch (error) {
                logger.error(`Cache invalidation error: ${error.message}`);
            }
            
            return originalEnd(...args);
        };
        
        next();
    };
};

// Specific cache strategies for different endpoints
export const userCacheStrategy = cacheMiddleware({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => {
        const userId = req.user?._id || req.params.userId || "anonymous";
        return `user:${userId}:profile`;
    },
});

export const messagesCacheStrategy = cacheMiddleware({
    ttl: 60, // 1 minute for messages
    keyGenerator: (req) => {
        const userId = req.user?._id;
        const otherUserId = req.params.id || req.params.userId;
        return `messages:${userId}:${otherUserId}:${req.query.before || "all"}:${req.query.limit || 50}`;
    },
});

export const usersListCacheStrategy = cacheMiddleware({
    ttl: 300, // 5 minutes
    keyGenerator: (req) => {
        const userId = req.user?._id;
        return `users:sidebar:${userId}`;
    },
});

// Cache warming utility
export const warmCache = async (endpoints) => {
    logger.info("Starting cache warming...");
    
    for (const endpoint of endpoints) {
        try {
            // Implementation would depend on your specific needs
            logger.debug(`Warming cache for: ${endpoint}`);
        } catch (error) {
            logger.error(`Cache warming error for ${endpoint}:`, error.message);
        }
    }
    
    logger.info("Cache warming completed");
};

export default {
    cacheMiddleware,
    cacheInvalidationMiddleware,
    userCacheStrategy,
    messagesCacheStrategy,
    usersListCacheStrategy,
    warmCache,
};