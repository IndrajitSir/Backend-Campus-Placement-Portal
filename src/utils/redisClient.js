import Redis from 'ioredis';
import logger from './Logger/logger.js'

const redis = new Redis();

redis.on("connect", () => {
    logger.info("!!Connected to Redis!!")
});
redis.on("error", () => {
    logger.info("Redis connection error!")
});

export default redis;