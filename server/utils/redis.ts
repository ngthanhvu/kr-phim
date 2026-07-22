import Redis from 'ioredis'

let _redis: Redis | undefined

export function useRedis() {
  if (_redis) return _redis

  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  _redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })

  _redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message)
  })

  return _redis
}
