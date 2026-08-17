function extractEpisodeNumber(value?: string): number {
  if (!value) return 0
  const match = value.match(/(\d+)(?:\/\d+)?\s*$/)
  if (!match) {
    const anyNumber = value.match(/\d+/)
    return anyNumber ? Number(anyNumber[0]) : 0
  }
  return Number(match[1])
}

export function getEpisodeDisplay(
  episode?: string,
  episodeTotal?: string,
  prefix = 'Tập',
): string | undefined {
  if (!episode) return undefined

  const trimmed = episode.trim()

  // "Hoàn tất" status
  if (/hoan.t|hoàn.t/.test(trimmed)) {
    return 'Hoàn tất'
  }

  // Extract "X/Y" pattern anywhere in the string (with or without spaces)
  const slashMatch = trimmed.match(/(\d+)\s*\/\s*(\d+)/)
  if (slashMatch) {
    const epNum = Number(slashMatch[1])
    const totalNum = Number(slashMatch[2])
    if (epNum > 0 && totalNum > 0 && epNum < totalNum) {
      return `${prefix} ${epNum}/${totalNum}`
    }
    return `${prefix} ${totalNum}`
  }

  // Single number
  const totalNum = extractEpisodeNumber(episodeTotal)
  const epNum = extractEpisodeNumber(episode)

  if (totalNum > 0 && epNum > 0 && epNum !== totalNum) {
    return `${prefix} ${epNum}/${totalNum}`
  }

  if (epNum > 0) {
    return `${prefix} ${epNum}`
  }

  return trimmed
}
