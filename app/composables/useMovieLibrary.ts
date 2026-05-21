export type LibraryMovieItem = {
  source: string
  slug: string
  name: string
  originName?: string
  thumb?: string
  poster?: string
  updatedAt?: number
}

const favoriteKey = 'kr-phim-favorites'
const watchLaterKey = 'kr-phim-watch-later'

function normalizeLibraryItem(item: any): LibraryMovieItem | null {
  if (!item?.slug || !item?.name) return null

  return {
    source: String(item.source || ''),
    slug: String(item.slug),
    name: String(item.name),
    originName: item.originName || item.origin_name || undefined,
    thumb: item.thumb || undefined,
    poster: item.poster || undefined,
    updatedAt: typeof item.updatedAt === 'number'
      ? item.updatedAt
      : new Date(item.updated_at || Date.now()).getTime(),
  }
}

function readLocalItems(key: string) {
  if (!import.meta.client) return []

  try {
    const raw = window.localStorage.getItem(key)
    const items = raw ? JSON.parse(raw) : []

    return Array.isArray(items)
      ? items.map(normalizeLibraryItem).filter(Boolean) as LibraryMovieItem[]
      : []
  } catch {
    return []
  }
}

function writeLocalItems(key: string, items: LibraryMovieItem[]) {
  if (!import.meta.client) return
  window.localStorage.setItem(key, JSON.stringify(items))
}

export function useMovieLibrary() {
  const { $supabase } = useNuxtApp()
  const { user } = useSupabaseAuth()

  async function loadItems(key: string, table: string, limit = 30) {
    const localItems = readLocalItems(key)

    if (user.value) {
      const { data, error } = await $supabase
        .from(table)
        .select('source, slug, name, origin_name, thumb, poster, updated_at')
        .eq('user_id', user.value.id)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        return data.map(normalizeLibraryItem).filter(Boolean) as LibraryMovieItem[]
      }
    }

    return localItems
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, limit)
  }

  async function saveItem(key: string, table: string, item: LibraryMovieItem) {
    const normalizedItem = normalizeLibraryItem({
      ...item,
      updatedAt: Date.now(),
    })

    if (!normalizedItem) return false

    const nextItems = [
      normalizedItem,
      ...readLocalItems(key).filter((savedItem) => !(savedItem.slug === normalizedItem.slug && savedItem.source === normalizedItem.source)),
    ].slice(0, 50)

    writeLocalItems(key, nextItems)

    if (user.value) {
      await $supabase
        .from(table)
        .upsert({
          user_id: user.value.id,
          source: normalizedItem.source,
          slug: normalizedItem.slug,
          name: normalizedItem.name,
          origin_name: normalizedItem.originName || null,
          thumb: normalizedItem.thumb || null,
          poster: normalizedItem.poster || null,
          updated_at: new Date(normalizedItem.updatedAt || Date.now()).toISOString(),
        }, {
          onConflict: 'user_id,source,slug',
        })
    }

    return true
  }

  async function removeItem(key: string, table: string, item: LibraryMovieItem) {
    const nextItems = readLocalItems(key)
      .filter((savedItem) => !(savedItem.slug === item.slug && savedItem.source === item.source))
    writeLocalItems(key, nextItems)

    if (user.value) {
      await $supabase
        .from(table)
        .delete()
        .eq('user_id', user.value.id)
        .eq('source', item.source)
        .eq('slug', item.slug)
    }
  }

  async function isSaved(key: string, table: string, item: LibraryMovieItem) {
    const localSaved = readLocalItems(key)
      .some((savedItem) => savedItem.slug === item.slug && savedItem.source === item.source)

    if (!user.value) return localSaved

    const { data, error } = await $supabase
      .from(table)
      .select('slug')
      .eq('user_id', user.value.id)
      .eq('source', item.source)
      .eq('slug', item.slug)
      .maybeSingle()

    return error ? localSaved : Boolean(data)
  }

  return {
    loadFavorites: (limit?: number) => loadItems(favoriteKey, 'favorite_movies', limit),
    saveFavorite: (item: LibraryMovieItem) => saveItem(favoriteKey, 'favorite_movies', item),
    removeFavorite: (item: LibraryMovieItem) => removeItem(favoriteKey, 'favorite_movies', item),
    isFavorite: (item: LibraryMovieItem) => isSaved(favoriteKey, 'favorite_movies', item),
    saveWatchLater: (item: LibraryMovieItem) => saveItem(watchLaterKey, 'watch_later_movies', item),
  }
}
