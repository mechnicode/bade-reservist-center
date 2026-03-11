// 匯入必要的模組
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Activity from './models/activities.js' // 請確認模型路徑是否正確

// 載入 .env 檔案的環境變數
dotenv.config()

// 範例活動資料
const sampleActivities = [
  {
    name: '後備軍人健行活動',
    description: '歡迎參加我們一年一度的後備軍人健行活動，強身健體，聯繫情誼。',
    eventDate: new Date('2026-03-15T09:00:00'),
    location: '大坑風景區',
    capacity: 100,
    category: '戶外活動',
    // imageUrl: 'https://example.com/hiking.jpg' // 可選的圖片 URL
  },
  {
    name: '國防知識講座',
    description: '邀請專家學者分享最新的國防知識與情勢分析。',
    eventDate: new Date('2026-04-10T14:00:00'),
    location: '市區活動中心',
    capacity: 50,
    category: '知識分享',
    // imageUrl: 'https://example.com/lecture.jpg'
  },
  {
    name: '親子國防體驗營',
    description: '專為後備軍人家庭設計，透過有趣的活動讓孩子了解國防的重要性。',
    eventDate: new Date('2026-05-20T10:00:00'),
    location: '某軍事基地',
    capacity: 30,
    category: '家庭活動',
    // imageUrl: 'https://example.com/family_camp.jpg'
  },
  {
    name: '國軍裝備展示',
    description: '近距離接觸國軍最新裝備，體驗現代化國防科技。',
    eventDate: new Date('2026-06-01T13:00:00'),
    location: '基地開放日',
    capacity: 200,
    category: '軍事展示',
  },
  {
    name: '軍歌演唱比賽',
    description: '展現軍人雄風，傳承軍歌精神，歡迎踴躍報名參加。',
    eventDate: new Date('2026-07-07T18:00:00'),
    location: '文化活動中心',
    capacity: 80,
    category: '文化活動',
  }
]

// 連接資料庫並植入種子資料的函數
const seedDB = async () => {
  try {
    // 1. 連接資料庫
    if (!process.env.DB_URL) {
      console.error('❌ 錯誤：找不到 DB_URL，請檢查 .env 檔案內容與名稱')
      process.exit(1)
    }
    await mongoose.connect(process.env.DB_URL)
    console.log('✅ 成功連接到 MongoDB 資料庫')

    // 2. 清空現有活動資料
    console.log('⏳ 正在清空舊的活動資料...')
    await Activity.deleteMany({})
    console.log('✅ 舊資料已清空')

    // 3. 插入新的範例活動資料
    console.log('⏳ 正在植入新的範例資料...')
    await Activity.insertMany(sampleActivities)
    console.log('✅ 新的範例資料已成功植入')

  } catch (error) {
    console.error('❌ 植入種子資料時發生錯誤:', error)
  } finally {
    // 4. 關閉資料庫連接
    await mongoose.connection.close()
    console.log('🔌 資料庫連接已關閉')
  }
}

// 執行種子資料腳本
seedDB()
