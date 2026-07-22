import { getTokenFromEvent, verifyToken } from '../utils/auth'

export default defineEventHandler((event) => {
  const path = event.path || event.node?.req?.url || ''

  if (!path.startsWith('/api/admin')) return

  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Phiên đăng nhập hết hạn' })
  }

  if (payload.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Không có quyền truy cập' })
  }

  event.context.user = payload
})
