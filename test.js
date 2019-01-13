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

// https://medium.freecodecamp.org/the-ultimate-guide-to-web-scraping-with-node-js-daa2027dcd3

const rp = require('request-promise');
const $ = require('cheerio');
const puppeteer = require('puppeteer');
const potusParse = require('./potusParse');
const url = 'http://www.phimmoi.net/phim/quai-vat-venom-7022/';

// rp(url)
//   .then(function(html) {
//     //success!
//     const wikiUrls = [];
//     for (let i = 0; i < 45; i++) {
//       wikiUrls.push($('big > a', html)[i].attribs.href);
//     }
//     return Promise.all(
//       wikiUrls.map(function(url) {
//         return potusParse2('https://en.wikipedia.org' + url);
//       })
//     );
//   })
//   .then(function(presidents) {
//     console.log(presidents);
//   })
//   .catch(function(err) {
//     //handle error
//     console.log(err);
//   });

const getInfo = function(url) {
  return rp(url)
    .then(function(html) {
      return {
        name: $('.movie-info .movie-title a.title-1', html).text(),
        lead: $('meta[property="og:description"]', html).attr('content'),
        content: $('#film-content', html).html(),
        links: [],
        images: $('.movie-image .movie-l-img > img', html).attr('src'),
        status: 1,
        publishAt: moment().format(),
        IMDb: $('.movie-dd.imdb', html).text(),
        dao_dien: getElementsCommon(html, '.movie-dd.dd-director a'),
        quoc_gia: getElementsCommon(html, '.movie-dd.dd-country a'),
        the_loai: getElementsCommon(html, '.movie-dd.dd-cat a'),
        dien_vien: getActors(html, '#list_actor_carousel li'),
        ngay_phat_hanh: moment($('.movie-dl .movie-dd', html).eq(6).text(), "DD/MM/YYYY").format(),
        ngay_ra_rap: moment($('.movie-dl .movie-dd', html).eq(6).text(), "DD/MM/YYYY").format(),
        thoi_luong: $('.movie-dl .movie-dd', html).eq(7).text().replace(' phút',''),
        chat_luong: $('.movie-dl .movie-dd', html).eq(8).text(),
        do_phan_giai: $('.movie-dl .movie-dd', html).eq(9).text(),
        ngon_ngu: $('.movie-dl .movie-dd', html).eq(10).text(),
        cty_sx: $('.movie-dl .movie-dd', html).eq(12).text(),
        total_view: $('.movie-dl .movie-dd', html).eq(13).text().replace(/\,/g,''),
        rating: $('#star', html).attr('data-score'),
        trailer_link: '',
        tags: getElementsCommon(html, '.tag-list li a'),
        total_comment: 0,
        name2: $('.movie-info .movie-title span.title-2', html).text(),
        hang_sx: $('.movie-dl .movie-dd', html).eq(12).text(),
        video_id_crawler: $('.tools-box-bookmark.normal', html).attr('data-filmid'),
        detail_link_crawler: $('.movie-info h1.movie-title a', html).attr('href'),
        link_xem_phim : 'http://www.phimmoi.net/' + $('.movie-info h1.movie-title a', html).attr('href') + 'xem-phim.html',
      };
    }).
    then(function(result){
      console.log('Doneeeeeeeeee: ', url);
      // http://episode.phimmoi.net/episodeinfo-v1.2.php?ip=&filmid=7022&episodeid=170170&number=1&part=0&filmslug=dada&type=json&requestid=0&token=03ca0d0563e1547033490590b03ca694
      var api = 'http://episode.phimmoi.net/episodeinfo-v1.2.php';
          api += '?ip=';
          api += '&filmid=film_id'; //7801
          api += '&episodeid=episode_id'; //172700
          api += '&number=number_number';
          api += '&part=part_part';
          api += '&filmslug=film_slug';
          api += '&type=json';
          api += '&requestid=request_id';
          api += '&token=token_token';
          // api += '&cs=&sig=&decryptkey=&_fxToken=';
      pupParse(result.link_xem_phim);
      return result;
    })
    .catch(function(err) {
      console.log('getInfo errrrrrrrrrrr', err)
      //handle error
    });
};

const getApi = function(url) {
  return rp(url)
    .then(function(json) {
      console.log('content json', json)
      return json;
    }).
    then(function(result){
      console.log('Doneeeeeeeeee getApi: ', url);
      //save DB
      return result;
    })
    .catch(function(err) {
      console.log('getApi errrrrrrrrrrr', err)
      //handle error
    });
};

const getContent = function(url) {
  return rp(url)
    .then(function(json) {
      console.log('content json', json)
      return json;
    }).
    then(function(result){
      console.log('Doneeeeeeeeee getApi: ', url);
      //save DB
      return result;
    })
    .catch(function(err) {
      console.log('getApi errrrrrrrrrrr', err)
      //handle error
    });
};

const getElementsCommon = (html, el) => {
  var x =[];
  $(el, html).each(function(index, obj)
  {
    var obj = {};
    obj.name = $(this).text(); 
    obj.share_url = $(this).attr('href');
    x.push(obj);
  });
  return x;
}

const getActors = (html, el) => {
  var x =[];
  $(el, html).each(function(index, obj)
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

const pupParse = function(url) {
  console.log('pupParsinggggggggggggggggggggg url: ', url);
  console.time('pupParse > ')
  return puppeteer
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
    console.log('get AJAXXXX pupParse infoooooooooo', $('.movie-title', html).text());
    console.timeEnd('pupParse > ')
    return html;
  })
  .catch(function(err) {
    console.log('pupParse errrrrrrrrrrr', err)
    //handle error
  });
};

const crawl = async(pages, results) => {
  const chunks = await Promise.all(pages.map(uri => getInfo(uri)))
  const availableChunks = _.filter(chunks, c => typeof c === 'object')
  const remainPages = _.filter(chunks, c => typeof c === 'string')
  console.log("testtttttttttttt", availableChunks)
  // process.exit()
  if (availableChunks.length > 0) {

    // getLinksVideos(availableChunks[0]['link_xem_phim'])

    // results = await Promise.all(availableChunks.map(videos => createvideos(videos)))
    //   .then((data) => data.reduce((page1, page2) => page1.concat(page2)))
    results = [];
  }
  if (remainPages && remainPages.length > 0) {
    console.log(`Remain ${remainPages.length}.`)
    results = results.concat(await crawl(remainPages, results))
  }
  return results
}

const pages = [`${url}`]
  console.time('crawl > ')

  const results = []
  crawl(pages, results).then((videos) => {
    if (!videos)
      return
    console.log(`Created ${videos.length} videos`)
    return
  }).then(() => {
    console.timeEnd('crawl > ')
    // process.exit()
  })

// getInfo(url)
//   .then(function(info){
//     console.log('Doneeeeeeeeee: ', url);
//     pupParse(info.link_xem_phim);
//   })
//   .catch(function(err) {
//     //handle error
//     console.log(err);
//   });
