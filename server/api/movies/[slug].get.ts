import { getMovieDetailGroup, parseSourceRefs } from '../../utils/movies'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu slug phim' })
  }

  const refs = parseSourceRefs(query.sources || query.srcs, query.source, slug)

  return await getMovieDetailGroup(refs)
})
