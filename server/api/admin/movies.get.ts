import { movies } from '../../database/schema'
import { desc, eq, like, and, sql, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const offset = (page - 1) * limit
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''
  const status = typeof query.status === 'string' ? query.status : ''
  const source = typeof query.source === 'string' ? query.source : ''
  const type = typeof query.type === 'string' ? query.type : ''
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : ''
  const sortOrder = typeof query.sortOrder === 'string' ? query.sortOrder : 'desc'

  const conditions: any[] = []

  if (keyword) conditions.push(like(movies.name, `%${keyword}%`))
  if (status === 'active') conditions.push(eq(movies.active, true))
  else if (status === 'inactive') conditions.push(eq(movies.active, false))
  if (source) conditions.push(eq(movies.source, source))
  if (type) conditions.push(eq(movies.type, type))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const allowedSortColumns: Record<string, any> = {
    name: movies.name,
    views: movies.views,
    apiUpdatedAt: movies.apiUpdatedAt,
    active: movies.active,
  }

  const orderBy: any[] = []
  if (sortBy && allowedSortColumns[sortBy]) {
    const column = allowedSortColumns[sortBy]
    orderBy.push(sortOrder === 'asc' ? asc(column) : desc(column))
  } else {
    orderBy.push(desc(movies.apiUpdatedAt), desc(movies.year), desc(movies.syncedAt))
  }

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(movies)
      .where(whereClause)
      .orderBy(...orderBy)
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
