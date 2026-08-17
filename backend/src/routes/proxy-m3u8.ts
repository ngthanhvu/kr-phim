import express from 'express'

const router = express.Router()

// GET /api/proxy-m3u8/:url (base64 encoded URL)
router.get('/:url', async (req: express.Request, res: express.Response) => {
  const base64Url = req.params.url
  
  if (!base64Url) return res.status(400).json({ message: 'Missing url parameter' })

  let url: string
  try {
    url = Buffer.from(base64Url, 'base64').toString('utf-8')
  } catch {
    return res.status(400).json({ message: 'Invalid URL encoding' })
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ message: 'Invalid URL protocol' })
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: '*/*', Referer: new URL(url).origin, Origin: new URL(url).origin },
    })

    if (!response.ok) return res.status(response.status).json({ message: `Upstream error: ${response.statusText}` })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const isM3u8 = url.includes('.m3u8') || contentType.includes('mpegurl')

    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('access-control-allow-methods', 'GET, OPTIONS')
    res.setHeader('cache-control', 'public, max-age=3600')

    if (isM3u8) {
      const body = await response.text()
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
      
      // Rewrite absolute URLs
      const rewrittenBody = body.replace(/^(https?:\/\/[^\s]+)$/gm, (match) => {
        const encoded = Buffer.from(match).toString('base64')
        return `/api/proxy-m3u8/${encoded}`
      })
      
      // Rewrite relative URLs
      const finalBody = rewrittenBody.replace(/^([^#\s][^\n]*)$/gm, (match) => {
        if (match.startsWith('http://') || match.startsWith('https://') || match.startsWith('/api/proxy-m3u8/')) return match
        const absoluteUrl = new URL(match, baseUrl).href
        const encoded = Buffer.from(absoluteUrl).toString('base64')
        return `/api/proxy-m3u8/${encoded}`
      })
      
      res.setHeader('content-type', 'application/vnd.apple.mpegurl')
      return res.send(finalBody)
    } else {
      const contentLength = response.headers.get('content-length')
      if (contentLength) res.setHeader('content-length', contentLength)
      res.setHeader('content-type', contentType)
      return res.send(await response.arrayBuffer())
    }
  } catch (error: any) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message })
    return res.status(500).json({ message: `Proxy error: ${error.message}` })
  }
})

// POST /api/proxy-m3u8 (POST with URL in body)
router.post('/', async (req: express.Request, res: express.Response) => {
  const body = req.body as any
  const url = body.url

  if (!url) return res.status(400).json({ message: 'Missing url parameter' })
  if (!url.startsWith('http://') && !url.startsWith('https://')) return res.status(400).json({ message: 'Invalid URL protocol' })

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: '*/*', Referer: new URL(url).origin, Origin: new URL(url).origin },
    })

    if (!response.ok) return res.status(response.status).json({ message: `Upstream error: ${response.statusText}` })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const isM3u8 = url.includes('.m3u8') || contentType.includes('mpegurl')

    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('access-control-allow-methods', 'POST, OPTIONS')
    res.setHeader('cache-control', 'public, max-age=3600')

    if (isM3u8) {
      const m3u8Body = await response.text()
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
      
      const rewrittenBody = m3u8Body.replace(/^(https?:\/\/[^\s]+)$/gm, (match) => {
        const encoded = Buffer.from(match).toString('base64')
        return `/api/proxy-m3u8/${encoded}`
      })
      
      const finalBody = rewrittenBody.replace(/^([^#\s][^\n]*)$/gm, (match) => {
        if (match.startsWith('http://') || match.startsWith('https://') || match.startsWith('/api/proxy-m3u8/')) return match
        const absoluteUrl = new URL(match, baseUrl).href
        const encoded = Buffer.from(absoluteUrl).toString('base64')
        return `/api/proxy-m3u8/${encoded}`
      })
      
      res.setHeader('content-type', 'application/vnd.apple.mpegurl')
      return res.send(finalBody)
    } else {
      const contentLength = response.headers.get('content-length')
      if (contentLength) res.setHeader('content-length', contentLength)
      res.setHeader('content-type', contentType)
      return res.send(await response.arrayBuffer())
    }
  } catch (error: any) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message })
    return res.status(500).json({ message: `Proxy error: ${error.message}` })
  }
})

export { router as m3u8Proxy }
