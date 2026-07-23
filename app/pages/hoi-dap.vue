<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

const faqs = [
  {
    category: 'Tổng quan',
    items: [
      { q: 'CineK là gì?', a: 'CineK là nền tảng xem phim trực tuyến miễn phí dành cho khán giả yêu thích phim Hàn Quốc. Chúng tôi tổng hợp phim từ nhiều nguồn khác nhau và cung cấp giao diện hoàn toàn bằng tiếng Việt, với phụ đề Vietsub và thuyết minh chất lượng cao.' },
      { q: 'CineK có miễn phí không?', a: 'Có, hoàn toàn miễn phí. Bạn không cần trả bất kỳ khoản phí nào để xem phim trên CineK.' },
      { q: 'Tại sao nên chọn CineK?', a: 'CineK được thiết kế riêng cho người dùng Việt Nam với giao diện đẹp mắt, tốc độ tải nhanh, không quảng cáo xâm phạm, và các tính năng hiện đại như lưu tiến trình xem, danh sách yêu thích.' },
    ],
  },
  {
    category: 'Tài khoản',
    items: [
      { q: 'Tôi có cần tạo tài khoản để xem phim không?', a: 'Không bắt buộc. Bạn có thể xem phim ngay mà không cần đăng ký. Tuy nhiên, việc tạo tài khoản sẽ giúp bạn lưu phim yêu thích, đồng bộ tiến trình xem giữa các thiết bị.' },
      { q: 'Làm sao để tạo tài khoản?', a: 'Nhấn vào biểu tượng người dùng ở góc trên bên phải, chọn "Đăng ký" và điền thông tin email cùng mật khẩu.' },
      { q: 'Tôi quên mật khẩu, làm sao để lấy lại?', a: 'Tại trang đăng nhập, nhấn "Quên mật khẩu" và nhập email đã đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu đến email của bạn.' },
    ],
  },
  {
    category: 'Xem phim',
    items: [
      { q: 'Phim có phụ đề tiếng Việt không?', a: 'Đại đa số phim trên CineK đều có phụ đề Vietsub. Một số phim còn có bản thuyết minh hoặc lồng tiếng. Bạn có thể chọn phiên bản phù hợp ngay trên trang xem phim.' },
      { q: 'Tôi không xem được phim, phải làm sao?', a: 'Hãy thử: (1) Tải lại trang, (2) Kiểm tra kết nối Internet, (3) Thử đổi server trong trình phát video, (4) Xóa bộ nhớ đệm trình duyệt. Nếu vẫn không được, nhấn "Báo lỗi" trên trang xem phim.' },
      { q: 'Làm sao để xem tiếp phim đang xem dở?', a: 'Nếu bạn đã đăng nhập, hệ thống sẽ tự động lưu tiến trình xem. Khi quay lại, bạn sẽ thấy mục "Tiếp tục xem" ngay trên trang chủ.' },
      { q: 'CineK có hỗ trợ xem trên điện thoại không?', a: 'Có. Giao diện của CineK được tối ưu hoàn toàn cho cả điện thoại, máy tính bảng, laptop và desktop.' },
    ],
  },
  {
    category: 'Tính năng',
    items: [
      { q: 'Làm sao để lưu phim vào danh sách yêu thích?', a: 'Tại trang chi tiết phim, nhấn vào biểu tượng trái tim để thêm phim vào danh sách yêu thích. Bạn có thể xem lại toàn bộ phim đã lưu trong phần Hồ sơ cá nhân.' },
      { q: 'Tìm kiếm phim hoạt động như thế nào?', a: 'Bạn có thể tìm phim bằng tên, diễn viên hoặc từ khóa. Ngoài ra, hệ thống hỗ trợ lọc nâng cao theo quốc gia, thể loại, năm sản xuất.' },
      { q: 'Làm sao để báo lỗi phim?', a: 'Tại trang xem phim, nhấn nút "Báo lỗi". Mô tả ngắn gọn lỗi bạn gặp phải. Đội ngũ sẽ kiểm tra và xử lý trong thời gian sớm nhất.' },
    ],
  },
]

const openItems = ref<Record<string, boolean>>({})

function toggle(category: string, index: number) {
  const key = `${category}-${index}`
  openItems.value[key] = !openItems.value[key]
}
</script>

<template>
  <main class="min-h-screen bg-[#0f111a] text-white">
    <AppHeader />

    <section class="mx-auto max-w-[800px] px-4 pt-24 pb-16 sm:px-6 lg:px-8 xl:px-10">
      <div class="mb-8">
        <h1 class="text-3xl font-black text-white sm:text-4xl">Hỏi & Đáp</h1>
        <p class="mt-2 text-slate-400">
          Giải đáp các câu hỏi thường gặp khi sử dụng CineK. Không tìm thấy câu trả lời?
          <NuxtLink to="/lien-he" class="text-yellow-300 hover:underline">Liên hệ chúng tôi</NuxtLink>.
        </p>
      </div>

      <div v-for="section in faqs" :key="section.category" class="mb-8">
        <h2 class="text-xl font-bold text-white mb-4">{{ section.category }}</h2>
        <div class="space-y-2">
          <div v-for="(item, index) in section.items" :key="index"
            class="rounded-xl border border-white/10 bg-[#191b24] overflow-hidden">
            <button type="button"
              class="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white hover:bg-white/5 transition"
              @click="toggle(section.category, index)">
              <span>{{ item.q }}</span>
              <ChevronDown class="size-4 shrink-0 text-slate-400 transition-transform"
                :class="openItems[`${section.category}-${index}`] ? 'rotate-180' : ''" />
            </button>
            <Transition name="faq">
              <div v-if="openItems[`${section.category}-${index}`]"
                class="px-5 pb-4 text-sm text-slate-300 leading-relaxed">
                {{ item.a }}
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.faq-enter-active,
.faq-leave-active {
  transition: opacity 0.2s ease, max-height 0.2s ease;
}
.faq-enter-from,
.faq-leave-to {
  opacity: 0;
}
</style>
