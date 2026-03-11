import { Router } from 'express'
import { create, getAll, update, remove } from '../controllers/categories.js'
import { jwt, isAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/', jwt, isAdmin, create)
router.get('/', getAll) // Public access to view categories
router.patch('/:id', jwt, isAdmin, update)
router.delete('/:id', jwt, isAdmin, remove)

export default router
