import { movies } from '../../database/schema'
import { sql, eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`SUM(CASE WHEN ${movies.active} = true THEN 1 ELSE 0 END)`,
    inactive: sql<number>`SUM(CASE WHEN ${movies.active} = false THEN 1 ELSE 0 END)`,
    series: sql<number>`SUM(CASE WHEN ${movies.type} = 'series' THEN 1 ELSE 0 END)`,
    single: sql<number>`SUM(CASE WHEN ${movies.type} = 'single' THEN 1 ELSE 0 END)`,
    totalViews: sql<number>`COALESCE(SUM(${movies.views}), 0)`,
    ophim: sql<number>`SUM(CASE WHEN ${movies.source} = 'ophim' THEN 1 ELSE 0 END)`,
    nguonc: sql<number>`SUM(CASE WHEN ${movies.source} = 'nguonc' THEN 1 ELSE 0 END)`,
    kkphim: sql<number>`SUM(CASE WHEN ${movies.source} = 'kkphim' THEN 1 ELSE 0 END)`,
  }).from(movies)

  const topMovies = await db.select({
    name: movies.name,
    views: movies.views,
    slug: movies.slug,
    source: movies.source,
  }).from(movies)
    .where(eq(movies.active, true))
    .orderBy(sql`${movies.views} DESC`)
    .limit(5)

  return {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    inactive: stats?.inactive ?? 0,
    series: stats?.series ?? 0,
    single: stats?.single ?? 0,
    totalViews: stats?.totalViews ?? 0,
    ophim: stats?.ophim ?? 0,
    nguonc: stats?.nguonc ?? 0,
    kkphim: stats?.kkphim ?? 0,
    topMovies: topMovies || [],
  }
})
