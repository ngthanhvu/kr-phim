import { users } from '../../database/schema'
import { desc, like, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''

  const whereClause = keyword
    ? like(users.name, `%${keyword}%`)
    : undefined

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatar: users.avatar,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(100),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause),
  ])

  return {
    items,
    total: countResult[0]?.count ?? 0,
  }
})
