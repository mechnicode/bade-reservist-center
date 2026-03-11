import categories from '../models/categories.js'
import Activity from '../models/activities.js'
import { StatusCodes } from 'http-status-codes'

export const create = async (req, res) => {
// ... existing code
  try {
    const result = await categories.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '分類新增成功',
      result
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message
      })
    } else if (error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '分類名稱已存在'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器錯誤'
      })
    }
  }
}

export const getAll = async (req, res) => {
  try {
    const result = await categories.find()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '成功取得分類列表',
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
    const oldCategory = await categories.findById(req.params.id)
    if (!oldCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到分類'
      })
    }

    const result = await categories.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    // If name changed, update all activities using this category
    if (req.body.name && req.body.name !== oldCategory.name) {
      await Activity.updateMany({ category: oldCategory.name }, { category: req.body.name })
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '分類更新成功',
      result
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message
      })
    } else if (error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '分類名稱已存在'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器錯誤'
      })
    }
  }
}

export const remove = async (req, res) => {
  try {
    const category = await categories.findById(req.params.id)
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到分類'
      })
    }

    // Check if any activity is using this category
    const inUse = await Activity.findOne({ category: category.name })
    if (inUse) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '此分類正被活動使用中，無法刪除'
      })
    }

    await categories.findByIdAndDelete(req.params.id)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '分類刪除成功'
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤'
    })
  }
}
