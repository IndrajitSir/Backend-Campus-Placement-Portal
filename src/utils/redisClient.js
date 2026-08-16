import Redis from 'ioredis';
import logger from './Logger/logger.js'

// Redis is used purely as a cache layer, so it must never block requests.
// maxRetriesPerRequest: 1 makes commands reject immediately when Redis is
// down — controllers then fall back to the database. Reconnection still
// happens in the background via retryStrategy.
const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (times) => Math.min(times * 500, 2000),
});

redis.on("connect", () => {
    logger.info("!!Connected to Redis!!")
    console.log("!!Connected to Redis!!")
});
redis.on("error", () => {
    logger.info("Redis connection error!")
    console.error("Redis connection error!")
});

export default redis;
