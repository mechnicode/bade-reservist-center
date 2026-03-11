import Carousel from '../models/carousel.js'
import { StatusCodes } from 'http-status-codes'

export const create = async (req, res) => {
  try {
    const result = await Carousel.create({
      image: req.file?.path, // Cloudinary URL
      title: req.body.title,
      subtitle: req.body.subtitle,
      pretitle: req.body.pretitle,
      sort: req.body.sort,
      isActive: req.body.isActive === 'true' || req.body.isActive === true
    })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '輪播圖新增成功',
      result
    })
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤'
    })
  }
}

export const getAll = async (req, res) => {
  try {
    // Only fetch active items for public view unless ?all=true is passed (for admin)
    // Actually, let's keep it simple: Admin fetches all, public fetches active.
    // Since we usually separate routes or use query params. 
    // Let's assume this is the public endpoint mostly, but we can filter in frontend for admin or add a query param.
    
    // For now, let's just return sorted items.
    // If the requester is admin (we can check middleware in route), we show all. 
    // But for simplicity in controller, let's just return all and let frontend filter if needed, 
    // OR support a query param.
    
    const filter = {}
    if (req.query.activeOnly === 'true') {
        filter.isActive = true
    }

    const result = await Carousel.find(filter).sort({ sort: 1, createdAt: -1 })
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: '成功取得輪播圖',
      result
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤'
    })
  }
}

export const update = async (req, res) => {
  try {
    const data = { ...req.body }
    if (req.file) {
        data.image = req.file.path
    }
    
    const result = await Carousel.findByIdAndUpdate(req.params.id, data, { new: true })
    
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到輪播圖'
      })
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: '輪播圖更新成功',
      result
    })
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤'
    })
  }
}

export const remove = async (req, res) => {
  try {
    const result = await Carousel.findByIdAndDelete(req.params.id)
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到輪播圖'
      })
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: '輪播圖刪除成功'
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤'
    })
  }
}
