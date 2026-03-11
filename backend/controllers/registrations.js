import registrations from '../models/registrations.js'
import activities from '../models/activities.js'
import { StatusCodes } from 'http-status-codes'

export const create = async (req, res) => {
  try {
    // 檢查是否已報名
    const existingRegistration = await registrations.findOne({
      user: req.user._id,
      activity: req.body.activity
    })
    if (existingRegistration) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '您已報名此活動'
      })
    }

    // 檢查活動是否存在及人數是否已滿
    const activity = await activities.findById(req.body.activity)
    if (!activity) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到活動'
      })
    }
    if (activity.capacity <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '活動人數已滿'
      })
    }

    // 建立報名
    const result = await registrations.create({
      user: req.user._id,
      activity: req.body.activity,
      status: 0,
      note: req.body.note
    })

    // 更新活動人數
    activity.capacity -= 1
    await activity.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '報名成功',
      result
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤'
    })
  }
}

export const getUserRegistrations = async (req, res) => {
  try {
    const result = await registrations.find({ user: req.user._id }).populate('activity')

    res.status(StatusCodes.OK).json({
      success: true,
      message: '成功取得報名紀錄',
      result,
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    })
  }
}

export const getAllRegistrations = async (req, res) => {
  try {
    const result = await registrations.find({})
      .populate('user', '-password -tokens') // Populate user details, exclude sensitive fields
      .populate('activity'); // Populate activity details

    res.status(StatusCodes.OK).json({
      success: true,
      message: '成功取得所有報名紀錄',
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    });
  }
}

export const deleteRegistration = async (req, res) => {
  try {
    const registration = await registrations.findById(req.params.id);
    if (!registration) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到報名紀錄',
      });
    }

    // Increment activity capacity before deleting registration
    const activity = await activities.findById(registration.activity);
    if (activity) {
      activity.capacity += 1;
      await activity.save();
    }

    await registrations.findByIdAndDelete(req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: '報名紀錄刪除成功',
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    });
  }
};

export const update = async (req, res) => {
  try {
    const { status } = req.body;
    if (![0, 1, 2].includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的狀態代碼',
      });
    }

    const registration = await registrations.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到報名紀錄',
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '報名狀態更新成功',
      result: registration,
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    });
  }
};
