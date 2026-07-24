import { eq } from 'drizzle-orm'
import { comments } from '../../../database/schema'
import { getTokenFromEvent, verifyToken } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Phiên đăng nhập hết hạn' })
  }

  // Only admins can pin/unpin
  if (payload.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Chỉ admin mới có quyền ghim bình luận' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, message: 'Thiếu ID bình luận' })
  }

  const db = useDb()

  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id))

  if (!comment) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy bình luận' })
  }

  // Toggle pinned state
  const newPinned = !comment.pinned
  await db
    .update(comments)
    .set({ pinned: newPinned })
    .where(eq(comments.id, id))

  return { success: true, pinned: newPinned }
})
