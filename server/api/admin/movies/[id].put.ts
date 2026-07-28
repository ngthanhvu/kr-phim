import { movies } from '../../../database/schema'
import { eq } from 'drizzle-orm'
import { useRedis } from '../../../utils/redis'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Thiếu ID phim' })
  }

  const existing = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!existing.length) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy phim' })
  }

  const updates: Record<string, any> = {}

  for (const field of ['customPoster', 'customThumb', 'customContent'] as const) {
    if (field in body) {
      updates[field] = typeof body[field] === 'string' && body[field].trim()
        ? body[field].trim()
        : null
    }
  }

  if ('customEpisodes' in body) {
    updates.customEpisodes = Array.isArray(body.customEpisodes) && body.customEpisodes.length
      ? body.customEpisodes.filter((ep: any) => ep.name?.trim())
      : null
  }

  if ('actors' in body) {
    updates.actors = Array.isArray(body.actors) && body.actors.length
      ? body.actors.filter((a: any) => a.name?.trim()).map((a: any) => ({
          name: a.name.trim(),
          originalName: a.originalName?.trim() || undefined,
          role: a.role?.trim() || undefined,
          avatar: a.avatar?.trim() || undefined,
        }))
      : null
  }

  if ('customServers' in body) {
    updates.customServers = Array.isArray(body.customServers) && body.customServers.length
      ? body.customServers
        .filter((server: any) => server.name?.trim())
        .map((server: any) => ({
          name: server.name.trim(),
          episodes: Array.isArray(server.episodes)
            ? server.episodes.filter((ep: any) => ep.name?.trim()).map((ep: any) => ({
                name: ep.name.trim(),
                linkEmbed: ep.linkEmbed?.trim() || null,
                linkM3u8: ep.linkM3u8?.trim() || null,
              }))
            : [],
        }))
      : null
  }

  if (!Object.keys(updates).length) {
    throw createError({ statusCode: 400, message: 'Không có dữ liệu cập nhật' })
  }

  await db.update(movies).set(updates).where(eq(movies.id, id))

  try {
    const redis = useRedis()
    const keys = await redis.keys('cinek:public:*')
    if (keys.length) await redis.del(...keys)
  } catch {}

  return { success: true, id }
})
