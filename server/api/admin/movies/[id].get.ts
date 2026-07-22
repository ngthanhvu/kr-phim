import { movies } from '../../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, message: 'Thiếu ID phim' })
  }

  const result = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!result.length) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy phim' })
  }

  return result[0]
})
