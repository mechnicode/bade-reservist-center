import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    image: {
      type: String,
      required: [true, '圖片必填'],
    },
    title: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
    },
    pretitle: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sort: {
      type: Number,
      default: 0, // Lower number = appears first
    }
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('carousel', schema)
