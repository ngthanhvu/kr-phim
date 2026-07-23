<template>
  <main class="min-h-screen bg-[#0f111a] text-white">
    <AppHeader />

    <section class="mx-auto max-w-[800px] px-4 pt-24 pb-16 sm:px-6 lg:px-8 xl:px-10">
      <h1 class="text-3xl font-black text-white mb-6">Chính sách bảo mật</h1>

      <div class="space-y-6 text-sm text-slate-300 leading-relaxed">
        <div class="rounded-xl border border-white/10 bg-[#191b24] p-6">
          <h2 class="text-lg font-bold text-white mb-3">1. Thu thập thông tin</h2>
          <p>
            CineK chỉ thu thập các thông tin cần thiết để cung cấp dịch vụ: email khi đăng ký tài khoản, lịch sử xem để lưu tiến trình, và danh sách phim yêu thích. Chúng tôi không thu thập thông tin cá nhân nhạy cảm.
          </p>
        </div>

        <div class="rounded-xl border border-white/10 bg-[#191b24] p-6">
          <h2 class="text-lg font-bold text-white mb-3">2. Sử dụng thông tin</h2>
          <p>
            Thông tin thu thập được sử dụng để: cung cấp và cải thiện dịch vụ, lưu tiến trình xem, đồng bộ danh sách yêu thích giữa các thiết bị, và gửi thông báo về phim mới (nếu bạn đăng ký).
          </p>
        </div>

        <div class="rounded-xl border border-white/10 bg-[#191b24] p-6">
          <h2 class="text-lg font-bold text-white mb-3">3. Chia sẻ thông tin</h2>
          <p>
            CineK không bán, chia sẻ hoặc tiết lộ thông tin cá nhân của bạn cho bên thứ ba, trừ khi có yêu cầu từ cơ quan pháp luật có thẩm quyền.
          </p>
        </div>

        <div class="rounded-xl border border-white/10 bg-[#191b24] p-6">
          <h2 class="text-lg font-bold text-white mb-3">4. Bảo mật dữ liệu</h2>
          <p>
            Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn để bảo vệ thông tin người dùng, bao gồm mã hóa mật khẩu và kết nối HTTPS.
          </p>
        </div>

        <div class="rounded-xl border border-white/10 bg-[#191b24] p-6">
          <h2 class="text-lg font-bold text-white mb-3">5. Cookie</h2>
          <p>
            CineK sử dụng cookie để lưu phiên đăng nhập và tùy chọn người dùng. Bạn có thể tắt cookie trong trình duyệt nhưng một số tính năng có thể không hoạt động đúng.
          </p>
        </div>

        <p class="text-slate-500">
          Cập nhật lần cuối: Tháng 7, 2026. Nếu có thắc mắc, vui lòng <NuxtLink to="/lien-he" class="text-yellow-300 hover:underline">liên hệ chúng tôi</NuxtLink>.
        </p>
      </div>
    </section>
  </main>
</template>
