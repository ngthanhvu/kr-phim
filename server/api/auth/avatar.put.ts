import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { getTokenFromEvent } from '../../utils/auth'

const validCategories = ['meme', 'hoat-hinh', 'viet-nam']
const validNumbers: Record<string, string[]> = {
  meme: ['01', '02', '03', '04', '05', '06', '07', '08'],
  'hoat-hinh': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
  'viet-nam': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16'],
}

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)
  const token = getTokenFromEvent(event)

  if (!token) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  const avatar = typeof body.avatar === 'string' ? body.avatar : ''

  if (!avatar) {
    await db.update(users)
      .set({ avatar: null })
      .where(eq(users.id, (verifyToken(token) as any).id))
    return { message: 'Đã xóa avatar' }
  }

  const parts = avatar.split('/')
  const num = parts[2]?.replace('.jpg', '')
  if (parts.length !== 3 || parts[0] !== 'avatars' || !validCategories.includes(parts[1]) || !validNumbers[parts[1]]?.includes(num)) {
    throw createError({ statusCode: 400, message: 'Avatar không hợp lệ' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Token không hợp lệ' })
  }

  await db.update(users)
    .set({ avatar: `/${avatar}` })
    .where(eq(users.id, payload.id))

  return { message: 'Cập nhật avatar thành công!' }
})
