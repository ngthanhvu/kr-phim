import { Router } from 'express'
import { eq, and, desc, sql, or, isNull } from 'drizzle-orm'
import { comments, users, commentVotes } from '../database/schema.js'
import { getTokenFromRequest, verifyToken as verifyTokenUtil } from '../utils/auth.js'
import { useDb } from '../utils/db.js'
import mysql from 'mysql2/promise'

const router = Router()

// GET /api/comments (list comments for a movie)
router.get('/', async (req, res) => {
  const query = req.query as any
  const { source = '', slug, userId, limit = '20', offset = '0' } = query
  const pageLimit = Math.min(Math.max(Number(limit), 1), 100)
  const pageOffset = Math.max(Number(offset), 0)

  if (!slug) return res.status(400).json({ message: 'Thiếu slug phim' })

  const db = useDb()
  const whereConditions = [eq(comments.slug, String(slug)), isNull(comments.parentId)]
  if (source) whereConditions.push(eq(comments.source, String(source)))

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(comments).where(and(...whereConditions))

  const results = await db.select({
    id: comments.id, userId: comments.userId, userName: users.name, userAvatar: users.avatar,
    userRole: users.role, userGender: users.gender, source: comments.source, slug: comments.slug,
    movieName: comments.movieName, content: comments.content, pinned: comments.pinned,
    spoiler: comments.spoiler, anonymous: comments.anonymous, likeCount: comments.likeCount,
    dislikeCount: comments.dislikeCount, createdAt: comments.createdAt,
  }).from(comments).leftJoin(users, eq(comments.userId, users.id)).where(and(...whereConditions))
    .orderBy(sql`${comments.pinned} DESC, ${comments.createdAt} DESC`).limit(pageLimit).offset(pageOffset)

  const commentIds = results.map((r: any) => r.id)
  let userVotes: Record<number, number> = {}
  if (userId && commentIds.length > 0) {
    const votes = await db.select().from(commentVotes).where(
      and(eq(commentVotes.userId, Number(userId)), or(...commentIds.map((id: number) => eq(commentVotes.commentId, id))))
    )
    userVotes = Object.fromEntries(votes.map((v: any) => [v.commentId, v.vote]))
  }

  // Fetch replies recursively
  async function fetchRepliesByParentIds(parentIds: number[]): Promise<any[]> {
    if (parentIds.length === 0) return []
    const fetched = await db.select({
      id: comments.id, userId: comments.userId, userName: users.name, userAvatar: users.avatar,
      userRole: users.role, userGender: users.gender, parentId: comments.parentId,
      content: comments.content, pinned: comments.pinned, spoiler: comments.spoiler,
      anonymous: comments.anonymous, likeCount: comments.likeCount, dislikeCount: comments.dislikeCount,
      createdAt: comments.createdAt,
    }).from(comments).leftJoin(users, eq(comments.userId, users.id))
      .where(or(...parentIds.map((id: number) => eq(comments.parentId, id)))).orderBy(comments.createdAt)
    return fetched
  }

  let allReplies: any[] = []
  if (commentIds.length > 0) {
    let currentParentIds = [...commentIds]
    const maxDepth = 10
    let depth = 0
    while (currentParentIds.length > 0 && depth < maxDepth) {
      const replies = await fetchRepliesByParentIds(currentParentIds)
      if (replies.length === 0) break
      allReplies = allReplies.concat(replies)
      currentParentIds = replies.map((r: any) => r.id)
      depth++
    }
  }

  const repliesByParent: Record<number, any[]> = {}
  for (const reply of allReplies) {
    const parentId = reply.parentId!
    if (!repliesByParent[parentId]) repliesByParent[parentId] = []
    repliesByParent[parentId].push(reply)
  }

  function attachChildren(r: any): any {
    const children = repliesByParent[r.id] || []
    return { ...r, replies: children.map(attachChildren) }
  }

  return res.json({
    items: results.map((r: any) => ({
      ...r, userName: r.userName || 'Ẩn danh', userAvatar: r.userAvatar,
      pinned: r.pinned || false, spoiler: r.spoiler || false, anonymous: r.anonymous || false,
      userVote: userVotes[r.id] || 0, replies: (repliesByParent[r.id] || []).map(attachChildren),
    })), total: Number(count),
  })
})

// POST /api/comments (create comment)
router.post('/', async (req, res) => {
  const token = getTokenFromRequest(req)
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' })

  const payload = verifyTokenUtil(token)
  if (!payload) return res.status(401).json({ message: 'Phiên đăng nhập hết hạn' })

  const body = req.body as any
  const { source, slug, content, movieName, parentId, spoiler, anonymous } = body

  if (!slug || !content?.trim()) return res.status(400).json({ message: 'Thiếu thông tin bình luận' })

  if (parentId) {
    const db = useDb()
    const [parent] = await db.select().from(comments).where(eq(comments.id, Number(parentId)))
    if (!parent) return res.status(404).json({ message: 'Không tìm thấy bình luận gốc' })
  }

  const dbUrl = process.env.DATABASE_URL || 'mysql://cinek:cinekpassword@localhost:3306/cinek'
  const conn = await mysql.createConnection(dbUrl)
  try {
    const [result] = await conn.execute(
      'INSERT INTO comments (user_id, source, slug, movie_name, content, parent_id, spoiler, anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [payload.id, source || '', slug, movieName || null, content.trim(), parentId ? Number(parentId) : null, spoiler ? 1 : 0, anonymous ? 1 : 0]
    )
    const insertId = (result as any).insertId
    if (!insertId) return res.status(500).json({ message: 'Không thể tạo bình luận' })

    return res.json({
      id: Number(insertId), userId: payload.id, source: source || '', slug,
      movieName: movieName || null, content: content.trim(), spoiler: false,
      anonymous: anonymous ? true : false, parentId: parentId ? Number(parentId) : null,
      likeCount: 0, dislikeCount: 0, createdAt: new Date().toISOString(),
    })
  } finally {
    await conn.end()
  }
})

