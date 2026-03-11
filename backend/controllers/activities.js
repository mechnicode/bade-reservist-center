import activities from '../models/activities.js'
import { StatusCodes } from 'http-status-codes'

export const create = async (req, res) => {
  try {
    const result = await activities.create({
      ...req.body,
      image: req.file.path,
      imageUrl: req.file.path
    })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '活動建立成功',
      result,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器錯誤',
      })
    }
  }
}

export const getAll = async (req, res) => {
  try {
    const result = await activities.find()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '成功取得活動列表',
      result,
    })
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    })
  }
}

export const update = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = req.file.path
      req.body.imageUrl = req.file.path
    }
    const result = await activities.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到活動',
      })
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: '活動更新成功',
      result,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器錯誤',
      })
    }
  }
}

export const getById = async (req, res) => {
  try {
    const result = await activities.findById(req.params.id)
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到活動',
      })
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: '成功取得活動',
      result,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    })
  }
}