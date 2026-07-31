/**
 * Transform image URLs to use the internal image proxy.
 * This converts remote images to WebP format for faster loading.
 */
export function proxyImageUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('/api/image-proxy')) return url
  
  // Nếu đã có sẵn query params
  const separator = url.includes('?') ? '&' : '?'
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

export function proxyThumbUrl(url: string): string {
  return proxyImageUrl(url)
}

export function proxyPosterUrl(url: string): string {
  return proxyImageUrl(url)
}
