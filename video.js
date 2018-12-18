const mongoose = require('mongoose')
const request = require('request-promise')
const cheerio = require('cheerio')
const _ = require('lodash')
const moment = require('moment')

const Video = require('./models/Video')

const URL = 'http://www.phimmoi.net/phim/quai-vat-venom-7022/'
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
 * #list-videos
 *  .tile
 *    .tile-icon img src (logo link)
 *    .tile-content
 *      .tile-title [0] => Company Name & Review Link
 *        a href (review link)
 *          text (company name)
 *      .tile-title [1] => Info (Location, type, size, Video, working time)
 *        icon
 *        text (Info - Repeat 5 times)
 *      .tile-title [2] => Reviews (count, avg)
 *        a>span text => count
 *        >span
 *          i*5 (i | i.none)
 * 
 * @param {*} $ 
 */
const html2Video = ($) => {
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
  // var now = moment("2/10/2018", "DD/MM/YYYY").format();
  // console.log('toISOString',now, new Date('2018-10-02').toISOString())
  console.log('Ngày ra rạp:', $('.movie-dl .movie-dd').eq(6).text())
  process.exit()

  const name = $('.movie-info .movie-title a.title-1').text()
  const lead = $('meta[property="og:description"]').attr('content')
  const content = $('#film-content').html()
  const links = ''
  const images = $('.movie-image > img').attr('src')
  const status = 1
  const publishAt = moment().format()
  const IMDb = 0;
  const dao_dien = ''
  const ngay_phat_hanh = moment($('.movie-dl .movie-dd').eq(6).text(), "DD/MM/YYYY").format()
  const ngay_ra_rap = moment($('.movie-dl .movie-dd').eq(6).text(), "DD/MM/YYYY").format()
  const thoi_luong = $('.movie-dl .movie-dd').eq(7).text().replace(' phút','')
  const chat_luong = $('.movie-dl .movie-dd').eq(8).text()
  const do_phan_giai = $('.movie-dl .movie-dd').eq(9).text()
  const ngon_ngu = $('.movie-dl .movie-dd').eq(10).text()
  const cty_sx = $('.movie-dl .movie-dd').eq(12).text()
  const total_view = $('.movie-dl .movie-dd').eq(13).text().replace(',','')
  const rating = $('#star').attr('data-score');
  const trailer_link = ''
  const tags = ''
  const total_comment = 0
  const name2 = $('.movie-info .movie-title span.title-2').text()
  const hang_sx = $('.movie-dl .movie-dd').eq(12).text()
  const video_id_crawler = $('.tools-box-bookmark.normal').attr('data-filmid')
  const detail_link_crawler = $('.movie-info h1.movie-title a').attr('href')

  return {
    name,
    name2,
    share_url,
    code
  }
}


const createvideos = (videos) => {
  return Promise.all(videos.map(c => Video.findOneAndUpdate({ name: c.name }, { $set: c }, { upsert: true })))
}

const crawlPage = (uri) => {
  let isError = false
  return getPageContent(uri)
    .then(({ uri, $ }) => {
      return html2Video($)
    }).catch(error => {
      isError = true
    }).then((videos) => {
      return isError ? uri : videos
    })
}

const crawl = async(pages, results) => {
  const chunks = await Promise.all(pages.map(uri => crawlPage(uri)))
  const availableChunks = _.filter(chunks, c => typeof c === 'object')
  const remainPages = _.filter(chunks, c => typeof c === 'string')
  console.log("testtttttttttttt", chunks, availableChunks, remainPages)
  if (availableChunks.length > 0) {
    results = await Promise.all(availableChunks.map(videos => createvideos(videos)))
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
  crawl(pages, results).then((videos) => {
    if (!videos)
      return
    console.log(`Created ${videos.length} videos`)
    return
  }).then(() => {
    console.timeEnd('crawl > ')
    process.exit()
  })
})
