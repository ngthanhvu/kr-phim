<script setup lang="ts">
import { Film, Globe2, Heart, Play, Shield, Zap } from 'lucide-vue-next'

const features = [
  { icon: Play, title: 'Kho phim khổng lồ', desc: 'Tổng hợp phim Hàn Quốc từ nhiều nguồn, cập nhật liên tục mỗi ngày.' },
  { icon: Shield, title: 'Miễn phí 100%', desc: 'Xem phim hoàn toàn miễn phí, không cần trả bất kỳ khoản phí nào.' },
  { icon: Zap, title: 'Tốc độ nhanh', desc: 'Trình phát video mượt mà, hỗ trợ đa server, không quảng cáo xâm phạm.' },
  { icon: Heart, title: 'Lưu tiến trình', desc: 'Tự động lưu tiến trình xem, danh sách yêu thích đồng bộ giữa các thiết bị.' },
  { icon: Globe2, title: 'Đa ngôn ngữ', desc: 'Hỗ trợ Vietsub, thuyết minh, lồng tiếng cho đa số phim.' },
  { icon: Film, title: 'Chất lượng cao', desc: 'Phim HD, Full HD, chất lượng hình ảnh và âm thanh tốt nhất.' },
]
</script>

<template>
  <main class="min-h-screen bg-[#0f111a] text-white">
    <AppHeader />

    <section class="mx-auto max-w-[1000px] px-4 pt-24 pb-16 sm:px-6 lg:px-8 xl:px-10">
      <!-- Hero -->
      <div class="text-center mb-12">
        <h1 class="text-3xl sm:text-5xl font-black text-white mb-4">Giới thiệu về CineK</h1>
        <p class="text-lg text-slate-400 max-w-2xl mx-auto">
          CineK - Nền tảng xem phim Hàn Quốc online chất lượng cao, miễn phí, trải nghiệm mượt mà trên mọi thiết bị.
        </p>
      </div>

      <!-- Features -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div v-for="f in features" :key="f.title"
          class="rounded-xl border border-white/10 bg-[#191b24] p-6 transition hover:border-white/20">
          <div class="grid size-12 place-items-center rounded-xl bg-yellow-400/10 text-yellow-400 mb-4">
            <component :is="f.icon" class="size-6" />
          </div>
          <h3 class="text-lg font-bold text-white mb-2">{{ f.title }}</h3>
          <p class="text-sm text-slate-400 leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>

      <!-- About -->
      <div class="rounded-xl border border-white/10 bg-[#191b24] p-6 sm:p-8">
        <h2 class="text-2xl font-bold text-white mb-4">Về CineK</h2>
        <div class="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            CineK được xây dựng dành riêng cho khán giả Việt Nam yêu thích phim Hàn Quốc. Chúng tôi tổng hợp phim từ nhiều nguồn khác nhau và cung cấp giao diện hoàn toàn bằng tiếng Việt, với phụ đề Vietsub và thuyết minh chất lượng cao.
          </p>
          <p>
            CineK không lưu trữ bất kỳ tệp phim nào trên máy chủ. Chúng tôi chỉ nhúng và hiển thị nội dung từ các nguồn công khai trên Internet.
          </p>
          <p>
            Với giao diện đẹp mắt, tốc độ tải nhanh và các tính năng hiện đại như lưu tiến trình xem, danh sách yêu thích, CineK mang đến trải nghiệm xem phim tốt nhất cho người dùng Việt Nam.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
