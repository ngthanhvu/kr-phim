import { movies } from '../../database/schema'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`SUM(CASE WHEN ${movies.active} = true THEN 1 ELSE 0 END)`,
    inactive: sql<number>`SUM(CASE WHEN ${movies.active} = false THEN 1 ELSE 0 END)`,
  }).from(movies)

  return {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    inactive: stats?.inactive ?? 0,
  }
})
