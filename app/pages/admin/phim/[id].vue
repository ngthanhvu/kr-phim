<script setup lang="ts">
import { ArrowLeft, Check, Film, Image, Plus, Save, Trash2, Type } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const movieId = Number(route.params.id)

const { data: movie, refresh } = await useFetch(`/api/admin/movies/${movieId}`)

useHead({
  title: computed(() => movie.value ? `Chỉnh sửa: ${movie.value.name} - CineK Admin` : 'Chỉnh sửa phim - CineK Admin'),
})

const customPoster = ref('')
const customThumb = ref('')
const customContent = ref('')
const customEpisodes = ref<{ name: string, linkEmbed: string, linkM3u8: string }[]>([])
const saving = ref(false)
const saved = ref(false)

watch(movie, (m) => {
  if (m) {
    customPoster.value = m.customPoster || ''
    customThumb.value = m.customThumb || ''
    customContent.value = m.customContent || ''
    customEpisodes.value = m.customEpisodes?.length
      ? m.customEpisodes.map((ep: any) => ({ name: ep.name || '', linkEmbed: ep.linkEmbed || '', linkM3u8: ep.linkM3u8 || '' }))
      : []
  }
}, { immediate: true })

function addEpisode() {
  customEpisodes.value.push({ name: '', linkEmbed: '', linkM3u8: '' })
}

function removeEpisode(index: number) {
  customEpisodes.value.splice(index, 1)
}

async function handleSave() {
  saving.value = true
  saved.value = false
  try {
    await $fetch(`/api/admin/movies/${movieId}`, {
      method: 'PUT',
      body: {
        customPoster: customPoster.value,
        customThumb: customThumb.value,
        customContent: customContent.value,
        customEpisodes: customEpisodes.value,
      },
    })
    saved.value = true
    await refresh()
    setTimeout(() => { saved.value = false }, 2500)
  } catch (err) {
    console.error('Save failed:', err)
  } finally {
    saving.value = false
  }
}

