import { movies } from '../../database/schema'
import { desc, eq, like, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const offset = (page - 1) * limit
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''
  const status = typeof query.status === 'string' ? query.status : ''

  let whereClause = undefined
  if (keyword && status === 'active') {
    whereClause = sql`${like(movies.name, `%${keyword}%`)} AND ${movies.active} = true`
  } else if (keyword) {
    whereClause = like(movies.name, `%${keyword}%`)
  } else if (status === 'active') {
    whereClause = eq(movies.active, true)
  } else if (status === 'inactive') {
    whereClause = eq(movies.active, false)
  }

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(movies)
      .where(whereClause)
      .orderBy(desc(movies.apiUpdatedAt), desc(movies.year), desc(movies.syncedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(movies)
      .where(whereClause),
  ])

  const total = countResult[0]?.count ?? 0

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
})
