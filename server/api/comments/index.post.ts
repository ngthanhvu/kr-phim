import { eq } from 'drizzle-orm'
import mysql from 'mysql2/promise'
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

  const dbUrl = process.env.DATABASE_URL || 'mysql://cinek:cinekpassword@localhost:3306/cinek'
  const conn = await mysql.createConnection(dbUrl)

  try {
    const [result] = await conn.execute(
      'INSERT INTO comments (user_id, source, slug, movie_name, content, parent_id, spoiler, anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [payload.id, source || '', slug, movieName || null, content.trim(), parentId ? Number(parentId) : null, spoiler ? 1 : 0, anonymous ? 1 : 0]
    )

    const insertId = (result as any).insertId
    if (!insertId) {
      throw createError({ statusCode: 500, message: 'Không thể tạo bình luận' })
    }

    return {
      id: Number(insertId),
      userId: payload.id,
      source: source || '',
      slug,
      movieName: movieName || null,
      content: content.trim(),
      spoiler: false,
      anonymous: anonymous ? true : false,
      parentId: parentId ? Number(parentId) : null,
      likeCount: 0,
      dislikeCount: 0,
      createdAt: new Date().toISOString(),
    }
  } finally {
    await conn.end()
  }
})
