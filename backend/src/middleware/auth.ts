import type { Request, Response, NextFunction } from 'express'
import { verifyToken, getAuthUser } from '../utils/auth.js'

// Extend Express Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; role: string }
    }
  }
}

export function authenticateAdmin(req: Request, _res: Response, next: NextFunction) {
  req.user = getAuthUser(req) as any
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' })
  }
  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa đăng nhập' })
  }
  next()
}
