import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { startCronSync, stopCronSync } from './cron.js'
import authRoutes from './routes/auth.js'
import moviesRoutes from './routes/movies.js'
import adminRoutes from './routes/admin.js'
import commentsRoutes from './routes/comments.js'
import homeRoutes from './routes/home.js'
import { imageProxy } from './routes/image-proxy.js'
import { m3u8Proxy } from './routes/proxy-m3u8.js'
import { requireAdmin, authenticateAdmin } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Trust proxy
app.set('trust proxy', 1)

// Auth middleware - add user to request context
app.use('/api', authenticateAdmin)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/movies', moviesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/home', homeRoutes)

// Image proxy (no auth needed)
app.use('/api/image-proxy', imageProxy)

// M3U8 proxy (no auth needed)
app.use('/api/proxy-m3u8/', m3u8Proxy)

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Express] Server error:', err.stack)
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'Internal Server Error'
  res.setHeader('access-control-allow-origin', process.env.FRONTEND_URL || 'http://localhost:3002')
  res.status(statusCode).json({ message })
})

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const HOST = process.env.HOST || '0.0.0.0'

// Start server
const server = app.listen(Number(PORT), HOST, () => {
  console.log(`[Backend] Express server running on http://${HOST}:${PORT}`)
  console.log(`[Backend] Database URL: ${process.env.DATABASE_URL ? '***' : 'not set'}`)
  console.log(`[Backend] Redis URL: ${process.env.REDIS_URL ? '***' : 'not set'}`)
  
  // Start cron sync if enabled
  startCronSync()
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Backend] Shutting down...')
  stopCronSync()
  server.close(() => process.exit(0))
})

process.on('SIGTERM', async () => {
  console.log('\n[Backend] Shutting down...')
  stopCronSync()
  server.close(() => process.exit(0))
})

export default app
