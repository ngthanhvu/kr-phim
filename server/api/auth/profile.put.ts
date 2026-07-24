import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { getTokenFromEvent, verifyToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)
  const token = getTokenFromEvent(event)

  if (!token) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Token không hợp lệ' })
  }

  const updates: Record<string, any> = {}

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name) {
    if (name.length > 50) {
      throw createError({ statusCode: 400, message: 'Tên hiển thị tối đa 50 ký tự' })
    }
    updates.name = name
  }

  if (['male', 'female', 'other', ''].includes(body.gender)) {
    updates.gender = body.gender || null
  }

  if (!Object.keys(updates).length) {
    throw createError({ statusCode: 400, message: 'Không có dữ liệu cập nhật' })
  }

  await db.update(users).set(updates).where(eq(users.id, payload.id))

  return { message: 'Cập nhật thành công!' }
})
