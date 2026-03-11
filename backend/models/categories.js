import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    name: {
      type: String,
      required: [true, '分類名稱必填'],
      unique: true,
      trim: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

export default model('categories', schema)
