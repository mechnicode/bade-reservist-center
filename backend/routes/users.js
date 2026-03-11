import { Router } from 'express'
import { create, login, profile, edit, editUserRole, getAllUsers, deleteUser } from '../controllers/users.js'
import passport from 'passport'
import { isAdmin } from '../middleware/auth.js'

const router = Router()

// 定義：當有人發送 POST 請求到 /users 時，執行 controllers 裡的 create
router.post('/', create)
router.post('/login', login)
router.get('/profile', passport.authenticate('jwt', { session: false }), profile)
router.patch('/profile', passport.authenticate('jwt', { session: false }), edit)
router.patch('/:id/role', passport.authenticate('jwt', { session: false }), isAdmin, editUserRole)
router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, getAllUsers) // New admin route for getting all users
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, deleteUser) // New admin route for deleting users

export default router
