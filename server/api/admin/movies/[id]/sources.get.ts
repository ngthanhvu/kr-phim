import { movies } from '../../../../database/schema'
import { eq } from 'drizzle-orm'
import { getOphimDetail, getNguoncDetail, getKkphimDetail, type NormalizedServer, type NormalizedActor } from '../../../../utils/movies'

const detailFetchers = {
  ophim: getOphimDetail,
  nguonc: getNguoncDetail,
  kkphim: getKkphimDetail,
}

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, message: 'Thiếu ID phim' })
  }

  const result = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!result.length) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy phim' })
  }

  const movie = result[0]
  const sourceRefs = (movie.sources || []).filter((ref: any) => ref.source && ref.slug)

  if (!sourceRefs.length) {
    return { movie, sources: [] }
  }

  const results = await Promise.allSettled(
    sourceRefs.map((ref: any) => detailFetchers[ref.source as keyof typeof detailFetchers](ref.slug)),
  )

  const sourceServers: { source: string, slug: string, name: string, content: string, actors: NormalizedActor[], servers: NormalizedServer[] }[] = []

  results.forEach((result, index) => {
    const ref = sourceRefs[index]
    if (result.status === 'fulfilled') {
      sourceServers.push({
        source: ref.source,
        slug: ref.slug,
        name: ref.name || result.value.name,
        content: result.value.content || '',
        actors: result.value.actors || [],
        servers: (result.value.servers || []).map((server: NormalizedServer) => ({
          ...server,
          source: ref.source,
          sourceSlug: ref.slug,
        })),
      })
    }
  })

  return {
    movie,
    sources: sourceServers,
  }
})
