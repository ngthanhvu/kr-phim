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
): string | undefined {
  if (!episode) return undefined

  const totalNum = extractEpisodeNumber(episodeTotal)
  const epNum = extractEpisodeNumber(episode)

  if (totalNum > 0 && epNum > 0 && epNum !== totalNum) {
    return `Tập ${epNum}/${totalNum}`
  }

  return episode
}
