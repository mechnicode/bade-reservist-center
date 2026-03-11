import User from '../models/users.js'
import Activity from '../models/activities.js'
import Registration from '../models/registrations.js'
import Category from '../models/categories.js'
import { StatusCodes } from 'http-status-codes'

export const getStats = async (req, res) => {
  try {
    const [userCount, activityCount, registrationCount, categoryCount] = await Promise.all([
      User.countDocuments(),
      Activity.countDocuments(),
      Registration.countDocuments(),
      Category.countDocuments()
    ])

    // Get registration status counts
    const registrations = await Registration.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const stats = {
      users: userCount,
      activities: activityCount,
      registrations: registrationCount,
      categories: categoryCount,
      registrationStatus: registrations.reduce((acc, curr) => {
        acc[curr._id] = curr.count
        return acc
      }, {})
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: stats
    })
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤，無法取得統計數據'
    })
  }
}
