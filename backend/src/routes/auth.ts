import { Router } from 'express'
import { users } from '../database/schema.js'
import { eq, and, sql } from 'drizzle-orm'
import { hashPassword, verifyPassword, signToken, setAuthCookie, getTokenFromRequest, verifyToken as verifyTokenUtil } from '../utils/auth.js'
import { useDb } from '../utils/db.js'
import crypto from 'crypto'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const db = useDb()
  const body = req.body as any
  
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!email || !password) {
    return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Email không hợp lệ' })
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length) {
    return res.status(409).json({ message: 'Email đã được sử dụng' })
  }

  const hashedPassword = await hashPassword(password)
  const isAdmin = (await db.select({ count: sql<number>`count(*)` }).from(users))[0]?.count === 0

  const result = await db.insert(users).values({
    email,
    password: hashedPassword,
    name: name || email.split('@')[0],
    role: isAdmin ? 'admin' : 'user',
  })

  const userId = (result as any).insertId || 1
  const userPayload = { id: userId, email, role: isAdmin ? 'admin' : 'user' }
  const token = signToken(userPayload)

  setAuthCookie(res, token)

  return res.json({
    user: { id: userId, email, name: name || email.split('@')[0], role: userPayload.role },
    token,
  })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  const db = useDb()
  const body = req.body as any

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' })
  }

  const result = await db.select().from(users).where(and(eq(users.email, email), eq(users.active, true))).limit(1)
  if (!result.length) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' })
  }

  const user = result[0]
  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' })
  }

  const payload = { id: user.id, email: user.email, role: user.role }
  const token = signToken(payload)

  setAuthCookie(res, token)

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    token,
  })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' })
  return res.json({ success: true })
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  const token = getTokenFromRequest(req)
  if (!token) {
    return res.status(401).json({ message: 'Chưa đăng nhập' })
  }

  const payload = verifyTokenUtil(token)
  if (!payload) {
    res.clearCookie('token', { path: '/' })
    return res.status(401).json({ message: 'Phiên đăng nhập hết hạn' })
  }

  const db = useDb()
  const result = await db.select().from(users).where(eq(users.id, payload.id)).limit(1)
  if (!result.length || !result[0].active) {
    res.clearCookie('token', { path: '/' })
    return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị khóa' })
  }

  const user = result[0]
  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    gender: user.gender,
  })
})

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
  const db = useDb()
  const body = req.body as any
  const token = getTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ message: 'Chưa đăng nhập' })
  }

  const payload = verifyTokenUtil(token)
  if (!payload) {
    return res.status(401).json({ message: 'Token không hợp lệ' })
  }

  const updates: Record<string, any> = {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name) {
    if (name.length > 50) {
      return res.status(400).json({ message: 'Tên hiển thị tối đa 50 ký tự' })
    }
    updates.name = name
  }

  if (['male', 'female', 'other', ''].includes(body.gender)) {
    updates.gender = body.gender || null
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'Không có dữ liệu cập nhật' })
  }

  await db.update(users).set(updates).where(eq(users.id, payload.id))
  return res.json({ message: 'Cập nhật thành công!' })
})

// PUT /api/auth/avatar
router.put('/avatar', async (req, res) => {
  const db = useDb()
  const body = req.body as any
  const token = getTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ message: 'Chưa đăng nhập' })
  }

  const avatar = typeof body.avatar === 'string' ? body.avatar : ''
  
  const payload = verifyTokenUtil(token)
  if (!payload) {
    return res.status(401).json({ message: 'Token không hợp lệ' })
  }

  const validCategories = ['meme', 'hoat-hinh', 'viet-nam']
  const validNumbers: Record<string, string[]> = {
    meme: ['01', '02', '03', '04', '05', '06', '07', '08'],
    'hoat-hinh': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    'viet-nam': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16'],
  }

  if (!avatar) {
    await db.update(users).set({ avatar: null }).where(eq(users.id, payload.id))
    return res.json({ message: 'Đã xóa avatar' })
  }

  const parts = avatar.split('/')
  const num = parts[2]?.replace(/\.(?:jpg|webp)$/, '')
  if (parts.length !== 3 || parts[0] !== 'avatars' || !validCategories.includes(parts[1]) || !validNumbers[parts[1]]?.includes(num)) {
    return res.status(400).json({ message: 'Avatar không hợp lệ' })
  }

  await db.update(users).set({ avatar: `/${avatar}` }).where(eq(users.id, payload.id))
  return res.json({ message: 'Cập nhật avatar thành công!' })
})

// PUT /api/auth/change-password
router.put('/change-password', async (req, res) => {
  const db = useDb()
  const body = req.body as any
  const token = getTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ message: 'Chưa đăng nhập' })
  }

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  }

  const payload = verifyTokenUtil(token)
  if (!payload) {
    return res.status(401).json({ message: 'Token không hợp lệ' })
  }

  const result = await db.select().from(users).where(eq(users.id, payload.id)).limit(1)
  if (!result.length) {
    return res.status(404).json({ message: 'User không tồn tại' })
  }

  const user = result[0]
  const valid = await verifyPassword(currentPassword, user.password)
  if (!valid) {
    return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' })
  }

  const hashedPassword = await hashPassword(newPassword)
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id))
  return res.json({ message: 'Đổi mật khẩu thành công!' })
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const db = useDb()
  const body = req.body as any

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return res.status(400).json({ message: 'Email là bắt buộc' })
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!result.length) {
    return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' })
  }

  const user = result[0]
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000)

  await db.update(users).set({ resetToken, resetTokenExpires: resetExpires }).where(eq(users.id, user.id))

  const resetUrl = `${process.env.APP_URL || 'http://localhost:3002'}/dat-lai-mat-khau?token=${resetToken}`
  console.log(`Password reset URL for ${email}: ${resetUrl}`)

  return res.json({ message: 'Đã gửi link đặt lại mật khẩu! Kiểm tra email của bạn.' })
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const db = useDb()
  const body = req.body as any

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token || !password) {
    return res.status(400).json({ message: 'Token và mật khẩu mới là bắt buộc' })
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  }

  const now = new Date()
  const result = await db.select()
    .from(users)
    .where(and(
      eq(users.resetToken, token),
      or(isNull(users.resetTokenExpires), gt(users.resetTokenExpires, now)),
    ))
    .limit(1)

  if (!result.length) {
    return res.status(400).json({ message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' })
  }

  const user = result[0]
  const hashedPassword = await hashPassword(password)
  await db.update(users).set({ password: hashedPassword, resetToken: null, resetTokenExpires: null }).where(eq(users.id, user.id))
  return res.json({ message: 'Đặt lại mật khẩu thành công!' })
})

// Import needed operators
import { or, isNull, gt } from 'drizzle-orm'

export default router
