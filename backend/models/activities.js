import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    name: {
      type: String,
      required: [true, '活動名稱必填'],
    },
    description: {
      type: String,
      required: [true, '描述必填'],
    },
    category: {
      type: String,
      required: [true, '分類必填'],
    },
    capacity: {
      type: Number,
      required: [true, '人數上限必填'],
    },
    eventDate: {
      type: Date,
      required: [true, '活動日期必填'],
    },
    sell: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('activities', schema)
