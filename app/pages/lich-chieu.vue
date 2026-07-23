<script setup lang="ts">
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { data, pending, error } = await useFetch('/api/movies', {
  query: { page: 1 },
})

const movies = computed(() => data.value?.items ?? [])
const activeDate = ref('')

function comparableMovieText(value?: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueMovies(items: any[]) {
  const seen = new Set<string>()
  const uniqueItems: any[] = []
  for (const item of items) {
    const keys = [
      comparableMovieText(item.slug),
      comparableMovieText(item.originName),
      comparableMovieText(item.name),
    ].filter(Boolean)
    if (keys.some((key) => seen.has(key))) continue
    keys.forEach((key) => seen.add(key))
    uniqueItems.push(item)
  }
  return uniqueItems
}

function movieDate(value?: string) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function dateKeyOf(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function movieDateKey(value?: string) {
  const date = movieDate(value)
  return date ? dateKeyOf(date) : ''
}

function formatDateLabel(dateKey: string) {
  const [, month, day] = dateKey.split('-')
  return `${day}/${month}`
}

function formatWeekday(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`)
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return weekdays[date.getDay()] || ''
}

function getEpisodeDisplay(movie: any) {
  const ep = movie?.episode
  const total = movie?.episodeTotal
  if (!ep) return 'Mới cập nhật'

  const totalNum = total ? total.replace(/[^0-9]/g, '') : ''
  const epNum = ep.replace(/[^0-9]/g, '')

  if (epNum && totalNum && epNum !== totalNum) {
    return `Tập ${epNum}/${totalNum}`
  }

  return ep
}

// Build map ngày -> phim
const moviesByDate = computed(() => {
  const map = new Map<string, any[]>()
  const sorted = [...uniqueMovies(movies.value)]
    .sort((a: any, b: any) => (movieDate(b.updatedAt)?.getTime() || 0) - (movieDate(a.updatedAt)?.getTime() || 0))
  for (const movie of sorted) {
    const key = movieDateKey(movie.updatedAt)
    if (!key) continue
    map.set(key, [...(map.get(key) || []), movie])
  }
  return map
})

// 7 ngày: 1 ngày trước hôm nay + hôm nay + 5 ngày sau
const scheduleDays = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: { date: string, label: string, weekday: string, items: any[] }[] = []
  for (let i = -1; i <= 5; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const key = dateKeyOf(d)
    days.push({
      date: key,
      label: formatDateLabel(key),
      weekday: formatWeekday(key),
      items: (moviesByDate.value.get(key) || []).slice(0, 64),
    })
  }
  return days
})

const selectedDate = computed({
  get() {
    if (activeDate.value) return activeDate.value
    const today = dateKeyOf(new Date())
    return scheduleDays.value.find((d) => d.date === today)?.date || scheduleDays.value[0]?.date || ''
  },
  set(value: string) {
    activeDate.value = value
  },
})

const selectedDay = computed(() => scheduleDays.value.find((day) => day.date === selectedDate.value))
const selectedDayIndex = computed(() => scheduleDays.value.findIndex((day) => day.date === selectedDate.value))

function selectPreviousDay() {
  const previousDay = scheduleDays.value[selectedDayIndex.value - 1]
  if (previousDay) selectedDate.value = previousDay.date
}

function selectNextDay() {
  const nextDay = scheduleDays.value[selectedDayIndex.value + 1]
  if (nextDay) selectedDate.value = nextDay.date
}

useHead({
  title: 'Lịch cập nhật phim - CineK',
  meta: [
    {
      name: 'description',
      content: 'Theo dõi lịch cập nhật phim Hàn Quốc mới trên CineK, xem nhanh các tập phim và nội dung mới theo từng ngày.',
    },
    {
      property: 'og:title',
      content: 'Lịch cập nhật phim - CineK',
    },
    {
      property: 'og:description',
      content: 'Lịch phim Hàn Quốc mới cập nhật theo ngày, giúp bạn không bỏ lỡ tập mới và phim mới trên CineK.',
    },
  ],
})
</script>

<template>
  <main class="schedule-page">
    <AppHeader />

    <section class="schedule-shell">
      <div class="schedule-heading">
        <CalendarDays class="schedule-heading-icon" />
        <h1 class="text-2xl font-black sm:text-3xl">Lịch chiếu</h1>
      </div>

      <p v-if="error" class="rounded-md border border-red-300/30 bg-red-500/12 p-4 text-red-100">
        Không tải được dữ liệu lịch chiếu. Vui lòng thử lại sau.
      </p>

      <div v-if="pending" class="schedule-loading">
        <div class="schedule-tabs">
          <div v-for="item in 7" :key="item" class="schedule-day-tab is-loading" />
        </div>
        <div class="schedule-card-grid">
          <div v-for="item in 16" :key="item" class="schedule-card is-loading" />
        </div>
      </div>

      <template v-else>
        <div class="schedule-tabs-wrap">
          <button v-if="selectedDayIndex > 0" type="button"
            class="schedule-arrow schedule-arrow-left"
            aria-label="Ngày trước" @click="selectPreviousDay">
            <ChevronLeft />
          </button>

          <div class="schedule-tabs">
            <button v-for="day in scheduleDays" :key="day.date" type="button"
              class="schedule-day-tab"
              :class="{ active: day.date === selectedDate }"
              @click="selectedDate = day.date">
              <span class="schedule-day-date">{{ day.label }}</span>
              <span class="schedule-day-name">{{ day.weekday }}</span>
            </button>
          </div>

          <button v-if="selectedDayIndex < scheduleDays.length - 1" type="button"
            class="schedule-arrow schedule-arrow-right"
            aria-label="Ngày sau" @click="selectNextDay">
            <ChevronRight />
          </button>
        </div>

        <div v-if="selectedDay?.items?.length" class="schedule-list">
          <div class="schedule-card-grid">
            <NuxtLink v-for="movie in selectedDay.items" :key="`${movie.source}-${movie.slug}`"
              :to="{ path: `/phim/${movie.slug}`, query: { source: movie.source } }"
              class="schedule-card">
              <img :src="movie.poster || movie.thumb" :alt="movie.name"
                class="schedule-card-image">
              <div class="schedule-card-body">
                <h2 class="schedule-card-title">
                  {{ movie.name }}
                </h2>
                <p class="schedule-card-episode">
                  {{ getEpisodeDisplay(movie) }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>

        <div v-else class="schedule-empty">
          <CalendarDays />
          <p class="mt-4 text-sm text-slate-400">Chưa có phim nào trong ngày này.</p>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.schedule-page {
  min-height: 100vh;
  background: #020617;
  color: #fff;
}

.schedule-shell {
  width: min(1360px, calc(100vw - 96px));
  margin: 0 auto;
  padding: 128px 0 64px;
}

.schedule-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.schedule-heading-icon {
  width: 28px;
  height: 28px;
  color: #fff;
}

.schedule-heading h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
}

.schedule-loading {
  display: grid;
  gap: 40px;
}

.schedule-tabs-wrap {
  position: relative;
  margin-bottom: 48px;
}

.schedule-tabs {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.schedule-day-tab {
  height: 92px;
  min-width: 0;
  border: 0;
  border-top: 2px solid transparent;
  background: rgba(255, 255, 255, 0.045);
  color: #fff;
  cursor: pointer;
  padding: 18px 20px;
  text-align: left;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.schedule-day-tab:hover {
  background: rgba(255, 255, 255, 0.075);
}

.schedule-day-tab.active {
  border-top-color: #facc15;
  background: rgba(255, 255, 255, 0.09);
}

.schedule-day-date {
  display: block;
  color: #95a0ad;
  font-size: 14px;
  font-weight: 600;
}

.schedule-day-name {
  display: block;
  margin-top: 16px;
  color: #fff;
  font-size: 21px;
  font-weight: 900;
  line-height: 1;
}

.schedule-day-tab.active .schedule-day-name {
  color: #facc15;
}

.schedule-arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.9));
  transform: translateY(-50%);
  transition: transform 0.18s ease;
}

.schedule-arrow:hover {
  transform: translateY(-50%) scale(1.08);
}

.schedule-arrow svg {
  width: 54px;
  height: 54px;
  stroke-width: 3.4;
}

.schedule-arrow-left {
  left: -68px;
}

.schedule-arrow-right {
  right: -68px;
}

.schedule-list {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 28px;
}

.schedule-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.schedule-card {
  display: flex;
  height: 108px;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: #383b43;
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.12);
  color: #fff;
  text-decoration: none;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.schedule-card:hover {
  border-color: rgba(125, 211, 252, 0.42);
  background: #424650;
  transform: translateY(-2px);
}

.schedule-card-image {
  display: block;
  width: 58px !important;
  height: 84px !important;
  flex: 0 0 58px;
  border-radius: 5px;
  object-fit: cover;
}

.schedule-card-body {
  min-width: 0;
  flex: 1;
}

.schedule-card-title {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
}

.schedule-card-episode {
  overflow: hidden;
  margin: 12px 0 0;
  color: #a7adb7;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-empty {
  display: flex;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #a7adb7;
  text-align: center;
}

.schedule-empty svg {
  width: 40px;
  height: 40px;
  margin-bottom: 16px;
  color: #fde047;
}

.schedule-empty p {
  margin: 0;
}

.schedule-day-tab.is-loading,
.schedule-card.is-loading {
  pointer-events: none;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  background-size: 220% 100%;
  animation: schedule-shimmer 1.2s ease-in-out infinite;
}

@keyframes schedule-shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 1500px) {
  .schedule-shell {
    width: calc(100vw - 80px);
  }

  .schedule-arrow-left {
    left: -48px;
  }

  .schedule-arrow-right {
    right: -48px;
  }
}

@media (max-width: 1180px) {
  .schedule-tabs {
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .schedule-day-tab {
    flex: 0 0 188px;
  }

  .schedule-arrow {
    display: none;
  }

  .schedule-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .schedule-shell {
    width: calc(100vw - 30px);
    padding: 92px 0 40px;
  }

  .schedule-heading {
    gap: 12px;
    margin-bottom: 38px;
  }

  .schedule-heading-icon {
    width: 30px;
    height: 30px;
  }

  .schedule-heading h1 {
    font-size: 26px;
  }

  .schedule-tabs-wrap {
    margin-bottom: 64px;
  }

  .schedule-tabs {
    gap: 16px;
    margin: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .schedule-tabs::-webkit-scrollbar {
    display: none;
  }

  .schedule-day-tab {
    height: 79px;
    flex: 0 0 92px;
    padding: 18px 20px 14px;
  }

  .schedule-day-date {
    font-size: 13px;
  }

  .schedule-day-name {
    margin-top: 12px;
    font-size: 16px;
    white-space: nowrap;
  }

  .schedule-card-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .schedule-list {
    padding-top: 28px;
  }

  .schedule-card {
    height: 126px;
    gap: 22px;
    padding: 14px;
    border-radius: 14px;
  }

  .schedule-card-image {
    width: 65px !important;
    height: 96px !important;
    flex-basis: 65px;
  }

  .schedule-card-title {
    font-size: 14px;
    line-height: 1.35;
  }

  .schedule-card-episode {
    margin-top: 14px;
    font-size: 12px;
  }
}
</style>
