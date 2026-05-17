import { getKoreanMovies } from '../utils/movies'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(Number(query.page || 1), 1)
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''

  return await getKoreanMovies(page, keyword)
})
