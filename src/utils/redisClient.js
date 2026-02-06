import Redis from 'ioredis';
import logger from './Logger/logger.js'

const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

let lastLogErrorTime = 0;
const LOG_ERROR_INTERVAL = 60000; // 1 minute

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
