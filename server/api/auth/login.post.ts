import { users } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import { verifyPassword, signToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email và mật khẩu là bắt buộc' })
  }

  const result = await db.select().from(users).where(and(eq(users.email, email), eq(users.active, true))).limit(1)
  if (!result.length) {
    throw createError({ statusCode: 401, message: 'Email hoặc mật khẩu không đúng' })
  }

  const user = result[0]
  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Email hoặc mật khẩu không đúng' })
  }

  const payload = { id: user.id, email: user.email, role: user.role }
  const token = signToken(payload)

  setCookie(event, 'token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    token,
  }
})
