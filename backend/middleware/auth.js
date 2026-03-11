import passport from 'passport'
import { StatusCodes } from 'http-status-codes'

export const jwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器錯誤',
      })
    }
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: info.message || '未授權',
      })
    }
    req.user = user
    next()
  })(req, res, next)
}

export const isAdmin = (req, res, next) => {
  if (req.user.role !== 1 && req.user.role !== 2) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: '沒有權限',
    })
  }
  next()
}

export const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 2) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: '沒有最高管理員權限',
    })
  }
  next()
}
