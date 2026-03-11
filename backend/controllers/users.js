import users from '../models/users.js'
import { StatusCodes } from 'http-status-codes'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const create = async (req, res) => {
  try {
    req.body.password = bcrypt.hashSync(req.body.password, 10)
    // 1. 建立一個新的使用者資料（從前端傳來的 req.body）
    await users.create(req.body)

    // 2. 回傳成功訊息
    res.status(StatusCodes.OK).json({
      success: true,
      message: '註冊成功',
    })
  } catch (error) {
    console.log(error)
    // 3. 處理重複帳號或其他驗證錯誤
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '帳號已存在',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器錯誤',
      })
    }
  }
}

export const login = async (req, res) => {
  try {
    const user = await users.findOne({ account: req.body.account })
    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '帳號不存在',
      })
      return
    }
    if (!bcrypt.compareSync(req.body.password, user.password)) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: '密碼錯誤',
      })
      return
    }
    const token = jwt.sign(
      {
        _id: user._id,
        account: user.account,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7 days' },
    )
    if (!user.tokens) user.tokens = []
    user.tokens.push(token)
    await user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '登入成功',
      result: {
        account: user.account,
        role: user.role,
        name: user.name,
        phone: user.phone,
        militaryBranch: user.militaryBranch,
        rank: user.rank,
        token,
      },
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    })
  }
}

export const profile = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: '成功取得使用者資料',
      result: {
        account: req.user.account,
        name: req.user.name,
        phone: req.user.phone,
        militaryBranch: req.user.militaryBranch,
        rank: req.user.rank,
      },
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    })
  }
}

export const edit = async (req, res) => {
  try {
    const { name, phone, militaryBranch, rank } = req.body
    const user = await users.findByIdAndUpdate(req.user._id, {
      name,
      phone,
      militaryBranch,
      rank,
    }, { new: true, runValidators: true, context: 'query' })

    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到使用者',
      })
      return
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '使用者資料更新成功',
      result: {
        account: user.account,
        name: user.name,
        phone: user.phone,
        militaryBranch: user.militaryBranch,
        rank: user.rank,
      },
    })
  } catch (error) {
    console.log(error)
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
      });
    }
  }
}

export const editUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    // Validate role input
    if (role === undefined || ![0, 1, 2].includes(role)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的角色值',
      });
      return;
    }

    // Find the target user first to check permissions
    const targetUser = await users.findById(id);
    if (!targetUser) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到使用者',
      });
      return;
    }

    const requesterRole = req.user.role;
    const targetRole = targetUser.role;

    // Hierarchy check:
    // 1. Requester cannot modify someone with equal or higher role.
    if (requesterRole <= targetRole) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: '權限不足：無法修改同級或更高級別的使用者',
      });
    }

    // 2. Requester cannot grant a role equal to or higher than their own.
    if (requesterRole <= role) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: '權限不足：無法賦予同級或更高級別的角色',
      });
    }

    // Perform update
    const updatedUser = await users.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });

    res.status(StatusCodes.OK).json({
      success: true,
      message: '使用者角色更新成功',
      result: {
        _id: updatedUser._id,
        account: updatedUser.account,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0];
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器錯誤',
      });
    }
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const result = await users.find({}, '-password -tokens'); // Exclude password and tokens

    res.status(StatusCodes.OK).json({
      success: true,
      message: '成功取得所有使用者資料',
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user._id.toString()) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '無法刪除自己的帳號',
      });
    }

    const targetUser = await users.findById(id);
    if (!targetUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到使用者',
      });
    }

    const requesterRole = req.user.role;
    const targetRole = targetUser.role;

    // Hierarchy check:
    // Requester cannot delete someone with equal or higher role.
    if (requesterRole <= targetRole) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: '權限不足：無法刪除同級或更高級別的使用者',
      });
    }

    await users.findByIdAndDelete(id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: '使用者已刪除',
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    });
  }
};
