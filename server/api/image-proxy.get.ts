import { createHash } from 'crypto'
import { useRedis } from '../utils/redis'

const CACHE_TTL = 604800 // 7 ngày
const CACHE_PREFIX = 'img:'
const DEFAULT_WIDTH = null
const DEFAULT_QUALITY = 85

async function getCachedWebP(redis: any, key: string): Promise<Buffer | null> {
  try {
    const cached = await redis.getBuffer(key)
    return cached || null
  } catch {
    return null
  }
}

async function setCachedWebP(redis: any, key: string, data: Buffer): Promise<void> {
  try {
    await redis.set(key, data, 'EX', CACHE_TTL)
  } catch {
    // Ignore cache write errors
  }
}

export default defineEventHandler(async (event) => {
  const url = getQuery(event).url as string
  
  if (!url) {
    throw createError({ statusCode: 400, message: 'Missing URL parameter' })
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw createError({ statusCode: 400, message: 'Invalid URL protocol' })
  }

  const width = getQuery(event).w ? parseInt(getQuery(event).w as string) : DEFAULT_WIDTH
  const quality = getQuery(event).q ? parseInt(getQuery(event).q as string) : DEFAULT_QUALITY
  const cacheKey = CACHE_PREFIX + createHash('md5').update(`${url}|${width}|${quality}`).digest('hex')

  const redis = useRedis()

  // Check cache
  const cached = await getCachedWebP(redis, cacheKey)
  if (cached) {
    setResponseHeader(event, 'cache-control', 'public, max-age=604800, immutable')
    setResponseHeader(event, 'content-type', 'image/webp')
    setResponseHeader(event, 'x-cache', 'HIT')
    setResponseHeader(event, 'access-control-allow-origin', '*')
    return cached
  }

  // Fetch original image
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': new URL(url).origin,
        'Origin': new URL(url).origin,
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
  
  // Skip non-image content types
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 400, message: 'Not an image' })
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  
  // Convert to WebP with optional resizing (dynamic import to avoid ESM resolution in dev)
  let webpBuffer: Buffer
  try {
    const { default: sharp } = await import('sharp')
    let transform = sharp(buffer)      .webp({ quality, effort: 4 })
    
    if (width) {
      transform = transform.resize(width, null, { withoutEnlargement: true })
    }
    
    webpBuffer = await transform.toBuffer()
  } catch (error: any) {
    // If conversion fails, return original
    setResponseHeader(event, 'content-type', contentType)
    setResponseHeader(event, 'cache-control', 'public, max-age=3600')
    setResponseHeader(event, 'x-cache', 'MISS')
    setResponseHeader(event, 'access-control-allow-origin', '*')
    return buffer
  }

  // Cache in Redis
  await setCachedWebP(redis, cacheKey, webpBuffer)

  setResponseHeader(event, 'cache-control', 'public, max-age=604800, immutable')
  setResponseHeader(event, 'content-type', 'image/webp')
  setResponseHeader(event, 'content-length', webpBuffer.length.toString())
  setResponseHeader(event, 'x-cache', 'MISS')
  setResponseHeader(event, 'access-control-allow-origin', '*')
  
  return webpBuffer
})
