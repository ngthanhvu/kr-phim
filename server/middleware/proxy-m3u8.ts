export default defineEventHandler(async (event) => {
  const path = event.path || event.node?.req?.url || ''
  
  // Only handle /api/proxy-m3u8/ paths
  if (!path.startsWith('/api/proxy-m3u8/')) {
    return
  }
  
  const base64Url = path.replace('/api/proxy-m3u8/', '')
  
  if (!base64Url) {
    throw createError({ statusCode: 400, message: 'Missing url parameter' })
  }

  // Decode URL from base64
  let url: string
  try {
    url = Buffer.from(base64Url, 'base64').toString('utf-8')
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid URL encoding' })
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw createError({ statusCode: 400, message: 'Invalid URL protocol' })
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
      throw createError({ statusCode: response.status, message: `Upstream error: ${response.statusText}` })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const isM3u8 = url.includes('.m3u8') || contentType.includes('mpegurl')

    setHeader(event, 'access-control-allow-origin', '*')
    setHeader(event, 'access-control-allow-methods', 'GET, OPTIONS')
    setHeader(event, 'cache-control', 'public, max-age=3600')

    if (isM3u8) {
      let body = await response.text()
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
      
      body = body.replace(/^(https?:\/\/[^\s]+)$/gm, (match) => {
        const encoded = Buffer.from(match).toString('base64')
        return `/api/proxy-m3u8/${encoded}`
      })
      
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
      setHeader(event, 'content-type', contentType)
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        setHeader(event, 'content-length', contentLength)
      }
      return response.body
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Proxy error: ${error.message}` })
  }
})