function clearField(field: 'customPoster' | 'customThumb' | 'customContent') {
  if (field === 'customPoster') customPoster.value = ''
  if (field === 'customThumb') customThumb.value = ''
  if (field === 'customContent') customContent.value = ''
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/phim"
      class="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
      <ArrowLeft class="size-4" />
      Quay lại danh sách phim
    </NuxtLink>

    <div v-if="!movie" class="rounded-xl border border-white/10 bg-slate-900/50 p-12 text-center">
      <p class="text-slate-400">Đang tải...</p>
    </div>

    <div v-else>
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-black text-white">{{ movie.name }}</h1>
          <p class="mt-1 text-sm text-slate-400">
            {{ movie.originName }} · {{ movie.source?.toUpperCase() }} · {{ movie.year || 'N/A' }}
          </p>
        </div>
        <button type="button"
          class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
          :disabled="saving" @click="handleSave">
          <Save class="size-4" />
          {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
        </button>
      </div>

      <Transition name="fade">
        <div v-if="saved"
          class="mb-4 flex items-center gap-2 rounded-lg border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm font-semibold text-green-400">
          <Check class="size-4" />
          Đã lưu thành công
        </div>
      </Transition>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="space-y-6">
          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="grid size-9 place-items-center rounded-lg bg-blue-400/10">
                <Type class="size-4 text-blue-400" />
              </div>
              <div>
                <h2 class="text-base font-black text-white">Mô tả phim</h2>
                <p class="text-xs text-slate-400">Để trống để dùng mô tả từ API nguồn</p>
              </div>
            </div>
            <textarea v-model="customContent" rows="8" placeholder="Nhập mô tả phim..."
              class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50" />
            <button v-if="customContent" type="button"
              class="mt-2 text-xs font-semibold text-red-400 transition hover:text-red-300"
              @click="clearField('customContent')">
              Xoá mô tả tuỳ chỉnh
            </button>
          </div>

          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="grid size-9 place-items-center rounded-lg bg-amber-400/10">
                <Film class="size-4 text-amber-400" />
              </div>
              <div class="flex-1">
                <h2 class="text-base font-black text-white">Tập phim tuỳ chỉnh</h2>
                <p class="text-xs text-slate-400">Thêm tập phim thủ công khi API thiếu tập hoặc link bị die. Để trống tất cả để dùng từ API.</p>
              </div>
              <button type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
                @click="addEpisode">
                <Plus class="size-3.5" />
                Thêm tập
              </button>
            </div>

            <div v-if="customEpisodes.length" class="space-y-3">
              <div v-for="(ep, index) in customEpisodes" :key="index"
                class="rounded-lg border border-white/10 bg-white/5 p-4">
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-xs font-black uppercase text-slate-400">Tập {{ index + 1 }}</span>
                  <button type="button"
                    class="grid size-7 place-items-center rounded-lg text-red-400 transition hover:bg-red-400/10"
                    @click="removeEpisode(index)">
                    <Trash2 class="size-3.5" />
                  </button>
                </div>
                <div class="space-y-2">
                  <input v-model="ep.name" type="text" placeholder="Tên tập (vd: Tập 1, Full, Preview...)"
                    class="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                  <input v-model="ep.linkEmbed" type="url" placeholder="Link embed (iframe)"
                    class="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                  <input v-model="ep.linkM3u8" type="url" placeholder="Link HLS (.m3u8)"
                    class="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                </div>
              </div>
            </div>
            <div v-else class="rounded-lg border border-dashed border-white/10 p-6 text-center">
              <p class="text-sm text-slate-500">Chưa có tập tuỳ chỉnh. Bấm "Thêm tập" để bắt đầu.</p>
            </div>
          </div>

          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="grid size-9 place-items-center rounded-lg bg-purple-400/10">
                <Image class="size-4 text-purple-400" />
              </div>
              <div>
                <h2 class="text-base font-black text-white">Ảnh poster</h2>
                <p class="text-xs text-slate-400">URL ảnh poster (để trống dùng từ API)</p>
              </div>
            </div>
            <input v-model="customPoster" type="url" placeholder="https://..."
              class="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
            <div v-if="customPoster || movie.poster" class="mt-3">
              <img :src="customPoster || movie.poster" :alt="movie.name"
                class="h-48 w-auto rounded-lg object-cover ring-1 ring-white/10">
            </div>
            <button v-if="customPoster" type="button"
              class="mt-2 text-xs font-semibold text-red-400 transition hover:text-red-300"
              @click="clearField('customPoster')">
              Xoá poster tuỳ chỉnh
            </button>
          </div>

          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="grid size-9 place-items-center rounded-lg bg-pink-400/10">
                <Image class="size-4 text-pink-400" />
              </div>
              <div>
                <h2 class="text-base font-black text-white">Ảnh thumbnail</h2>
                <p class="text-xs text-slate-400">URL ảnh thumbnail (để trống dùng từ API)</p>
              </div>
            </div>
            <input v-model="customThumb" type="url" placeholder="https://..."
              class="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
            <div v-if="customThumb || movie.thumb" class="mt-3">
              <img :src="customThumb || movie.thumb" :alt="movie.name"
                class="h-32 w-auto rounded-lg object-cover ring-1 ring-white/10">
            </div>
            <button v-if="customThumb" type="button"
              class="mt-2 text-xs font-semibold text-red-400 transition hover:text-red-300"
              @click="clearField('customThumb')">
              Xoá thumbnail tuỳ chỉnh
            </button>
          </div>
        </div>

        <aside class="space-y-4">
          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <h3 class="mb-3 text-sm font-black uppercase text-slate-400">Thông tin gốc</h3>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500">Nguồn</dt>
                <dd class="font-semibold text-white">{{ movie.source?.toUpperCase() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Slug</dt>
                <dd class="truncate text-white">{{ movie.slug }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Năm</dt>
                <dd class="text-white">{{ movie.year || '—' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Tập</dt>
                <dd class="text-white">{{ movie.episode || '—' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Chất lượng</dt>
                <dd class="text-white">{{ movie.quality || '—' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Trạng thái</dt>
                <dd :class="movie.active ? 'text-green-400' : 'text-slate-400'">
                  {{ movie.active ? 'Đang hiển thị' : 'Ẩn' }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Đồng bộ</dt>
                <dd class="text-white">{{ new Date(movie.syncedAt).toLocaleDateString('vi-VN') }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="movie.categories?.length" class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <h3 class="mb-3 text-sm font-black uppercase text-slate-400">Thể loại</h3>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="cat in movie.categories" :key="cat"
                class="rounded-full bg-white/8 px-2.5 py-1 text-xs font-semibold text-slate-300">
                {{ cat }}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
