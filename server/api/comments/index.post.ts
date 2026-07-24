import { eq } from 'drizzle-orm'
import { comments } from '../../database/schema'
import { getTokenFromEvent, verifyToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Phiên đăng nhập hết hạn' })
  }

  const body = await readBody(event)
  const { source, slug, content, movieName, parentId, spoiler, anonymous } = body

  if (!slug || !content?.trim()) {
    throw createError({ statusCode: 400, message: 'Thiếu thông tin bình luận' })
  }

  if (parentId) {
    const db = useDb()
    const [parent] = await db.select().from(comments).where(eq(comments.id, Number(parentId)))
    if (!parent) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy bình luận gốc' })
    }
  }

  const db = useDb()

  const result = await db.insert(comments).values({
    userId: payload.id,
    source: source || '',
    slug,
    movieName: movieName || null,
    content: content.trim(),
    parentId: parentId ? Number(parentId) : null,
    spoiler: spoiler ? true : false,
    anonymous: anonymous ? true : false,
  })

  return {
    id: result.insertId,
    userId: payload.id,
    source: source || '',
    slug,
    movieName: movieName || null,
    content: content.trim(),
    spoiler: spoiler ? true : false,
    anonymous: anonymous ? true : false,
    parentId: parentId ? Number(parentId) : null,
    likeCount: 0,
    dislikeCount: 0,
  }
})
