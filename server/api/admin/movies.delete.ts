import { movies } from '../../database/schema'
import { useRedis } from '../../utils/redis'

export default defineEventHandler(async () => {
  const db = useDb()

  await db.delete(movies)

  try {
    const redis = useRedis()
    const keys = await redis.keys('cinek:public:*')
    if (keys.length) await redis.del(...keys)
  } catch {}

  return { success: true }
})
