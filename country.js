const mongoose = require('mongoose')
const request = require('request-promise')
const cheerio = require('cheerio')
const _ = require('lodash')

const Country = require('./models/Country')

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
 * #list-countries
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
const html2Country = ($) => {
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
  const name2 = $.text()
  const share_url = $.val()+'.html'
  const code = $.val()

  return {
    name,
    name2,
    share_url,
    code
  }
}

/**
 * Parse html to countries
 * 
 * @param {*} $ 
 */
const html2countries = ($) => {
  const countries = []
  $('#filter-country option').each((_, c) => {
    countries.push(html2Country($(c)))
  })
  return countries
}

const createcountries = (countries) => {
  return Promise.all(countries.map(c => Country.findOneAndUpdate({ name: c.name }, { $set: c }, { upsert: true })))
}

const crawlPage = (uri) => {
  let isError = false
  return getPageContent(uri)
    .then(({ uri, $ }) => {
      return html2countries($)
    }).catch(error => {
      isError = true
    }).then((countries) => {
      return isError ? uri : countries
    })
}

const crawl = async(pages, results) => {
  const chunks = await Promise.all(pages.map(uri => crawlPage(uri)))
  const availableChunks = _.filter(chunks, c => typeof c === 'object')
  const remainPages = _.filter(chunks, c => typeof c === 'string')
  console.log("testtttttttttttt", chunks, availableChunks, remainPages)
  if (availableChunks.length > 0) {
    results = await Promise.all(availableChunks.map(countries => createcountries(countries)))
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
  crawl(pages, results).then((countries) => {
    if (!countries)
      return
    console.log(`Created ${countries.length} countries`)
    return
  }).then(() => {
    console.timeEnd('crawl > ')
    process.exit()
  })
})
