import { users } from '../../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, message: 'Thiếu ID thành viên' })
  }

  const existing = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!existing.length) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy thành viên' })
  }

  const currentUser = event.context.user
  if (currentUser?.id === id) {
    throw createError({ statusCode: 400, message: 'Không thể xoá chính mình' })
  }

  await db.delete(users).where(eq(users.id, id))

  return { success: true, id }
})
