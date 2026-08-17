import express from 'express'
import { createHash } from 'crypto'
import { useRedis } from '../utils/redis.js'

const router = express.Router()
const CACHE_TTL = 604800 // 7 days (Redis)
const BROWSER_TTL = 31536000 // 1 year (browser immutable cache)
const CACHE_PREFIX = 'img:'

router.get('/', async (req: express.Request, res: express.Response) => {
  const url = (req.query as any).url as string
  
  if (!url) return res.status(400).json({ message: 'Missing URL parameter' })
  if (!url.startsWith('http://') && !url.startsWith('https://')) return res.status(400).json({ message: 'Invalid URL protocol' })

  const width = req.query.w ? parseInt(req.query.w as string) : undefined
  const quality = req.query.q ? parseInt(req.query.q as string) : 85
  
  const cacheKey = CACHE_PREFIX + createHash('md5').update(`${url}|${width}|${quality}`).digest('hex')
  const redis = useRedis()

  try {
    const cached = await redis.getBuffer(cacheKey)
    if (cached) {
      res.setHeader('cache-control', `public, max-age=${BROWSER_TTL}, stale-while-revalidate=86400, immutable`)
      res.setHeader('content-type', 'image/webp')
      res.setHeader('x-cache', 'HIT')
      res.setHeader('access-control-allow-origin', '*')
      return res.send(cached)
    }
  } catch {}

  let response: Response
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8', Referer: new URL(url).origin, Origin: new URL(url).origin, 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(15000),
    })
  } catch (error: any) {
    return res.status(502).json({ message: `Failed to fetch image: ${error.message}` })
  }

  if (!response.ok) return res.status(response.status).json({ message: `Upstream error: ${response.statusText}` })

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/')) return res.status(400).json({ message: 'Not an image' })

  const buffer = Buffer.from(await response.arrayBuffer())
  
  let webpBuffer: Buffer
  let converted = true
  try {
    const sharpModule = await import('sharp')
    const sharp = sharpModule.default
    let transform = sharp(buffer).webp({ quality, effort: 4 })
    if (width) transform = transform.resize(width, null, { withoutEnlargement: true })
    webpBuffer = await transform.toBuffer()
  } catch {
    res.setHeader('cache-control', `public, max-age=3600, stale-while-revalidate=300`)
    res.setHeader('content-type', contentType)
    res.setHeader('x-cache', 'MISS (fallback)')
    res.setHeader('access-control-allow-origin', '*')
    return res.send(buffer)
  }

  try {
    await redis.set(cacheKey, webpBuffer, 'EX', CACHE_TTL)
  } catch {}

  res.setHeader('cache-control', `public, max-age=${BROWSER_TTL}, stale-while-revalidate=86400, immutable`)
  res.setHeader('content-type', 'image/webp')
  res.setHeader('content-length', webpBuffer.length.toString())
  res.setHeader('x-cache', 'MISS (converted)')
  res.setHeader('access-control-allow-origin', '*')
  return res.send(webpBuffer)
})

export { router as imageProxy }
