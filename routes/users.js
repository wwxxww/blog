// 业务逻辑层 BLL (business logic layer)
var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var crypto = require('crypto');
var check = require('../modules/check.js')
var multer = require('multer');
var upload = multer({
  storage: multer.diskStorage({
    // 设置上传过来的文件放的位置
    destination: function (req, file, callback) {
      callback(null, './public/uploads')
    },
    filename: function (req, file, callback) {
      // 取上传文件的后缀名
      var ext = file.originalname.split('.')[1];
      var newFileName = Date.now() + '.' + ext;
      callback(null, newFileName);
    }
  })
})

// 进入登录页面
router.get('/login', check.checkLogined, function (req, res, next) {
  res.render('login', {
    title: '登录',
    success: req.flash('success').toString(),
    err: req.flash('err').toString(),
    user: req.session.name
  });
});

// 登录
router.post('/login', check.checkLogined, function (req, res, next) {
  var name = req.body.name;
  var password = req.body.password;
  if (!name || !password) {
    req.flash('err', '用户，密码都不能为空！');
    res.redirect('/users/login');
    return;
  }
  var md5 = crypto.createHash('md5');
  password = md5.update(password).digest('hex');
  var user = new User({ name, password, email: '' });
  user.get({ name: user.name }, function (err, result) {
    if (err) {
      req.flash('err', err.message);
      res.redirect('/users/login');
      return;
    }

    if (!result) {
      req.flash('err', '用户不存在!');
      res.redirect('/users/login');
      return;
    }

    if (result.password != user.password) {
      req.flash('err', '密码不正确!');
      res.redirect('/users/login');
      return;
    }

    req.session.name = result.name;
    req.session.email = result.email;
    req.flash('success', '登录成功！');
    res.redirect('/');
  })

})

// 进入注册页面
router.get('/reg', check.checkLogined, function (req, res, next) {
  // flash只能调用一次，且返回值是数组
  res.render('reg', {
    title: '注册',
    success: req.flash('success').toString(),
    err: req.flash('err').toString(),
    user: req.session.name
  });
});

// 注册
router.post('/reg', check.checkLogined, function (req, res, next) {
  var name = req.body.name;
  var password = req.body.password;
  var password_repeat = req.body['password-repeat'];
  var email = req.body.email;
  // 验证客户端发送数据是否合法
  if (!name || !password || !password_repeat || !email) {
    req.flash('err', '用户，密码，确认，邮箱都不能为空！');
    res.redirect('/users/reg');
    return;
  }

  // 验证两次输入的密码是否相同
  if (password != password_repeat) {
    req.flash('err', '密码和确认密码不一致！');
    res.redirect('/users/reg');
    return;
  }

  // 加密存储密码
  // 创建一个md5加密的Hash对象
  var md5 = crypto.createHash('md5');
  // 操作Hash对象下的update(明文密码)
  // digest('hex')转换成十六进制
  password = md5.update(password).digest('hex');

  var user = new User({ name, password, email })
  user.get({ name }, function (err, u) {
    if (err) {
      req.flash('err', err.message)
      res.redirect('/users/reg');
      return;
    }

    if (u) {
      req.flash('err', '用户已存在！')
      res.redirect('/users/reg');
      return;
    }

    user.save(function (err, result) {
      if (err) {
        req.flash('err', err.message)
        res.redirect('/users/reg');
        return;
      }

      req.flash('success', '注册成功!');
      req.session.name = name;
      req.session.email = email;
      res.redirect('/');
    })
  })
});

// 退出登录
router.get('/logout', function (req, res, next) {
  req.session.name = null;
  req.flash('success', '退出成功');
  res.redirect('/');
});

router.get('/upload', check.checkLogin, function (req, res, next) {
  var src = req.query.src || '/images/default.jpg';
  res.render('upload', {
    title: '上传',
    success: req.flash('success').toString(),
    err: req.flash('err').toString(),
    user: req.session.name,
    src
  })
})

router.post('/upload', upload.array('userlogo', 3), function (req, res, next) {
  res.redirect('/users/upload?src=' + '/uploads/' + req.files[0].filename);
})

module.exports = router;
