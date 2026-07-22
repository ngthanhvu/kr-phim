# CineK

CineK là website xem phim Hàn Quốc online với giao diện dark theme, hệ thống admin quản lý phim, đăng ký/đăng nhập thành viên, và đồng bộ dữ liệu từ nhiều nguồn API.

## Tính năng

### Người dùng
- Trang chủ với hero carousel phim Hàn Quốc
- Duyệt phim theo loại (phim bộ, phim lẻ), tìm kiếm, phân trang
- Trang chi tiết phim với trình phát HLS + Nhúng
- Đăng ký / Đăng nhập tài khoản thành viên (popup modal)
- Lịch sử xem, danh sách phim yêu thích (lưu localStorage)

### Admin (`/admin`)
- Dashboard tổng quan (tổng phim, đang hiển thị, chưa hiển thị)
- Đồng bộ phim từ API (chọn nguồn: OPhim, NguonC, KKPhim)
- Bật/tắt hiển thị từng phim
- Chỉnh sửa phim: mô tả, poster, thumbnail, tập phim tuỳ chỉnh
- Quản lý thành viên: đổi role, bật/tắt, xoá tài khoản
- Xoá toàn bộ phim
- Phân quyền: chỉ role `admin` mới truy cập được

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3)
- **Styling:** Tailwind CSS 4
- **Database:** MySQL 8.0 + Drizzle ORM
- **Cache:** Redis 7
- **Auth:** JWT (bcryptjs + jsonwebtoken)
- **Icons:** Lucide Vue Next
- **Player:** HLS.js
- **Container:** Docker + Docker Compose

## Cấu trúc thư mục

```text
app/
  components/            Components dùng chung (AppHeader, AppLogo, AuthModal, AdminToggle...)
  composables/           Composables (useAuth, useMovieLibrary, useWatchHistory)
  layouts/
    admin.vue            Layout cho trang admin (sidebar + header)
  middleware/
    admin.global.ts      Middleware chặn route /admin/* nếu chưa đăng nhập admin
  pages/
    index.vue            Trang chủ
    phim/                Trang chi tiết phim
    xem/[slug].vue       Trang xem phim (player)
    thanh-vien.vue       Trang cá nhân thành viên
    yeu-thich.vue        Phim yêu thích
    lich-su.vue          Lịch sử xem
    dang-nhap.vue        Đăng nhập
    dang-ky.vue          Đăng ký
    admin/
      login.vue          Trang đăng nhập admin
      index.vue          Dashboard admin
      phim/index.vue     Quản lý phim
      phim/[id].vue      Chỉnh sửa phim
      thanh-vien.vue     Quản lý thành viên
      cai-dat.vue        Cài đặt hệ thống

server/
  api/
    movies.get.ts        API danh sách phim công khai (chỉ phim active)
    movies/[slug].get.ts API chi tiết phim công khai
    auth/                API xác thực (register, login, logout, me)
    admin/               API admin (sync, movies, thanh-vien, stats)
  database/
    schema.ts            Schema Drizzle (bảng users, movies)
    migrations/          File migration SQL
  middleware/
    auth.ts              Middleware chặn /api/admin/* nếu chưa đăng nhập admin
  utils/
    auth.ts              Tiện ích auth (hash password, JWT sign/verify)
    db.ts                Kết nối MySQL
    redis.ts             Kết nối Redis
    movies.ts            Adapter API phim + chuẩn hoá dữ liệu
```

## Setup & Chạy dự án

### Yêu cầu

- Docker & Docker Compose
- Node.js 22+ (nếu chạy ngoài Docker)

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd kr-phim
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env`:

```env
DATABASE_URL=mysql://cinek:cinekpassword@localhost:3306/cinek
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-this
```

### 3. Chạy MySQL & Redis

```bash
# Chỉ bật MySQL và Redis
docker compose up -d mysql redis
```

Hoặc chạy tất cả (app + mysql + redis):

```bash
docker compose up -d
```

#### Thông tin kết nối mặc định

| Service  | Host      | Port | User    | Password       | Database |
|----------|-----------|------|---------|----------------|----------|
| MySQL    | localhost | 3306 | cinek   | cinekpassword  | cinek    |
| MySQL    | localhost | 3306 | root    | rootpassword   | -        |
| Redis    | localhost | 6379 | -       | -              | -        |
| App      | localhost | 3002 | -       | -              | -        |

### 4. Tạo bảng database (migration)

```bash
# Tạo file migration từ schema
npx drizzle-kit generate

# Áp dụng migration vào MySQL
npx drizzle-kit migrate
```

### 5. Chạy dev server

```bash
npm run dev
```

App chạy tại `http://localhost:3002`. Hot reload tự động khi sửa code.

### 6. Tạo tài khoản admin đầu tiên

Truy cập `http://localhost:3002` → bấm **Đăng nhập** → chuyển sang tab **Đăng ký**.

Tài khoản đầu tiên đăng ký sẽ tự động được gán role **admin**.

Sau đó truy cập `http://localhost:3002/admin` để vào trang quản trị.

### 7. Đồng bộ phim

Vào **Admin → Dashboard** hoặc **Admin → Phim** → bấm **Đồng bộ từ API**.

Chọn nguồn muốn đồng bộ (OPhim, NguonC, KKPhim) → bấm **Đồng bộ**.

Mặc định phim mới đồng bộ sẽ ở trạng thái **Ẩn**. Bật từng phim để hiển thị ra trang công khai.

