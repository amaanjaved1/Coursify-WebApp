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

export function getRequiredRedisClient(): Redis {
  const client = getRedis()
  if (!client) {
    throw new Error("Redis is not configured")
  }
  return client
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
  delPattern: async (pattern: string): Promise<void> => {
    try {
      const client = getRedis()
      if (!client) return
      let cursor = "0"
      do {
        const [nextCursor, keys]: [string, string[]] = await client.scan(cursor, { match: pattern, count: 100 })
        if (keys.length > 0) await client.del(...(keys as [string, ...string[]]))
        cursor = nextCursor
      } while (cursor !== "0")
    } catch (err) {
      console.warn("[redis] delPattern failed:", err)
    }
  },
  incr: async (key: string): Promise<number | null> => {
    try {
      const client = getRedis()
      if (!client) return null
      return await client.incr(key)
    } catch (err) {
      console.warn("[redis] incr failed:", err)
      return null
    }
  },
  expire: async (key: string, seconds: number): Promise<void> => {
    try {
      await getRedis()?.expire(key, seconds)
    } catch (err) {
      console.warn("[redis] expire failed:", err)
    }
  },
  ttl: async (key: string): Promise<number | null> => {
    try {
      const client = getRedis()
      if (!client) return null
      return await client.ttl(key)
    } catch (err) {
      console.warn("[redis] ttl failed:", err)
      return null
    }
  },
}
