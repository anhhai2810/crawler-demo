const mongoose = require('mongoose')
const request = require('request-promise')
const cheerio = require('cheerio')
const _ = require('lodash')
const moment = require('moment')

const Video = require('./models/video')

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
      // 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'
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
    }).catch(function (err) {
        // Crawling failed or Cheerio choked...
        console.log('errerrerrerrerrerrerrerrerrerrerr', err)
    });
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
  // console.log('Ngày ra rạp:', $('.movie-dl .movie-dd').eq(6).text())
  // process.exit()

  const name = $('.movie-info .movie-title a.title-1').text()
  const lead = $('meta[property="og:description"]').attr('content')
  const content = $('#film-content').html()
  const links = []
  const images = $('.movie-image .movie-l-img > img').attr('src')
  const status = 1
  const publishAt = moment().format()
  const IMDb = $('.movie-dd.imdb').text()
  const dao_dien = getElementsCommon($, '.movie-dd.dd-director a')
  const quoc_gia = getElementsCommon($, '.movie-dd.dd-country a')
  const the_loai = getElementsCommon($, '.movie-dd.dd-cat a')
  const dien_vien = getActors($, '#list_actor_carousel li')
  const ngay_phat_hanh = moment($('.movie-dl .movie-dd').eq(6).text(), "DD/MM/YYYY").format()
  const ngay_ra_rap = moment($('.movie-dl .movie-dd').eq(6).text(), "DD/MM/YYYY").format()
  const thoi_luong = $('.movie-dl .movie-dd').eq(7).text().replace(' phút','')
  const chat_luong = $('.movie-dl .movie-dd').eq(8).text()
  const do_phan_giai = $('.movie-dl .movie-dd').eq(9).text()
  const ngon_ngu = $('.movie-dl .movie-dd').eq(10).text()
  const cty_sx = $('.movie-dl .movie-dd').eq(12).text()
  const total_view = $('.movie-dl .movie-dd').eq(13).text().replace(/\,/g,'')
  const rating = $('#star').attr('data-score')
  const trailer_link = ''
  const tags = getElementsCommon($, '.tag-list li a')
  const total_comment = 0
  const name2 = $('.movie-info .movie-title span.title-2').text()
  const hang_sx = $('.movie-dl .movie-dd').eq(12).text()
  const video_id_crawler = $('.tools-box-bookmark.normal').attr('data-filmid')
  const detail_link_crawler = $('.movie-info h1.movie-title a').attr('href')

  var api = 'http://episode.phimmoi.net/episodeinfo-v1.2.php';
      api += '?ip=';
      api += '&filmid=7801';
      api += '&episodeid=172700';
      api += '&number=5';
      api += '&part=0';
      api += '&filmslug=phim-slug';
      api += '&type=json';
      api += '&requestid=';
      api += '&token=0fb706e46fe15459919329f51de800fd';
      api += '&cs=&sig=&decryptkey=&_fxToken=';
  
  const link_xem_phim = 'http://www.phimmoi.net/' + detail_link_crawler + 'xem-phim.html';
console.log('link_xem_phim',link_xem_phim)
  links = getLinksVideo(link_xem_phim)
console.log('result LInkssss', links)
  return {
    name,
    lead,
    content,
    links,
    images,
    status,
    publishAt,
    IMDb,
    dao_dien,
    quoc_gia,
    the_loai,
    dien_vien,
    ngay_phat_hanh,
    ngay_ra_rap,
    thoi_luong,
    chat_luong,
    do_phan_giai,
    ngon_ngu,
    cty_sx,
    total_view,
    rating,
    trailer_link,
    tags,
    total_comment,
    name2,
    hang_sx,
    video_id_crawler,
    detail_link_crawler,
  }
}

const getElementsCommon = ($, el) => {
  var x =[];
  $(el).each(function(index, obj)
  {
    var obj = {};
    obj.name = $(this).text(); 
    obj.share_url = $(this).attr('href');
    x.push(obj);
  });
  return x;
}

const getActors = ($, el) => {
  var x =[];
  $(el).each(function(index, obj)
  {
    var obj = {};
    obj.name = $(this).find('.actor-name-a').text(); 
    obj.character = $(this).find('.character').text(); 
    obj.share_url = $(this).find('.actor-profile-item').attr('href');
    obj.image = $(this).find('.actor-image').attr('style').replace('background-image:url(\'','').replace('\')','');
    x.push(obj);
  });
  return x;
}

const getLinksVideo = (uri) => {console.log('voooooooooo', uri)
  crawlPage(uri)
  
  process.exit()
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
  console.log("testtttttttttttt", availableChunks)
  process.exit()
  if (availableChunks.length > 0) {
    // results = await Promise.all(availableChunks.map(videos => createvideos(videos)))
    //   .then((data) => data.reduce((page1, page2) => page1.concat(page2)))
    // results = {};
  }
  if (remainPages && remainPages.length > 0) {
    console.log(`Remain ${remainPages.length}.`)
    results = results.concat(await crawl(remainPages, results))
  }
  return results
}

var testt = crawlPage('http://www.phimmoi.net/phim/quai-vat-venom-7022/xem-phim.html');

// mongoose.Promise = global.Promise
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crawl', {
//   useMongoClient: true
// }, (error) => {
//   if (error) {
//     console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
//     process.exit()
//   }

//   console.time('crawl > ')
//   const pages = [`${URL}`]
//   // for (let i = 1; i <= pageCount; i++) {
//   //   pages.push(`${URL}page/${i}`)
//   // }
//   const results = []
//   crawl(pages, results).then((videos) => {
//     if (!videos)
//       return
//     console.log(`Created ${videos.length} videos`)
//     return
//   }).then(() => {
//     console.timeEnd('crawl > ')
//     process.exit()
//   })
// })
