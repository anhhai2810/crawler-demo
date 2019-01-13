const mongoose = require('mongoose')
const _ = require('lodash')
const moment = require('moment')

const Video = require('./models/video')

mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crawl', {
  useMongoClient: true
}, (error) => {
  if (error) {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
    process.exit()
  }

  // todo
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>> Connected MongoDB <<<<<<<<<<<<<<<<<<<<<<<<<<')
})

const puppeteer = require('puppeteer');
const $ = require('cheerio');
const url = 'https://www.reddit.com';

puppeteer
  .launch()
  .then(function(browser) {
    return browser.newPage();
  })
  .then(function(page) {
    return page.goto(url).then(function() {
      return page.content();
    });
  })
  .then(function(html) {
    $('h2', html).each(function() {
      console.log($(this).text());
    });
  })
  .catch(function(err) {
    //handle error
  });