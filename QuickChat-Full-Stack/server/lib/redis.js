import Redis from "ioredis";
import logger from "./logger.js";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

class RedisClient {
    constructor() {
        this.client = null;
        this.subscriber = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const options = {
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                connectTimeout: 5000,
                lazyConnect: false,
                enableReadyCheck: true,
                retryStrategy: (times) => {
                    if (times > 5) {
                        logger.warn("Redis max retries reached, stopping reconnect");
                        return null;
                    }
                    return Math.min(times * 300, 3000);
                },
            };

            this.client = new Redis(redisUrl, options);
            this.subscriber = new Redis(redisUrl, { ...options, lazyConnect: true });

            this._bindEvents(this.client, "primary");
            this._bindEvents(this.subscriber, "subscriber");

            await new Promise((resolve, reject) => {
                this.client.once("ready", resolve);
                this.client.once("error", reject);
                setTimeout(() => reject(new Error("Redis connection timeout")), 5000);
            });

            await this.subscriber.connect().catch((err) => {
                logger.warn("Redis subscriber connect failed:", err.message);
            });

            return this;
        } catch (error) {
            logger.warn("Redis not available, running without cache:", error.message);
            this.isConnected = false;
            return null;
        }
    }

    _bindEvents(instance, label) {
        instance.on("connect", () => {
            this.isConnected = true;
            logger.info(`Redis ${label} connected`);
        });
        instance.on("ready", () => {
            this.isConnected = true;
        });
        instance.on("error", (err) => {
            if (err.code !== "ECONNREFUSED") {
                logger.error(`Redis ${label} error:`, err.message);
            }
            this.isConnected = false;
        });
        instance.on("close", () => {
            this.isConnected = false;
        });
        instance.on("reconnecting", () => {
            logger.info(`Redis ${label} reconnecting...`);
        });
    }

    async get(key) {
        if (!this.isConnected) return null;
        try { return await this.client.get(key); }
        catch { return null; }
    }

    async set(key, value, expireSeconds = 3600) {
        if (!this.isConnected) return null;
        try { return await this.client.set(key, value, "EX", expireSeconds); }
        catch { return null; }
    }

    async del(key) {
        if (!this.isConnected) return 0;
        try { return await this.client.del(key); }
        catch { return 0; }
    }

    async delPattern(pattern) {
        if (!this.isConnected) return 0;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) return 0;
            return await this.client.del(...keys);
        } catch { return 0; }
    }

    async publish(channel, message) {
        if (!this.isConnected) return 0;
        try { return await this.client.publish(channel, JSON.stringify(message)); }
        catch { return 0; }
    }

    async subscribe(channel, callback) {
        if (!this.isConnected || !this.subscriber) return;
        try {
            await this.subscriber.subscribe(channel);
            this.subscriber.on("message", (ch, message) => {
                if (ch === channel) {
                    try { callback(JSON.parse(message)); } catch {}
                }
            });
        } catch {}
    }

    async incr(key) {
        if (!this.isConnected) return 0;
        try { return await this.client.incr(key); }
        catch { return 0; }
    }

    async expire(key, seconds) {
        if (!this.isConnected) return 0;
        try { return await this.client.expire(key, seconds); }
        catch { return 0; }
    }

    async ttl(key) {
        if (!this.isConnected) return -1;
        try { return await this.client.ttl(key); }
        catch { return -1; }
    }

    async zadd(key, score, member) {
        if (!this.isConnected) return 0;
        try { return await this.client.zadd(key, score, member); }
        catch { return 0; }
    }

    async zrangebyscore(key, min, max) {
        if (!this.isConnected) return [];
        try { return await this.client.zrangebyscore(key, min, max); }
        catch { return []; }
    }

    async zrem(key, member) {
        if (!this.isConnected) return 0;
        try { return await this.client.zrem(key, member); }
        catch { return 0; }
    }

    async hset(key, field, value) {
        if (!this.isConnected) return 0;
        try { return await this.client.hset(key, field, value); }
        catch { return 0; }
    }

    async hget(key, field) {
        if (!this.isConnected) return null;
        try { return await this.client.hget(key, field); }
        catch { return null; }
    }

    async hgetall(key) {
        if (!this.isConnected) return null;
        try { return await this.client.hgetall(key); }
        catch { return null; }
    }

    async hdel(key, field) {
        if (!this.isConnected) return 0;
        try { return await this.client.hdel(key, field); }
        catch { return 0; }
    }

    async sadd(key, ...members) {
        if (!this.isConnected) return 0;
        try { return await this.client.sadd(key, ...members); }
        catch { return 0; }
    }

    async srem(key, ...members) {
        if (!this.isConnected) return 0;
        try { return await this.client.srem(key, ...members); }
        catch { return 0; }
    }

    async smembers(key) {
        if (!this.isConnected) return [];
        try { return await this.client.smembers(key); }
        catch { return []; }
    }

    getClient() {
        return this.client;
    }

    isReady() {
        return this.isConnected && this.client?.status === "ready";
    }

    async quit() {
        try {
            if (this.client && this.client.status !== "wait") {
                await this.client.quit();
            }
            if (this.subscriber && this.subscriber.status !== "wait") {
                await this.subscriber.quit();
            }
            this.isConnected = false;
            logger.info("Redis connections closed");
        } catch (error) {
            logger.error("Error closing Redis:", error.message);
        }
    }
}

export const redis = new RedisClient();
export default redis;
