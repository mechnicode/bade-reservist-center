import { Schema, model } from 'mongoose'
import validator from 'validator'

const schema = new Schema(
  {
    account: {
      type: String,
      required: [true, '帳號必填'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, '密碼必填'],
    },
    name: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
      validate: {
        validator(value) {
          return validator.isMobilePhone(value, 'zh-TW')
        },
        message: '手機格式錯誤',
      },
    },
    militaryBranch: {
      type: String,
      required: false,
    },
    rank: {
      type: String,
    },
    role: {
      type: Number,
      default: 0, // 0: 一般使用者, 1: 一般管理員, 2: 最高管理員
    },
    tokens: {
      type: [String],
    },
  },
  {
    versionKey: false,
    timestamps: true, // 自動生成 createdAt, updatedAt
  },
)

export default model('users', schema)
