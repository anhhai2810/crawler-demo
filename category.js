const mongoose = require('mongoose')
const request = require('request-promise')
const cheerio = require('cheerio')
const _ = require('lodash')

const Category = require('./models/Category')

const URL = 'http://www.phimmoi.net/the-loai/phim-hanh-dong/'
const companyCount = 20 // Cái này là mình thấy trên trang này nó ghi vậy. =))
const pageSize = 20 // Đã test. :)
const pageCount = parseInt(companyCount / pageSize)

/**
 * Get content for each page
 * 
 * @param {*} uri (Ex: ${URL}page/2)
 */
const getPageContent = (uri) => {
  const options = {
    uri,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    transform: (body) => {
      return cheerio.load(body)
    }
  }

  return request(options)
    .then(($) => {
      return {
        $,
        uri,
      }
    })
}

/**
 * Parse html to company Object
 * 
 * #list-categories
 *  .tile
 *    .tile-icon img src (logo link)
 *    .tile-content
 *      .tile-title [0] => Company Name & Review Link
 *        a href (review link)
 *          text (company name)
 *      .tile-title [1] => Info (Location, type, size, country, working time)
 *        icon
 *        text (Info - Repeat 5 times)
 *      .tile-title [2] => Reviews (count, avg)
 *        a>span text => count
 *        >span
 *          i*5 (i | i.none)
 * 
 * @param {*} $ 
 */
const html2Category = ($) => {
  // logo
  // const logo = $.find('.tile-icon img').attr('data-original')
  // const cName = $.find('.tile-content .tile-title:nth-child(1) a')
  // const name = cName.find('span').text()
  // const reviewLink = cName.attr('href')
  // $.find('.tile-content .tile-title:nth-child(2) i').replaceWith('|')
  // const details = $.find('.tile-content .tile-title:nth-child(2)')
  //   .html().split('|').map(d => d.replace(/^\s+/, ''))
  // const reviews = $.find('.tile-content .tile-title:nth-child(3)')
  // const reviewCount = reviews.find('a>span').text()
  // const star = reviews.find('>span i:not(.none)').length
  const name = $.text()
  const lead = $.text()
  const share_url = $.attr('data-slug')+'.html'
  const parent_id = 0
  const cate_code = $.attr('data-slug')
  const cate_type = 1
  const show_folder = 1
  const special_option = 0
  const status = 1
  const cate_crawler_id = $.val()

  return {
    name,
    lead,
    parent_id,
    cate_code,
    share_url,
    cate_type,
    show_folder,
    special_option,
    status,
    cate_crawler_id
  }
}

/**
 * Parse html to categories
 * 
 * @param {*} $ 
 */
const html2categories = ($) => {
  const categories = []
  $('#filter-category option').each((_, c) => {
    categories.push(html2Category($(c)))
  })
  return categories
}

const createcategories = (categories) => {
  return Promise.all(categories.map(c => Category.findOneAndUpdate({ name: c.name }, { $set: c }, { upsert: true })))
}

const crawlPage = (uri) => {
  let isError = false
  return getPageContent(uri)
    .then(({ uri, $ }) => {
      return html2categories($)
    }).catch(error => {
      isError = true
    }).then((categories) => {
      return isError ? uri : categories
    })
}

const crawl = async(pages, results) => {
  const chunks = await Promise.all(pages.map(uri => crawlPage(uri)))
  const availableChunks = _.filter(chunks, c => typeof c === 'object')
  const remainPages = _.filter(chunks, c => typeof c === 'string')
  console.log("testtttttttttttt", chunks, availableChunks, remainPages)
  if (availableChunks.length > 0) {
    results = await Promise.all(availableChunks.map(categories => createcategories(categories)))
      .then((data) => data.reduce((page1, page2) => page1.concat(page2)))
    // results = {};
  }
  if (remainPages && remainPages.length > 0) {
    console.log(`Remain ${remainPages.length}.`)
    results = results.concat(await crawl(remainPages, results))
  }
  return results
}

mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crawl', {
  useMongoClient: true
}, (error) => {
  if (error) {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
    process.exit()
  }

  console.time('crawl > ')
  const pages = [`${URL}`]
  // for (let i = 1; i <= pageCount; i++) {
  //   pages.push(`${URL}page/${i}`)
  // }
  const results = []
  crawl(pages, results).then((categories) => {
    if (!categories)
      return
    console.log(`Created ${categories.length} categories`)
    return
  }).then(() => {
    console.timeEnd('crawl > ')
    process.exit()
  })
})
