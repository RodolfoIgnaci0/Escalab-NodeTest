const { model, Schema } = require('mongoose')

const ArticleSchema = new Schema(
  {
    id: {
      required: true,
      type: String,
      unique: true
    },
    name: {
      required: true,
      type: String
    },
    price: {
      required: true,
      type: Number
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users'
      }
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: {
      transform: (_, ret) => {
        delete ret._id
      }
    }
  }
)

const ArticleModel = model('articles', ArticleSchema)

module.exports = ArticleModel
