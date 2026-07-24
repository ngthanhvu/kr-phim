import { eq, and, desc, sql, or, isNull } from 'drizzle-orm'
import { comments, users, commentVotes } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { source = '', slug, userId } = query

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Thiếu slug phim' })
  }

  const db = useDb()

  const whereConditions = [
    eq(comments.slug, String(slug)),
    isNull(comments.parentId),
  ]

  if (source) {
    whereConditions.push(eq(comments.source, String(source)))
  }

  // Fetch pinned comments first, then regular ones
  const results = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      userName: users.name,
      userAvatar: users.avatar,
      userRole: users.role,
      source: comments.source,
      slug: comments.slug,
      movieName: comments.movieName,
      content: comments.content,
      pinned: comments.pinned,
      spoiler: comments.spoiler,
      anonymous: comments.anonymous,
      likeCount: comments.likeCount,
      dislikeCount: comments.dislikeCount,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(and(...whereConditions))
    .orderBy(sql`${comments.pinned} DESC, ${comments.createdAt} DESC`)
    .limit(100)

  const commentIds = results.map(r => r.id)

  let userVotes: Record<number, number> = {}
  if (userId && commentIds.length > 0) {
    const votes = await db
      .select()
      .from(commentVotes)
      .where(and(
        eq(commentVotes.userId, Number(userId)),
        or(...commentIds.map(id => eq(commentVotes.commentId, id)))
      ))
    userVotes = Object.fromEntries(votes.map(v => [v.commentId, v.vote]))
  }

  let replies: any[] = []
  if (commentIds.length > 0) {
    replies = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        userName: users.name,
        userAvatar: users.avatar,
        userRole: users.role,
        parentId: comments.parentId,
        content: comments.content,
        pinned: comments.pinned,
        spoiler: comments.spoiler,
        anonymous: comments.anonymous,
        likeCount: comments.likeCount,
        dislikeCount: comments.dislikeCount,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(
        and(
          or(...commentIds.map(id => eq(comments.parentId, id)))
        )
      )
      .orderBy(comments.createdAt)
  }

  const repliesByParent: Record<number, typeof replies> = {}
  for (const reply of replies) {
    const parentId = reply.parentId!
    if (!repliesByParent[parentId]) {
      repliesByParent[parentId] = []
    }
    repliesByParent[parentId].push(reply)
  }

  return {
    items: results.map(r => ({
      id: r.id,
      userId: r.userId,
      userName: r.anonymous ? 'Ẩn danh' : (r.userName || 'Ẩn danh'),
      userAvatar: r.anonymous ? null : r.userAvatar,
      userRole: r.userRole,
      source: r.source,
      slug: r.slug,
      movieName: r.movieName,
      content: r.content,
      pinned: r.pinned || false,
      spoiler: r.spoiler || false,
      anonymous: r.anonymous || false,
      likeCount: r.likeCount,
      dislikeCount: r.dislikeCount,
      createdAt: r.createdAt,
      userVote: userVotes[r.id] || 0,
      replies: (repliesByParent[r.id] || []).map(rep => ({
        id: rep.id,
        userId: rep.userId,
        userName: rep.anonymous ? 'Ẩn danh' : (rep.userName || 'Ẩn danh'),
        userAvatar: rep.anonymous ? null : rep.userAvatar,
        userRole: rep.userRole,
        parentId: rep.parentId,
        content: rep.content,
        pinned: rep.pinned || false,
        spoiler: rep.spoiler || false,
        anonymous: rep.anonymous || false,
        likeCount: rep.likeCount,
        dislikeCount: rep.dislikeCount,
        createdAt: rep.createdAt,
        userVote: userVotes[rep.id] || 0,
      })),
    })),
  }
})
