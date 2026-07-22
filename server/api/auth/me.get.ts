import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { getTokenFromEvent, verifyToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    deleteCookie(event, 'token', { path: '/' })
    throw createError({ statusCode: 401, message: 'Phiên đăng nhập hết hạn' })
  }

  const db = useDb()
  const result = await db.select().from(users).where(eq(users.id, payload.id)).limit(1)
  if (!result.length || !result[0].active) {
    deleteCookie(event, 'token', { path: '/' })
    throw createError({ statusCode: 401, message: 'Tài khoản không tồn tại hoặc đã bị khóa' })
  }

  const user = result[0]
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
  }
})
