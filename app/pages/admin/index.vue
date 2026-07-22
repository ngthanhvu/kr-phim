<script setup lang="ts">
import { BarChart3, Film, RefreshCw, TrendingUp, X } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Dashboard - CineK Admin',
})

const { data: stats, refresh } = await useFetch('/api/admin/stats')
const syncing = ref(false)
const syncOpen = ref(false)
const syncSources = ref({ ophim: true, nguonc: true, kkphim: true })

async function handleSync() {
  const sources = Object.entries(syncSources.value)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)

  if (!sources.length) return

  syncing.value = true
  try {
    await $fetch('/api/admin/sync', {
      method: 'POST',
      body: { sources },
    })
    syncOpen.value = false
    await refresh()
  } catch (err) {
    console.error('Sync failed:', err)
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-400">Tổng quan hệ thống CineK</p>
      </div>
      <button type="button"
        class="inline-flex h-10 items-center gap-2 rounded-lg bg-yellow-400 px-4 text-sm font-black text-slate-950 transition hover:bg-yellow-300"
        @click="syncOpen = true">
        <RefreshCw class="size-4" />
        Đồng bộ phim
      </button>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-white/20">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400">Tổng phim</p>
            <p class="mt-2 text-3xl font-black text-white">{{ stats?.total?.toLocaleString() || 0 }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-xl bg-yellow-400/10 text-yellow-400">
            <Film class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-white/20">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400">Phim đang hiển thị</p>
            <p class="mt-2 text-3xl font-black text-green-400">{{ stats?.active?.toLocaleString() || 0 }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-xl bg-green-400/10 text-green-400">
            <TrendingUp class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-white/20">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400">Phim chưa hiển thị</p>
            <p class="mt-2 text-3xl font-black text-slate-400">{{ stats?.inactive?.toLocaleString() || 0 }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-xl bg-slate-400/10 text-slate-400">
            <BarChart3 class="size-5" />
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="syncOpen" class="fixed inset-0 z-70 grid place-items-center px-3">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="syncOpen = false" />
          <div class="relative w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button type="button"
              class="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-white transition hover:bg-white/10"
              @click="syncOpen = false">
              <X class="size-5" />
            </button>

            <h2 class="text-xl font-black text-white">Đồng bộ phim</h2>
            <p class="mt-1 text-sm text-slate-400">Chọn nguồn để đồng bộ phim vào hệ thống</p>

            <div class="mt-5 space-y-3">
              <label class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">OPhim</p>
                  <p class="text-xs text-slate-400">ophim1.com</p>
                </div>
                <AdminToggle v-model="syncSources.ophim" />
              </label>

              <label class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">NguonC</p>
                  <p class="text-xs text-slate-400">phim.nguonc.com</p>
                </div>
                <AdminToggle v-model="syncSources.nguonc" />
              </label>

              <label class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">KKPhim</p>
                  <p class="text-xs text-slate-400">phimapi.com</p>
                </div>
                <AdminToggle v-model="syncSources.kkphim" />
              </label>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button"
                class="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                @click="syncOpen = false">
                Huỷ
              </button>
              <button type="button"
                class="inline-flex h-10 items-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
                :disabled="syncing || !Object.values(syncSources).some(Boolean)"
                @click="handleSync">
                <RefreshCw class="size-4" :class="syncing ? 'animate-spin' : ''" />
                {{ syncing ? 'Đang đồng bộ...' : 'Đồng bộ' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
