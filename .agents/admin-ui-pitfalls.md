# Admin Panel UI Pitfalls & Patterns

## 1. Dropdowns Inside Tables — Always Use Smart Positioning

**❌ Đừng bao giờ viết cứng** `top-full mt-1` hoặc `bottom-full mb-1` cho dropdown trong table:

```vue
<!-- SAI — luôn mở xuống dưới, bị cắt ở hàng cuối -->
<div class="absolute right-0 top-full z-50 mt-1 bg-white">

<!-- SAI — luôn mở lên trên, che hàng đầu -->
<div class="absolute right-0 bottom-full mb-1 z-50 bg-white">
```

**✅ Đúng — dùng computed position dựa trên index:**

```ts
// Helper để dropdown luôn hiển thị bên trong vùng nhìn thấy
function getDropdownPosition(index: number) {
  const total = items.value?.length || 0
  // Chỉ mở lên trên khi còn ít nhất 2 hàng phía dưới
  if (total <= 2 || index < total - 2) {
    return 'top-full mt-1'
  }
  return 'bottom-full mb-1'
}
```

```vue
<template>
  <td class="px-4 py-3.5 text-center relative">
    <div class="inline-flex">
      <button @click="menuOpen = menuOpen === id ? null : id">
        <AppIcon name="ellipsis-vertical" />
      </button>
      <Transition name="dropdown-fade">
        <div v-if="menuOpen === id" :class="[
          'absolute right-0 min-w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50',
          getDropdownPosition(items.indexOf(item))
        ]">
          <!-- content -->
        </div>
      </Transition>
    </div>
  </td>
</template>
```

### Rule Checklist:
- [ ] Mỗi cell có dropdown cần `relative` wrapper
- [ ] Hàm `getDropdownPosition` nhận index từ `items.indexOf(item)`
- [ ] Dùng dynamic class binding, KHÔNG hardcode vị trí
- [ ] Kiểm tra khi item nằm ở hàng cuối cùng của bảng

---

## 2. Table Clipping — Remove `overflow-hidden` on Card Wrappers

Khi table có dropdown/menu, `.admin-card overflow-hidden` sẽ cắt mất dropdown khi nó mở ra ngoài vùng chứa.

**✅ Luôn bỏ `overflow-hidden` hoặc override bằng `overflow-visible!`:**

```vue
<!-- Đúng — dropdown không bị cắt -->
<div class="admin-card overflow-visible!">
```

> **Lưu ý Tailwind v4 syntax**: dùng `overflow-visible!` chứ KHÔNG phải `!overflow-visible`. Linter sẽ báo lỗi nếu viết sai.

---

## 3. Admin Light Mode — Hardcoded Colors Need Override

Các component admin dùng hardcode màu dark mode (`bg-[#131418]`, `text-white`, `border-white/6`) không tự động chuyển khi xem trong light mode. Cần xử lý theo thứ tự ưu tiên:

### Thứ tự xử lý đúng:

1. **Preference 1**: Đổi trực tiếp template sang light-mode colors (`bg-white`, `border-slate-200`, `text-slate-900`)
2. **Preference 2**: Thêm rule CSS vào `.agents/admin-light-palette.md` nếu nhiều nơi share style
3. **Last resort**: Dùng CSS selector override trong layout `<style>` — nhưng chỉ cho teleported elements (modal/dialog teleport ra body)

**❌ Không làm**: Viết CSS selector phức tạp như `[class*="bg-"][class*="#131418"]` — khó maintain và dễ break.

**✅ Làm**: Thay màu trong template ngay từ đầu:

```vue
<!-- Dark mode (default) -->
<div class="bg-[#131418] border-white/6 text-white">

<!-- Light mode — nên code sẵn hai bộ màu hoặc toggle -->
<div class="dark:bg-[#131418] dark:border-white/6 dark:text-white
             bg-white border-slate-200 text-slate-900">
```

> **Quy tắc**: Nếu class đã hardcode giá trị hex/dark theme, đó là bug waiting to happen trong light mode. Code luôn với cả 2 palette hoặc dùng utility classes Tailwind chuẩn.

---

## 4. Admin Toggle Button — Use Brand Color

Component `AdminToggle.vue` cần dùng màu brand `#095DF2` (CineK Blue):

```vue
:class="model ? 'bg-[#095DF2]' : 'bg-slate-600'"
focus:ring-[#095DF2]/50
```

Không dùng vàng (`yellow-400`), xanh lá, hay bất kỳ màu nào khác cho state active.

---

## 5. Admin Sort Icons — Yellow → Blue

Sort icons đang sort phải dùng màu brand `#095DF2`:

```vue
:class="sortBy === 'column' ? 'text-[#095DF2]' : 'opacity-50'"
```

Không dùng `text-yellow-400`. Tương tự cho pagination active state.

---

## 6. Common Pattern Reference

| Component | Class Pattern | Notes |
|-----------|--------------|-------|
| Sort icon active | `text-[#095DF2]` | Not yellow |
| Pagination active | `border-[#095DF2] bg-[#095DF2] text-white` | Center text white |
| Dropdown bg | `bg-white border-slate-200` | For light mode compatibility |
| Dropdown hover | `hover:bg-slate-100` | Not `hover:bg-white/5` |
| Delete menu item | `text-red-500 hover:bg-red-50` | Red-500 for light mode |
| Table header border | `border-bottom: 3px solid #eeee` | Inline style for precise control |
| Table row divider | `divide-y divide-[#eeee]` | Light gray separator |
| Cell padding | `px-4 py-3.5` | Consistent across all admin tables |
