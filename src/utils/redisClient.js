import Redis from 'ioredis';
import logger from './Logger/logger.js'

// Redis is used purely as a cache layer, so it must never block requests.
// maxRetriesPerRequest: 1 makes commands reject immediately when Redis is
// down — controllers then fall back to the database. Reconnection still
// happens in the background via retryStrategy.
const redisUrl = process.env.REDIS_URL;
const redis = new Redis(redisUrl || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    // Only keep retrying when a URL is explicitly configured. If REDIS_URL is
    // unset, fail once quietly and let the cache layer fall back to MongoDB.
    retryStrategy: redisUrl ? (times) => Math.min(times * 500, 2000) : null,
});

// Throttle repeated Redis error logs so a down Redis doesn't spam the log stream
let lastLogErrorTime = 0;
const LOG_ERROR_INTERVAL = 30000; // ms

redis.on("connect", () => {
    logger.info("!!Connected to Redis!!")
    console.log("!!Connected to Redis!!")
    lastLogErrorTime = 0; // Reset on successful connection
});

redis.on("error", (error) => {
    const now = Date.now();
    if (now - lastLogErrorTime > LOG_ERROR_INTERVAL) {
        logger.error("Redis connection error!", { error: error.message });
        console.error("Redis connection error!", error.message);
        lastLogErrorTime = now;
    }
});

export default redis;
