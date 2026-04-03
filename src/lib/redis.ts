import { Redis } from "@upstash/redis"

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return _redis
}

export const redis = {
  get: async <T = unknown>(...args: Parameters<Redis["get"]>): Promise<T | null> => {
    try {
      return await getRedis()?.get<T>(...args) ?? null
    } catch (err) {
      console.warn("[redis] get failed:", err)
      return null
    }
  },
  set: async (...args: Parameters<Redis["set"]>): Promise<void> => {
    try {
      await getRedis()?.set(...args)
    } catch (err) {
      console.warn("[redis] set failed:", err)
    }
  },
  del: async (...args: Parameters<Redis["del"]>): Promise<void> => {
    try {
      await getRedis()?.del(...args)
    } catch (err) {
      console.warn("[redis] del failed:", err)
    }
  },
}
