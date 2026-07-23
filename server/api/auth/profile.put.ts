import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { getTokenFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)
  const token = getTokenFromEvent(event)

  if (!token) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!name) {
    throw createError({ statusCode: 400, message: 'Tên hiển thị không được để trống' })
  }

  if (name.length > 50) {
    throw createError({ statusCode: 400, message: 'Tên hiển thị tối đa 50 ký tự' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Token không hợp lệ' })
  }

  await db.update(users)
    .set({ name })
    .where(eq(users.id, payload.id))

  return { message: 'Cập nhật tên thành công!' }
})
