import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Category from './models/categories.js'

dotenv.config()

if (!process.env.DB_URL) {
  console.error('❌ 錯誤：找不到 DB_URL')
  process.exit(1)
}

const seedCategories = [
  { name: '講座' },
  { name: '訓練' },
  { name: '親子' },
  { name: '戶外' },
  { name: '聯誼' }
]

mongoose.connect(process.env.DB_URL)
  .then(async () => {
    console.log('✅ 資料庫連接成功')
    
    // Clear existing categories
    await Category.deleteMany({})
    console.log('🧹 清除舊有分類')

    // Insert new categories
    await Category.insertMany(seedCategories)
    console.log('🌱 預設分類建立完成')

    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 錯誤:', error)
    process.exit(1)
  })
