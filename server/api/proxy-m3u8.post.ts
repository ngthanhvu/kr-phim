export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const url = body.url as string

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'Missing url parameter',
    })
  }

  // Validate URL to prevent SSRF
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid URL protocol',
    })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': new URL(url).origin,
        'Origin': new URL(url).origin,
      },
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `Upstream error: ${response.statusText}`,
      })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const isM3u8 = url.includes('.m3u8') || contentType.includes('mpegurl')

    setHeader(event, 'access-control-allow-origin', '*')
    setHeader(event, 'access-control-allow-methods', 'POST, OPTIONS')
    setHeader(event, 'cache-control', 'public, max-age=3600')

    // For m3u8 files, rewrite relative URLs to use proxy
    if (isM3u8) {
      let body = await response.text()
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
      
      // Rewrite absolute URLs
      body = body.replace(/^(https?:\/\/[^\s]+)$/gm, (match) => {
        const encoded = Buffer.from(match).toString('base64')
        return `/api/proxy-m3u8/${encoded}`
      })
      
      // Rewrite relative URLs (not starting with http/https or /api/proxy-m3u8/)
      body = body.replace(/^([^#\s][^\n]*)$/gm, (match) => {
        if (match.startsWith('http://') || match.startsWith('https://') || match.startsWith('/api/proxy-m3u8/')) {
          return match
        }
        const absoluteUrl = new URL(match, baseUrl).href
        const encoded = Buffer.from(absoluteUrl).toString('base64')
        return `/api/proxy-m3u8/${encoded}`
      })
      
      setHeader(event, 'content-type', 'application/vnd.apple.mpegurl')
      return body
    } else {
      // For .ts files and other binary data, stream directly
      setHeader(event, 'content-type', contentType)
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        setHeader(event, 'content-length', contentLength)
      }
      return response.body
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: `Proxy error: ${error.message}`,
    })
  }
})
