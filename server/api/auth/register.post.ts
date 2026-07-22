import { users } from '../../database/schema'
import { eq, sql } from 'drizzle-orm'
import { hashPassword, signToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email và mật khẩu là bắt buộc' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Email không hợp lệ' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length) {
    throw createError({ statusCode: 409, message: 'Email đã được sử dụng' })
  }

  const hashedPassword = await hashPassword(password)
  const isAdmin = (await db.select({ count: sql<number>`count(*)` }).from(users))[0]?.count === 0

  const result = await db.insert(users).values({
    email,
    password: hashedPassword,
    name: name || email.split('@')[0],
    role: isAdmin ? 'admin' : 'user',
  })

  const userId = result[0].insertId
  const user = { id: userId, email, role: isAdmin ? 'admin' : 'user' }
  const token = signToken(user)

  setCookie(event, 'token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return {
    user: { id: userId, email, name: name || email.split('@')[0], role: user.role },
    token,
  }
})
