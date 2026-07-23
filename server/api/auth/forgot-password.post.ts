import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email là bắt buộc' })
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!result.length) {
    throw createError({ statusCode: 404, message: 'Email không tồn tại trong hệ thống' })
  }

  const user = result[0]
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000)

  await db.update(users)
    .set({
      resetToken,
      resetTokenExpires: resetExpires,
    })
    .where(eq(users.id, user.id))

  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/dat-lai-mat-khau?token=${resetToken}`

  console.log(`Password reset URL for ${email}: ${resetUrl}`)

  return { message: 'Đã gửi link đặt lại mật khẩu! Kiểm tra email của bạn.' }
})
