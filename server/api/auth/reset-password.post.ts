import { users } from '../../database/schema'
import { eq, and, gt, lt, or, isNull } from 'drizzle-orm'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token || !password) {
    throw createError({ statusCode: 400, message: 'Token và mật khẩu mới là bắt buộc' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  }

  const now = new Date()
  const result = await db.select()
    .from(users)
    .where(
      and(
        eq(users.resetToken, token),
        or(
          isNull(users.resetTokenExpires),
          gt(users.resetTokenExpires, now),
        ),
      ),
    )
    .limit(1)

  if (!result.length) {
    throw createError({ statusCode: 400, message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' })
  }

  const user = result[0]
  const hashedPassword = await hashPassword(password)

  await db.update(users)
    .set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    })
    .where(eq(users.id, user.id))

  return { message: 'Đặt lại mật khẩu thành công!' }
})