## Docker

### Dev mode (có hot reload)

```bash
docker compose up -d --build
```

File code được mount vào container qua volume, sửa file tự reload.

### Production build

```bash
# Build image production
docker build -t cinek .

# Chạy
docker run -p 3002:3002 \
  -e DATABASE_URL=mysql://cinek:cinekpassword@host.docker.internal:3306/cinek \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  cinek
```

### Dừng & xoá containers

```bash
docker compose down          # Dừng containers
docker compose down -v       # Dừng + xoá volumes (mất dữ liệu MySQL/Redis)
```

## Database

### Schema

**Bảng `users`:**

| Cột       | Kiểu          | Mô tả                     |
|-----------|---------------|---------------------------|
| id        | INT (PK)      | Tự tăng                   |
| name      | VARCHAR(200)  | Tên hiển thị              |
| email     | VARCHAR(255)  | Email (unique)            |
| password  | VARCHAR(255)  | Mật khẩu (bcrypt hash)    |
| role      | VARCHAR(50)   | admin / moderator / user  |
| avatar    | TEXT          | URL ảnh đại diện          |
| active    | BOOLEAN       | Trạng thái tài khoản      |
| created_at| TIMESTAMP     | Ngày tạo                  |
| updated_at| TIMESTAMP     | Ngày cập nhật             |

**Bảng `movies`:**

| Cột            | Kiểu          | Mô tả                            |
|----------------|---------------|----------------------------------|
| id             | INT (PK)      | Tự tăng                          |
| source         | VARCHAR(50)   | Nguồn (ophim/nguonc/kkphim)      |
| slug           | VARCHAR(500)  | Slug phim trên nguồn             |
| name           | VARCHAR(500)  | Tên phim                         |
| origin_name    | VARCHAR(500)  | Tên gốc                          |
| thumb/poster   | TEXT          | URL ảnh                          |
| year           | INT           | Năm sản xuất                     |
| active         | BOOLEAN       | Hiển thị trên web công khai      |
| custom_poster  | TEXT          | Poster admin tuỳ chỉnh           |
| custom_thumb   | TEXT          | Thumbnail admin tuỳ chỉnh        |
| custom_content | TEXT          | Mô tả admin tuỳ chỉnh            |
| custom_episodes| JSON          | Tập phim admin tuỳ chỉnh         |
| api_updated_at | TIMESTAMP     | Thời gian API nguồn cập nhật     |
| synced_at      | TIMESTAMP     | Thời gian đồng bộ vào DB         |

### Migration

```bash
# Tạo migration mới (sau khi sửa schema.ts)
npx drizzle-kit generate

# Áp dụng migration
npx drizzle-kit migrate
```

### Kết nối MySQL trực tiếp

```bash
# Qua Docker
docker exec -it cinek-mysql mysql -ucinek -pcinekpassword cinek

# Hoặc từ host
mysql -h 127.0.0.1 -P 3306 -ucinek -pcinekpassword cinek
```

### Kết nối Redis trực tiếp

```bash
docker exec -it cinek-redis redis-cli
```

## API Endpoints

### Công khai

| Method | Endpoint              | Mô tả                           |
|--------|-----------------------|---------------------------------|
| GET    | /api/movies           | Danh sách phim active (có cache)|
| GET    | /api/movies/[slug]    | Chi tiết phim active            |

### Xác thực

| Method | Endpoint              | Mô tả                           |
|--------|-----------------------|---------------------------------|
| POST   | /api/auth/register    | Đăng ký (tài khoản đầu = admin) |
| POST   | /api/auth/login       | Đăng nhập (trả JWT + cookie)    |
| POST   | /api/auth/logout      | Đăng xuất (xoá cookie)          |
| GET    | /api/auth/me          | Thông tin user hiện tại         |

### Admin (cần role admin)

| Method | Endpoint                    | Mô tả                         |
|--------|-----------------------------|-------------------------------|
| GET    | /api/admin/stats            | Thống kê tổng phim            |
| POST   | /api/admin/sync             | Đồng bộ phim từ API nguồn     |
| GET    | /api/admin/movies           | Danh sách tất cả phim         |
| GET    | /api/admin/movies/:id       | Chi tiết 1 phim               |
| PATCH  | /api/admin/movies/:id       | Bật/tắt phim                  |
| PUT    | /api/admin/movies/:id       | Cập nhật custom (poster, tập) |
| DELETE | /api/admin/movies           | Xoá tất cả phim               |
| GET    | /api/admin/thanh-vien       | Danh sách thành viên          |
| PATCH  | /api/admin/thanh-vien/:id   | Đổi role / bật/tắt            |
| DELETE | /api/admin/thanh-vien/:id   | Xoá thành viên                |

## Scripts

```bash
npm run dev          # Dev server (hot reload)
npm run build        # Build production
npm run preview      # Preview production build
npm run start        # Chạy production server
npm run db:generate  # Tạo migration từ schema
npm run db:migrate   # Áp dụng migration
```

## Nguồn phim

Dữ liệu phim được lấy từ 3 API nguồn:

- **OPhim** - `https://ophim1.com`
- **NguonC** - `https://phim.nguonc.com`
- **KKPhim** - `https://phimapi.com`

Chỉ lấy phim quốc gia Hàn Quốc. Dữ liệu bao gồm: tên phim, ảnh, thể loại, tập phim, link embed, link HLS.