// DELETE /api/comments/:id
router.delete('/:id', async (req, res) => {
  const token = getTokenFromRequest(req)
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' })

  const payload = verifyTokenUtil(token)
  if (!payload) return res.status(401).json({ message: 'Phiên đăng nhập hết hạn' })

  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: 'Thiếu ID bình luận' })

  const db = useDb()
  const [comment] = await db.select().from(comments).where(eq(comments.id, id))
  if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' })
  if (comment.userId !== payload.id && payload.role !== 'admin') return res.status(403).json({ message: 'Không có quyền xóa bình luận này' })

  await db.delete(comments).where(eq(comments.id, id))
  return res.json({ success: true })
})

// POST /api/comments/:id/pin
router.post('/:id/pin', async (req, res) => {
  const token = getTokenFromRequest(req)
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' })

  const payload = verifyTokenUtil(token)
  if (!payload) return res.status(401).json({ message: 'Phiên đăng nhập hết hạn' })
  if (payload.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới có quyền ghim bình luận' })

  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: 'Thiếu ID bình luận' })

  const db = useDb()
  const [comment] = await db.select().from(comments).where(eq(comments.id, id))
  if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' })

  const newPinned = !comment.pinned
  await db.update(comments).set({ pinned: newPinned }).where(eq(comments.id, id))
  return res.json({ success: true, pinned: newPinned })
})

// POST /api/comments/vote
router.post('/vote', async (req, res) => {
  const token = getTokenFromRequest(req)
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' })

  const payload = verifyTokenUtil(token)
  if (!payload) return res.status(401).json({ message: 'Phiên đăng nhập hết hạn' })

  const body = req.body as any
  const { commentId, vote } = body
  if (!commentId || ![-1, 0, 1].includes(vote)) return res.status(400).json({ message: 'Thiếu thông tin vote' })

  const db = useDb()
  const [comment] = await db.select().from(comments).where(eq(comments.id, Number(commentId)))
  if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' })

  const [existingVote] = await db.select().from(commentVotes).where(
    and(eq(commentVotes.userId, payload.id), eq(commentVotes.commentId, Number(commentId)))
  )

  if (existingVote) {
    if (existingVote.vote === vote) {
      await db.delete(commentVotes).where(eq(commentVotes.id, existingVote.id))
      if (vote === 1) await db.update(comments).set({ likeCount: sql`${comments.likeCount} - 1` }).where(eq(comments.id, Number(commentId)))
      else if (vote === -1) await db.update(comments).set({ dislikeCount: sql`${comments.dislikeCount} - 1` }).where(eq(comments.id, Number(commentId)))
      return res.json({ vote: 0, likeCount: comment.likeCount + (vote === 1 ? -1 : 0), dislikeCount: comment.dislikeCount + (vote === -1 ? -1 : 0) })
    } else {
      if (existingVote.vote === 1) await db.update(comments).set({ likeCount: sql`${comments.likeCount} - 1` }).where(eq(comments.id, Number(commentId)))
      else if (existingVote.vote === -1) await db.update(comments).set({ dislikeCount: sql`${comments.dislikeCount} - 1` }).where(eq(comments.id, Number(commentId)))
      await db.update(commentVotes).set({ vote }).where(eq(commentVotes.id, existingVote.id))
      if (vote === 1) await db.update(comments).set({ likeCount: sql`${comments.likeCount} + 1` }).where(eq(comments.id, Number(commentId)))
      else if (vote === -1) await db.update(comments).set({ dislikeCount: sql`${comments.dislikeCount} + 1` }).where(eq(comments.id, Number(commentId)))
      return res.json({ vote, likeCount: comment.likeCount + (vote === 1 ? 1 : -1), dislikeCount: comment.dislikeCount + (vote === -1 ? 1 : -1) })
    }
  } else {
    if (vote !== 0) {
      await db.insert(commentVotes).values({ userId: payload.id, commentId: Number(commentId), vote })
      if (vote === 1) await db.update(comments).set({ likeCount: sql`${comments.likeCount} + 1` }).where(eq(comments.id, Number(commentId)))
      else if (vote === -1) await db.update(comments).set({ dislikeCount: sql`${comments.dislikeCount} + 1` }).where(eq(comments.id, Number(commentId)))
    }
    return res.json({ vote, likeCount: comment.likeCount + (vote === 1 ? 1 : 0), dislikeCount: comment.dislikeCount + (vote === -1 ? 1 : 0) })
  }
})

export default router
