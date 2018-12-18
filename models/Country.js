const mongoose = require('mongoose')
const Schema = mongoose.Schema

const countriesSchema = new Schema({
  name: String,
  name2: String,
  share_url: String,
  code: String,
}, {
  timestamps: true
})

// const Country = mongoose.model('Countries', countriesSchema)

const anySchema = new Schema({}, { strict: false });
const Country = mongoose.model('Countries', countriesSchema); //anySchema

module.exports = Country
