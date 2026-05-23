import { getMovieDetailGroup, parseSourceRefs } from '../../utils/movies'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const source = query.source

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu slug phim' })
  }

  const requestedSource = typeof source === 'string' && ['ophim', 'nguonc', 'kkphim'].includes(source)
    ? source as 'ophim' | 'nguonc' | 'kkphim'
    : 'ophim'
  const refs = parseSourceRefs(query.sources || query.srcs, requestedSource, slug)

  return await getMovieDetailGroup(refs)
})
