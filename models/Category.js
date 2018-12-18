const mongoose = require('mongoose')
const Schema = mongoose.Schema

const categorySchema = new Schema({
  name: String,
  lead: String,
  parent_id: String,
  cate_code: String,
  share_url: String,
  cate_type: Number,
  show_folder: Number,
  special_option: Number,
  status: Number,
  cate_crawler_id: Number,
}, {
  timestamps: true
})

// const Category = mongoose.model('Category', CategorySchema)

const anySchema = new Schema({}, { strict: false });
const Category = mongoose.model('Categories', categorySchema); //anySchema

module.exports = Category
