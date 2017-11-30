// 方式一
/*
module.exports = function (app) {
  app.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
  });
}
*/

// 方式二：建议使用
var express = require('express');
var router = express.Router();
var Article = require('../models/article.js')

// GET home page.
router.get('/', function (req, res, next) {
  var article = new Article();
  // filter: 筛选条件，pageCount：指当前的页数，pageSize:每页显示的数据个数
  var filter = {};
  // 从查询字符串获取页码
  var pageCount = req.query.pagecount;
  var pageSize = req.query.pagesize;
  pageCount = pageCount ? parseInt(pageCount) : 1;
  pageSize = pageSize ? parseInt(pageSize): 3;

  article.getPaged(filter, pageCount, pageSize, function (err, result) {
    if (err) {
      req.flash('err', err.message);
      res.redirect('/');
      return;
    }
    res.render('index', {
      title: '首页',
      success: req.flash('success').toString(),
      err: req.flash('err').toString(),
      user: req.session.name,
      articles: result.articles,
      pageInfo: {
        pageCount,
        pageSize,
        pageTotalCount: Math.ceil(result.totalCount / pageSize)
      }
    });
  })
});

module.exports = router;

