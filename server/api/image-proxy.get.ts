import { createHash } from 'crypto'
import { useRedis } from '../utils/redis'

const CACHE_TTL = 604800 // 7 ngày (Redis)
const BROWSER_TTL = 31536000 // 1 năm (browser immutable cache)
const CACHE_PREFIX = 'img:'

export default defineEventHandler(async (event) => {
  const url = getQuery(event).url as string
  
  if (!url) {
    throw createError({ statusCode: 400, message: 'Missing URL parameter' })
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw createError({ statusCode: 400, message: 'Invalid URL protocol' })
  }

  const width = getQuery(event).w ? parseInt(getQuery(event).w as string) : undefined
  const quality = getQuery(event).q ? parseInt(getQuery(event).q as string) : 85
  
  const cacheKey = CACHE_PREFIX + createHash('md5').update(`${url}|${width}|${quality}`).digest('hex')
  const redis = useRedis()

  // Check Redis cache
  try {
    const cached = await redis.getBuffer(cacheKey)
    if (cached) {
      setResponseHeader(event, 'cache-control', `public, max-age=${BROWSER_TTL}, stale-while-revalidate=86400, immutable`)
      setResponseHeader(event, 'content-type', 'image/webp')
      setResponseHeader(event, 'x-cache', 'HIT')
      setResponseHeader(event, 'access-control-allow-origin', '*')
      return cached
    }
  } catch {
    // Redis might be down, continue to fetch
  }

  // Fetch from upstream
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': new URL(url).origin,
        'Origin': new URL(url).origin,
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    })
  } catch (error: any) {
    throw createError({ statusCode: 502, message: `Failed to fetch image: ${error.message}` })
  }

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: `Upstream error: ${response.statusText}` })
  }

  const contentType = response.headers.get('content-type') || ''
  
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 400, message: 'Not an image' })
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  
  // Convert to WebP
  let webpBuffer: Buffer
  let converted = true
  try {
    const { default: sharp } = await import('sharp')
    let transform = sharp(buffer).webp({ quality, effort: 4 })
    
    if (width) {
      transform = transform.resize(width, null, { withoutEnlargement: true })
    }
    
    webpBuffer = await transform.toBuffer()
  } catch {
    // If conversion fails, return original
    setResponseHeader(event, 'cache-control', `public, max-age=3600, stale-while-revalidate=300`)
    setResponseHeader(event, 'content-type', contentType)
    setResponseHeader(event, 'x-cache', 'MISS (fallback)')
    setResponseHeader(event, 'access-control-allow-origin', '*')
    return buffer
  }

  // Cache in Redis
  try {
    await redis.set(cacheKey, webpBuffer, 'EX', CACHE_TTL)
  } catch {
    // Ignore cache write errors
  }

  setResponseHeader(event, 'cache-control', `public, max-age=${BROWSER_TTL}, stale-while-revalidate=86400, immutable`)
  setResponseHeader(event, 'content-type', 'image/webp')
  setResponseHeader(event, 'content-length', webpBuffer.length.toString())
  setResponseHeader(event, 'x-cache', converted ? 'MISS (converted)' : 'MISS')
  setResponseHeader(event, 'access-control-allow-origin', '*')
  
  return webpBuffer
})
