import { getKkphimDetail, getNguoncDetail, getOphimDetail } from '../../utils/movies'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const source = getQuery(event).source

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu slug phim' })
  }

  const detailBySource = {
    ophim: getOphimDetail,
    nguonc: getNguoncDetail,
    kkphim: getKkphimDetail,
  }

  const requestedSource = typeof source === 'string' && source in detailBySource ? source as keyof typeof detailBySource : 'ophim'
  const orderedSources = [
    requestedSource,
    ...Object.keys(detailBySource).filter((item) => item !== requestedSource) as Array<keyof typeof detailBySource>,
  ]
  let lastError: unknown

  for (const sourceName of orderedSources) {
    try {
      return await detailBySource[sourceName](slug)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
})
