import { eq, and, sql } from 'drizzle-orm'
import { comments, commentVotes } from '../../database/schema'
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
  const { commentId, vote } = body

  if (!commentId || ![-1, 0, 1].includes(vote)) {
    throw createError({ statusCode: 400, message: 'Thiếu thông tin vote' })
  }

  const db = useDb()

  const [comment] = await db.select().from(comments).where(eq(comments.id, Number(commentId)))
  if (!comment) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy bình luận' })
  }

  const [existingVote] = await db
    .select()
    .from(commentVotes)
    .where(and(
      eq(commentVotes.userId, payload.id),
      eq(commentVotes.commentId, Number(commentId))
    ))

  if (existingVote) {
    if (existingVote.vote === vote) {
      await db.delete(commentVotes).where(eq(commentVotes.id, existingVote.id))
      if (vote === 1) {
        await db.update(comments).set({ likeCount: sql`${comments.likeCount} - 1` }).where(eq(comments.id, Number(commentId)))
      } else if (vote === -1) {
        await db.update(comments).set({ dislikeCount: sql`${comments.dislikeCount} - 1` }).where(eq(comments.id, Number(commentId)))
      }
      return { vote: 0, likeCount: comment.likeCount + (vote === 1 ? -1 : 0), dislikeCount: comment.dislikeCount + (vote === -1 ? -1 : 0) }
    } else {
      if (existingVote.vote === 1) {
        await db.update(comments).set({ likeCount: sql`${comments.likeCount} - 1` }).where(eq(comments.id, Number(commentId)))
      } else if (existingVote.vote === -1) {
        await db.update(comments).set({ dislikeCount: sql`${comments.dislikeCount} - 1` }).where(eq(comments.id, Number(commentId)))
      }

      await db.update(commentVotes).set({ vote }).where(eq(commentVotes.id, existingVote.id))

      if (vote === 1) {
        await db.update(comments).set({ likeCount: sql`${comments.likeCount} + 1` }).where(eq(comments.id, Number(commentId)))
      } else if (vote === -1) {
        await db.update(comments).set({ dislikeCount: sql`${comments.dislikeCount} + 1` }).where(eq(comments.id, Number(commentId)))
      }

      return { vote, likeCount: comment.likeCount + (vote === 1 ? 1 : -1), dislikeCount: comment.dislikeCount + (vote === -1 ? 1 : -1) }
    }
  } else {
    if (vote !== 0) {
      await db.insert(commentVotes).values({
        userId: payload.id,
        commentId: Number(commentId),
        vote,
      })

      if (vote === 1) {
        await db.update(comments).set({ likeCount: sql`${comments.likeCount} + 1` }).where(eq(comments.id, Number(commentId)))
      } else if (vote === -1) {
        await db.update(comments).set({ dislikeCount: sql`${comments.dislikeCount} + 1` }).where(eq(comments.id, Number(commentId)))
      }
    }

    return { vote, likeCount: comment.likeCount + (vote === 1 ? 1 : 0), dislikeCount: comment.dislikeCount + (vote === -1 ? 1 : 0) }
  }
})
