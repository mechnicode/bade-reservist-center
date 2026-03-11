// 1. 優先載入 dotenv 並立即執行 config
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { StatusCodes } from 'http-status-codes'
import passport from 'passport' // Import passport
import './middleware/passport.js' // Import passport configuration
import multer from 'multer' // Import multer for error handling

import userRoute from './routes/users.js'
import activityRoute from './routes/activities.js'
import registrationRoute from './routes/registrations.js'
import categoryRoute from './routes/categories.js'
import statsRoute from './routes/stats.js'
import carouselRoute from './routes/carousel.js'

// 檢查點：如果你在終端機看到 undefined，代表你的 .env 檔案名稱必須從 .ENV 改成 .env
console.log('檢查連線字串:', process.env.DB_URL)

const app = express()

// 2. 中間件設定
app.use(cors({
  origin: true, // 允許所有來源
  credentials: true
}))
app.use(express.json())
app.use(passport.initialize()) // Initialize passport

app.use('/users', userRoute)
app.use('/activities', activityRoute)
app.use('/registrations', registrationRoute)
app.use('/categories', categoryRoute)
app.use('/stats', statsRoute)
app.use('/carousel', carouselRoute)

// Global Error Handler (Must be after routes)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '檔案太大，請上傳小於 10MB 的圖片'
      })
    }
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: `上傳錯誤: ${err.message}`
    })
  } else if (err) {
    console.error(err)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器發生錯誤'
    })
  }
  next()
})

// 3. 連接資料庫
// 這裡加入錯誤處理，確保 DB_URL 存在才連接
if (!process.env.DB_URL) {
  console.error('❌ 錯誤：找不到 DB_URL，請檢查 .env 檔案內容與名稱')
  process.exit(1) // 強制停止程式
}

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log('✅ 成功連接到 MongoDB 資料庫')
  })
  .catch((error) => {
    console.error('❌ 資料庫連接失敗詳細原因:', error.message)
    console.error('❌ 完整的錯誤代碼:', error.code)
  })

// 4. 測試路由
app.get('/', (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: '八德區後備軍人活動報名系統後端已啟動',
  })
})

// 5. 啟動伺服器
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 伺服器正在執行: http://localhost:${PORT}`)
})
