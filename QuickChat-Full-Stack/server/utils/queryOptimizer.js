import redis from "../lib/redis.js";
import logger from "../lib/logger.js";

// Query optimization utility class
class QueryOptimizer {
    constructor() {
        this.defaultCacheTime = 300; // 5 minutes
        this.longCacheTime = 3600; // 1 hour
        this.shortCacheTime = 60; // 1 minute
    }

    // Cache key generator
    generateCacheKey(prefix, ...args) {
        const keyParts = [prefix, ...args.map(arg => {
            if (typeof arg === "object") {
                return JSON.stringify(arg);
            }
            return String(arg);
        })];
        return `query:${keyParts.join(":")}`;
    }

    // Execute query with caching
    async executeWithCache(queryFn, cacheKey, cacheTime = this.defaultCacheTime) {
        try {
            // Try to get from cache first
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                logger.debug(`Cache hit for key: ${cacheKey}`);
                return JSON.parse(cachedData);
            }

            // Execute the actual query
            logger.debug(`Cache miss for key: ${cacheKey}`);
            const result = await queryFn();

            // Store in cache
            if (result !== null && result !== undefined) {
                await redis.set(cacheKey, JSON.stringify(result), cacheTime);
            }

            return result;
        } catch (error) {
            logger.error(`Query cache error for key ${cacheKey}:`, error.message);
            // Fall back to executing query without cache
            return await queryFn();
        }
    }

    // Invalidate cache by pattern
    async invalidateCache(pattern) {
        try {
            const deleted = await redis.delPattern(`query:${pattern}*`);
            logger.debug(`Invalidated ${deleted} cache entries matching pattern: ${pattern}`);
            return deleted;
        } catch (error) {
            logger.error(`Cache invalidation error for pattern ${pattern}:`, error.message);
            return 0;
        }
    }

    // Batch query optimization
    async batchQueries(queries) {
        const results = [];
        const cacheKeys = [];
        const uncachedQueries = [];

        // Check cache for all queries first
        for (const query of queries) {
            const cacheKey = this.generateCacheKey(query.prefix, ...query.args);
            cacheKeys.push(cacheKey);

            const cached = await redis.get(cacheKey);
            if (cached) {
                results.push(JSON.parse(cached));
            } else {
                results.push(null);
                uncachedQueries.push(query);
            }
        }

        // Execute uncached queries
        if (uncachedQueries.length > 0) {
            const uncachedResults = await Promise.all(
                uncachedQueries.map(async (query) => {
                    const result = await query.execute();
                    const cacheKey = this.generateCacheKey(query.prefix, ...query.args);
                    await redis.set(cacheKey, JSON.stringify(result), query.cacheTime || this.defaultCacheTime);
                    return { key: cacheKey, result };
                })
            );

            // Merge results back
            let uncachedIndex = 0;
            for (let i = 0; i < results.length; i++) {
                if (results[i] === null) {
                    results[i] = uncachedResults[uncachedIndex].result;
                    uncachedIndex++;
                }
            }
        }

        return results;
    }

    // Pagination helper with cursor-based pagination
    async paginate(Model, query, options = {}) {
        const {
            limit = 20,
            cursor = null,
            sort = { createdAt: -1 },
            populate = null,
            select = null,
            lean = true,
        } = options;

        const queryObj = { ...query };

        // Add cursor condition for cursor-based pagination
        if (cursor) {
            queryObj._id = { $lt: cursor };
        }

        let mongooseQuery = Model.find(queryObj)
            .sort(sort)
            .limit(limit + 1); // Fetch one extra to check if there are more

        if (populate) {
            if (Array.isArray(populate)) {
                populate.forEach(p => {
                    mongooseQuery = mongooseQuery.populate(p);
                });
            } else {
                mongooseQuery = mongooseQuery.populate(populate);
            }
        }

        if (select) {
            mongooseQuery = mongooseQuery.select(select);
        }

        if (lean) {
            mongooseQuery = mongooseQuery.lean();
        }

        const results = await mongooseQuery;
        const hasMore = results.length > limit;
        
        if (hasMore) {
            results.pop(); // Remove the extra item
        }

        const nextCursor = hasMore ? results[results.length - 1]._id : null;

        return {
            data: results,
            pagination: {
                hasMore,
                nextCursor,
                limit,
                count: results.length,
            },
        };
    }

    // Aggregate pipeline optimization
    async optimizedAggregate(Model, pipeline, options = {}) {
        const {
            cacheKey = null,
            cacheTime = this.defaultCacheTime,
            allowDiskUsage = false,
        } = options;

        if (cacheKey) {
            return await this.executeWithCache(
                async () => {
                    return await Model.aggregate(pipeline)
                        .option({ allowDiskUsage })
                        .exec();
                },
                cacheKey,
                cacheTime
            );
        }

        return await Model.aggregate(pipeline)
            .option({ allowDiskUsage })
            .exec();
    }

    // Index analysis and recommendations
    async analyzeIndexes(Model) {
        try {
            const indexes = await Model.collection.getIndexes();
            const stats = await Model.collection.stats();
            
            return {
                indexes,
                stats: {
                    count: stats.count,
                    size: stats.size,
                    avgObjSize: stats.avgObjSize,
                    totalIndexSize: stats.totalIndexSize,
                    indexSizes: stats.indexSizes,
                },
                recommendations: this.generateIndexRecommendations(indexes, stats),
            };
        } catch (error) {
            logger.error(`Index analysis error for ${Model.modelName}:`, error.message);
            return null;
        }
    }

    generateIndexRecommendations(indexes, stats) {
        const recommendations = [];
        
        // Check if collection needs more indexes
        if (stats.count > 10000 && Object.keys(indexes).length < 5) {
            recommendations.push({
                type: "INDEX_SUGGESTION",
                message: "Consider adding more indexes for large collection",
                priority: "MEDIUM",
            });
        }

        // Check index size ratio
        const indexSizeRatio = stats.totalIndexSize / stats.size;
        if (indexSizeRatio > 1) {
            recommendations.push({
                type: "INDEX_SIZE_WARNING",
                message: "Index size exceeds data size. Consider reviewing indexes.",
                priority: "HIGH",
            });
        }

        return recommendations;
    }

    // Connection pool optimization
    getOptimalPoolSize() {
        const cpuCores = require("os").cpus().length;
        const totalMemory = require("os").totalmem();
        const memoryInGB = totalMemory / (1024 * 1024 * 1024);

        // Base formula: 2 * CPU cores + effective number of disks
        let poolSize = (cpuCores * 2) + 1;

        // Adjust based on available memory
        if (memoryInGB < 4) {
            poolSize = Math.min(poolSize, 5);
        } else if (memoryInGB < 8) {
            poolSize = Math.min(poolSize, 10);
        } else if (memoryInGB < 16) {
            poolSize = Math.min(poolSize, 20);
        }

        return Math.max(poolSize, 5);
    }
}

export const queryOptimizer = new QueryOptimizer();
export default queryOptimizer;