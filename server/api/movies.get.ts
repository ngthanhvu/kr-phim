import { getKoreanMovies } from '../utils/movies'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(Number(query.page || 1), 1)
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''
  const source = typeof query.source === 'string' && ['ophim', 'nguonc', 'kkphim'].includes(query.source)
    ? query.source as 'ophim' | 'nguonc' | 'kkphim'
    : 'all'

  return await getKoreanMovies(page, keyword, source)
})
