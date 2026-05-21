export type WatchHistoryItem = {
  source: string
  slug: string
  name: string
  originName?: string
  thumb?: string
  poster?: string
  episodeName?: string
  episodeIndex?: number
  serverIndex?: number
  progressSeconds?: number
  durationSeconds?: number
  updatedAt?: number
}

const watchHistoryKey = 'kr-phim-watch-history'

function normalizeHistoryItem(item: any): WatchHistoryItem | null {
  const slug = item?.slug
  const name = item?.name

  if (!slug || !name) return null

  return {
    source: String(item.source || ''),
    slug: String(slug),
    name: String(name),
    originName: item.originName || item.origin_name || undefined,
    thumb: item.thumb || undefined,
    poster: item.poster || undefined,
    episodeName: item.episodeName || item.episode_name || undefined,
    episodeIndex: Number(item.episodeIndex ?? item.episode_index ?? 0),
    serverIndex: Number(item.serverIndex ?? item.server_index ?? 0),
    progressSeconds: Math.max(Number(item.progressSeconds ?? item.progress_seconds ?? 0), 0),
    durationSeconds: Math.max(Number(item.durationSeconds ?? item.duration_seconds ?? 0), 0),
    updatedAt: typeof item.updatedAt === 'number'
      ? item.updatedAt
      : new Date(item.updated_at || Date.now()).getTime(),
  }
}

function readLocalHistory() {
  if (!import.meta.client) return []

  try {
    const raw = window.localStorage.getItem(watchHistoryKey)
    const history = raw ? JSON.parse(raw) : []

    return Array.isArray(history)
      ? history
        .map(normalizeHistoryItem)
        .filter(Boolean) as WatchHistoryItem[]
      : []
  } catch {
    return []
  }
}

function writeLocalHistory(items: WatchHistoryItem[]) {
  if (!import.meta.client) return
  window.localStorage.setItem(watchHistoryKey, JSON.stringify(items))
}

export function useWatchHistory() {
  const { $supabase } = useNuxtApp()
  const { user } = useSupabaseAuth()

  async function loadWatchHistory(limit = 12) {
    const localItems = readLocalHistory()

    if (user.value) {
      if (localItems.length) {
        await $supabase
          .from('watch_history')
          .upsert(localItems.slice(0, 20).map((item) => ({
            user_id: user.value?.id,
            source: item.source,
            slug: item.slug,
            name: item.name,
            origin_name: item.originName || null,
            thumb: item.thumb || null,
            poster: item.poster || null,
            episode_name: item.episodeName || null,
            episode_index: item.episodeIndex || 0,
            server_index: item.serverIndex || 0,
            progress_seconds: Math.floor(item.progressSeconds || 0),
            duration_seconds: Math.floor(item.durationSeconds || 0),
            updated_at: new Date(item.updatedAt || Date.now()).toISOString(),
          })), {
            onConflict: 'user_id,source,slug',
          })
      }

      const { data, error } = await $supabase
        .from('watch_history')
        .select('source, slug, name, origin_name, thumb, poster, episode_name, episode_index, server_index, progress_seconds, duration_seconds, updated_at')
        .eq('user_id', user.value.id)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        return data
          .map(normalizeHistoryItem)
          .filter(Boolean) as WatchHistoryItem[]
      }
    }

    return localItems
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, limit)
  }

  async function saveWatchHistory(item: WatchHistoryItem) {
    const normalizedItem = normalizeHistoryItem({
      ...item,
      updatedAt: item.updatedAt || Date.now(),
    })

    if (!normalizedItem) return

    const localItems = [
      normalizedItem,
      ...readLocalHistory().filter((historyItem) => !(historyItem.slug === normalizedItem.slug && historyItem.source === normalizedItem.source)),
    ].slice(0, 20)

    writeLocalHistory(localItems)

    if (!user.value) return

    await $supabase
      .from('watch_history')
      .upsert({
        user_id: user.value.id,
        source: normalizedItem.source,
        slug: normalizedItem.slug,
        name: normalizedItem.name,
        origin_name: normalizedItem.originName || null,
        thumb: normalizedItem.thumb || null,
        poster: normalizedItem.poster || null,
        episode_name: normalizedItem.episodeName || null,
        episode_index: normalizedItem.episodeIndex || 0,
        server_index: normalizedItem.serverIndex || 0,
        progress_seconds: Math.floor(normalizedItem.progressSeconds || 0),
        duration_seconds: Math.floor(normalizedItem.durationSeconds || 0),
        updated_at: new Date(normalizedItem.updatedAt || Date.now()).toISOString(),
      }, {
        onConflict: 'user_id,source,slug',
      })
  }

  async function clearWatchHistory() {
    if (import.meta.client) window.localStorage.removeItem(watchHistoryKey)

    if (user.value) {
      await $supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.value.id)
    }
  }

  return {
    loadWatchHistory,
    saveWatchHistory,
    clearWatchHistory,
  }
}
