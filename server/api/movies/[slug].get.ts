import { getNguoncDetail, getOphimDetail } from '../../utils/movies'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const source = getQuery(event).source

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu slug phim' })
  }

  if (source === 'nguonc') {
    try {
      return await getNguoncDetail(slug)
    } catch {
      return await getOphimDetail(slug)
    }
  }

  try {
    return await getOphimDetail(slug)
  } catch (error) {
    try {
      return await getNguoncDetail(slug)
    } catch {
      throw error
    }
  }
})
