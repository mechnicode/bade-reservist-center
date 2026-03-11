import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import 'dotenv/config' // 確保加載 .env 文件

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// 配置 CloudinaryStorage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'bade-system-activities', // 在 Cloudinary 中存放的資料夾名稱
      format: 'jpeg', // 轉換為 JPEG 格式
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // 唯一檔案名稱
      // Remove strict 500x500 limit. Let's allow up to 1920px width for HD quality.
      // Cloudinary will resize ONLY if image is larger than this.
      transformation: [{ width: 1920, crop: 'limit' }] 
    }
  }
})

// 配置 Multer
const upload = multer({
  storage: storage,
  fileFilter (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('檔案類型不正確，請上傳圖片。'), false)
    } else {
      cb(null, true)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 檔案大小限制
  }
})

export default upload