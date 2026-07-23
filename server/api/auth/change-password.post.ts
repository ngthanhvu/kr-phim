import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, hashPassword, getTokenFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)
  const token = getTokenFromEvent(event)

  if (!token) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' })
  }

  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Token không hợp lệ' })
  }

  const result = await db.select().from(users).where(eq(users.id, payload.id)).limit(1)
  if (!result.length) {
    throw createError({ statusCode: 404, message: 'User không tồn tại' })
  }

  const user = result[0]
  const valid = await verifyPassword(currentPassword, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Mật khẩu hiện tại không đúng' })
  }

  const hashedPassword = await hashPassword(newPassword)

  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, user.id))

  return { message: 'Đổi mật khẩu thành công!' }
})
