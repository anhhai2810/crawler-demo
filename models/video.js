const mongoose = require('mongoose')
const Schema = mongoose.Schema

const videosSchema = new Schema({
  name: String,
  lead: String,
  content: String,
  links: Object,
  images: String,
  status: String,
  publishAt: Date,
  IMDb: Number,
  dao_dien: String,
  ngay_phat_hanh: Date,
  ngay_ra_rap: Date,
  thoi_luong: Number,
  chat_luong: String,
  do_phan_giai: String,
  ngon_ngu: String,
  cty_sx: String,
  total_view: Number,
  rating: Number,
  trailer_link: String,
  tags: String,
  total_comment: Number,
  name2: String,
  hang_sx: String,
  video_id_crawler: Number,
  detail_link_crawler: String,
}, {
  timestamps: true
})

// const Video = mongoose.model('video', videosSchema)

const anySchema = new Schema({}, { strict: false });
const Video = mongoose.model('Videos', videosSchema); //anySchema

module.exports = Video
