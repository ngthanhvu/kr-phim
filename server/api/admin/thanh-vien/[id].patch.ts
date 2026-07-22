import { users } from '../../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Thiếu ID thành viên' })
  }

  const existing = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!existing.length) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy thành viên' })
  }

  const updates: Record<string, any> = {}

  if ('role' in body && ['admin', 'moderator', 'user'].includes(body.role)) {
    updates.role = body.role
  }

  if (typeof body.active === 'boolean') {
    updates.active = body.active
  }

  if (!Object.keys(updates).length) {
    throw createError({ statusCode: 400, message: 'Không có dữ liệu cập nhật' })
  }

  await db.update(users).set(updates).where(eq(users.id, id))

  return { success: true, id, ...updates }
})
