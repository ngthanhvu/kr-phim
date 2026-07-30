import { eq, and, isNull, desc, inArray, count } from 'drizzle-orm'
import { comments, users, movies } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDb()

  // Comment counts per movie (top-level only)
  const commentCountsRows = await db
    .select({
      source: comments.source,
      slug: comments.slug,
      cCount: count(),
    })
    .from(comments)
    .where(isNull(comments.parentId))
    .groupBy(comments.source, comments.slug)

  const commentCountMap = new Map<string, number>()
  for (const row of commentCountsRows) {
    commentCountMap.set(`${row.source}:${row.slug}`, Number(row.cCount))
  }

  function getCommentCount(movie: any) {
    return commentCountMap.get(`${movie.source}:${movie.slug}`) || 0
  }

  const [recentComments, rawMovies, allCategories] = await Promise.all([
    // Recent comments
    db
      .select({
        id: comments.id,
        content: comments.content,
        likeCount: comments.likeCount,
        dislikeCount: comments.dislikeCount,
        createdAt: comments.createdAt,
        userId: comments.userId,
        userName: users.name,
        userAvatar: users.avatar,
        userRole: users.role,
        userGender: users.gender,
        source: comments.source,
        slug: comments.slug,
        movieName: comments.movieName,
        movieThumb: movies.thumb,
        moviePoster: movies.poster,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(movies, and(eq(comments.slug, movies.slug), eq(comments.source, movies.source)))
      .where(isNull(comments.parentId))
      .orderBy(desc(comments.createdAt))
      .limit(10),

    // All active movies (used for trending + most rated in JS)
    db
      .select({
        source: movies.source,
        slug: movies.slug,
        name: movies.name,
        originName: movies.originName,
        thumb: movies.thumb,
        poster: movies.poster,
        views: movies.views,
        rating: movies.rating,
      })
      .from(movies)
      .where(eq(movies.active, true)),

    // Categories for hot genres
    db
      .select({ categories: movies.categories })
      .from(movies)
      .where(eq(movies.active, true)),
  ])

  // Trending: views + commentCount * 50
  const trendingWithScore = rawMovies.map(m => ({
    ...m,
    _score: Number(m.views) + getCommentCount(m) * 50,
  })).sort((a, b) => b._score - a._score).slice(0, 5)

  // Most rated: rating + commentCount * 2
  const mostRatedWithScore = rawMovies.map(m => ({
    ...m,
    _score: Number(m.rating) + getCommentCount(m) * 2,
  })).sort((a, b) => b._score - a._score).slice(0, 5)

  // Count replies for each recent comment
  const commentIds = recentComments.map(c => c.id)
  let replyCounts: Record<number, number> = {}
  if (commentIds.length > 0) {
    const replyRows = await db
      .select({
        parentId: comments.parentId,
        count: count(),
      })
      .from(comments)
      .where(inArray(comments.parentId, commentIds))
      .groupBy(comments.parentId)
    replyCounts = Object.fromEntries(replyRows.map(r => [r.parentId!, Number(r.count)]))
  }

  // Aggregate hot genres
  const genreMap = new Map<string, number>()
  for (const row of allCategories) {
    for (const category of (row.categories || [])) {
      genreMap.set(category, (genreMap.get(category) || 0) + 1)
    }
  }
  const hotGenres = [...genreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  return {
    recentComments: recentComments.map(c => ({
      id: c.id,
      content: c.content,
      likeCount: c.likeCount,
      dislikeCount: c.dislikeCount,
      replyCount: replyCounts[c.id] || 0,
      createdAt: c.createdAt,
      user: {
        id: c.userId,
        name: c.userName || 'Ẩn danh',
        avatar: c.userAvatar,
        gender: c.userGender,
        role: c.userRole,
      },
      movie: c.slug && c.source
        ? {
            source: c.source,
            slug: c.slug,
            name: c.movieName || '',
            thumb: c.movieThumb,
            poster: c.moviePoster,
          }
        : null,
    })),
    trending: trendingWithScore.map(m => ({
      source: m.source,
      slug: m.slug,
      name: m.name,
      originName: m.originName,
      thumb: m.thumb,
      poster: m.poster,
      views: m.views,
      rating: m.rating,
    })),
    mostRated: mostRatedWithScore.map(m => ({
      source: m.source,
      slug: m.slug,
      name: m.name,
      originName: m.originName,
      thumb: m.thumb,
      poster: m.poster,
      views: m.views,
      rating: m.rating,
    })),
    hotGenres,
  }
})
