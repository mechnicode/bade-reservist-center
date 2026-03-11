import { Schema, model, ObjectId } from 'mongoose'

const schema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: 'users', // 對應 users model
      required: [true, '報名者資訊必填'],
    },
    activity: {
      type: ObjectId,
      ref: 'activities', // 對應 activities model
      required: [true, '活動資訊必填'],
    },
    status: {
      type: Number,
      default: 0, // 0: 報名成功, 1: 審核中, 2: 取消
    },
    note: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('registrations', schema)
