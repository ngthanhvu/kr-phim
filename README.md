# CineK - Tách Frontend & Backend

## Cấu trúc dự án

```
kr-phim/
├── backend/          # Express.js API server (ngược độc lập)
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── cron.ts         # Auto-sync cron task
│   │   ├── routes/         # Express route handlers
│   │   ├── middleware/       # Auth middleware
│   │   ├── utils/           # DB, auth, movies utilities
│   │   └── database/        # Drizzle schema + migrations
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── Dockerfile.prod
├── frontend/         # Nuxt 3 pure client (SSR: false)
│   ├── client/       # Toàn bộ Nuxt app ở đây
│   │   ├── app/            # Pages, components, composables, layouts
│   │   ├── public/         # Static assets (images, favicons)
│   │   ├── utils/          # API wrapper — gọi trực tiếp Express
│   │   ├── package.json
│   │   ├── nuxt.config.ts  # ssr: false + Vite proxy cho dev
│   │   ├── tsconfig.json
│   │   └── .env.example
│   └── Dockerfile.prod
├── docker/               # Shared Dockerfiles
│   └── Dockerfile.prod
├── docker-compose.yml    # Chạy cả frontend + backend cùng lúc
├── docs/                  # Tài liệu API sources
└── public/                # Shared static assets (avatars, uploads)
```

## Cài đặt

### 1. Database (MySQL)
```bash
docker run --name cinek-db \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=cinek \
  -e MYSQL_USER=cinek \
  -e MYSQL_PASSWORD=cinekpassword \
  -p 3306:3306 -d mysql:8
```

### 2. Redis
```bash
docker run --name cinek-redis \
  -p 6379:6379 -d redis:7-alpine
```

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env  # Edit nếu cần
npm run build
npm start
```

Hoặc chạy development:
```bash
npm run dev
```

### 4. Frontend Client
```bash
cd frontend/client
npm install
cp .env.example .env  # BACKEND_URL=http://localhost:4000
npm run dev
```

## Chạy với Docker Compose
```bash
# Đảm bảo MySQL và Redis đang chạy
docker compose up --build -d
```

Frontend: http://localhost:3002  
Backend API: http://localhost:4000

## Môi trường

### Backend (.env)
| Biến | Mô tả |
|------|-------|
| PORT | Cổng Express (mặc định 4000) |
| DATABASE_URL | Chuỗi kết nối MySQL |
| REDIS_URL | Chuỗi kết nối Redis |
| JWT_SECRET | Khóa ký token JWT |
| FRONTEND_URL | URL của frontend cho CORS |
| AUTO_SYNC | `true` để bật cron đồng bộ phim |
| SYNC_SOURCES | Nguồn sync: ophim,nguonc,kkphim |

### Frontend Client (.env)
| Biến | Mô tả |
|------|-------|
| BACKEND_URL | URL Express backend (dev: http://localhost:4000) |
| GIPHY_API_KEY | Key cho Giphy API |

## Lưu ý kiến trúc

- **Frontend**: SSR = `false` (pure client), không có Nitro server routes
- **API calls**: Tất cả dùng `apiFetch()` từ `~/utils/api`, gọi trực tiếp Express backend
- **Dev mode**: Vite proxy tự động chuyển `/api/*` → `http://localhost:4000`
- **Prod**: Cần nginx hoặc reverse proxy khác để chuyển hướng `/api/*` về Express
- **Auth**: Cookie-based (JWT trong cookie), CORS cho phép credentials
- **Backend cron**: Tự động đồng bộ phim Hàn Quốc hàng đêm vào lúc nửa đêm

## API Routes

Tất cả các endpoint đều có tiền tố `/api/`:

- `/api/auth/*` - Đăng nhập, đăng ký, profile...
- `/api/movies/*` - Danh sách phim, chi tiết, view count
- `/api/admin/*` - Quản trị (cần admin login)
- `/api/comments/*` - Bình luận, vote, pin
- `/api/home/sections` - Dữ liệu trang chủ
- `/api/image-proxy` - Proxy ảnh + convert WebP
- `/api/proxy-m3u8/*` - Proxy HLS stream
