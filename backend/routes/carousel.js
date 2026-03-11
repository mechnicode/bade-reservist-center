import { Router } from 'express'
import { create, getAll, update, remove } from '../controllers/carousel.js'
import * as auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = Router()

router.get('/', getAll)
router.post('/', auth.jwt, auth.isAdmin, upload.single('image'), create)
router.patch('/:id', auth.jwt, auth.isAdmin, upload.single('image'), update)
router.delete('/:id', auth.jwt, auth.isAdmin, remove)

export default router
