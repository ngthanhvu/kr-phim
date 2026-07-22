import { movies } from '../../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Thiếu ID phim' })
  }

  const existing = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!existing.length) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy phim' })
  }

  const updates: Record<string, any> = {}

  if (typeof body.active === 'boolean') {
    updates.active = body.active
  }

  if (!Object.keys(updates).length) {
    throw createError({ statusCode: 400, message: 'Không có dữ liệu cập nhật' })
  }

  await db.update(movies).set(updates).where(eq(movies.id, id))

  try {
    const redis = useRedis()
    const keys = await redis.keys('cinek:public:*')
    if (keys.length) {
      await redis.del(...keys)
    }
  } catch {}

  return { success: true, id, ...updates }
})
