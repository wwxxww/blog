var express = require('express');
var route = express.Router();
var Article = require('../models/article.js');
var check = require('../modules/check.js')
var Comment = require('../models/comment.js');

// 进入发布页面
route.get('/post', check.checkLogin, function (req, res, next) {
    res.render('articles/post', {
        title: '发布',
        success: req.flash('success').toString(),
        err: req.flash('err').toString(),
        user: req.session.name
    })
})

// 发布文章
route.post('/post', check.checkLogin, function (req, res, next) {
    var title = req.body.title;
    var tag1 = req.body.tag1;
    var tag2 = req.body.tag2;
    var tag3 = req.body.tag3;
    var content = req.body.content;

    if (!title || !content) {
        req.flash('err', '标题，正文都不能为空！');
        res.redirect('/articles/post');
        return;
    }

    if (!(tag1 || tag2 || tag3)) {
        req.flash('err', '标签必须输入一个！');
        res.redirect('/articles/post');
        return;
    }

    // 保存字段，标题，内容，标签，发表时间，发表作者，评论信息，阅读次数
    var article = new Article({
        title: title,
        content: content,
        tags: [tag1, tag2, tag3],
        createTime: new Date(),
        author: req.session.name,
        comments: [],
        readCount: 0
    })

    article.save(function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('/articles/post');
            return;
        }

        req.flash('success', '发表成功！');
        res.redirect('/');
    })

})

// 进入详情页面
route.get('/detail/:id?', function (req, res, next) {
    var id = req.params.id;
    if (!id) {
        req.flash('err', 'id参数错误！');
        res.redirect('/');
        return;
    }

    var article = new Article();
    article.getOne(id, true, function (err, result) {
        res.render('articles/detail', {
            title: result.title,
            success: req.flash('success').toString(),
            err: req.flash('err').toString(),
            user: req.session.name ? { name: req.session.name, email: req.session.email } : null,
            article: result
        })
    })
})

// 进入某个用户发表的文章列表页面
route.get('/user/:author?', function (req, res, next) {
    var author = req.params.author;
    if (!author) {
        req.flash('err', 'author参数出错！');
        res.redirect('/');
        return;
    }

    var article = new Article();
    var filter = { author: author }

    var pageCount = req.query.pagecount;
    pageCount = pageCount ? parseInt(pageCount) : 1;

    var pageSize = req.query.pagesize;
    pageSize = pageSize ? parseInt(pageSize) : 3;

    article.getPaged(filter, pageCount, pageSize, function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('/');
            return;
        }
        res.render('articles/userarticle', {
            title: author,
            success: req.flash('success').toString(),
            err: req.flash('err').toString(),
            user: req.session.name,
            articles: result.articles,
            pageInfo: {
                pageCount,
                pageSize,
                pageTotalCount: Math.ceil(result.totalCount / pageSize)
            }
        })
    })
})

// 发表评论
route.post('/comment', function (req, res, next) {
    var author = req.body.author;
    var email = req.body.email;
    var website = req.body.website;
    var content = req.body.content;
    var id = req.body.id;

    if (!author) {
        req.flash('err', '姓名不能为空！');
        res.redirect('back');
        return;
    }

    var comment = new Comment({
        author,
        email,
        website,
        createTime: new Date(),
        content
    })

    comment.save(id, function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('back');
            return;
        }

        res.redirect('back');
    })
})

// 包含某个标签的文章列表页面
route.get('/tags/:tag?', function (req, res, next) {
    var tag = req.params.tag;
    if (!tag) {
        req.flash('err', '标签不能为空！');
        res.redirect('/');
        return;
    }

    var article = new Article();
    article.getTagArticle(tag, function (err, result) {
        if (err) {
            req.flash('err', '标签不能为空！');
            res.redirect('/');
            return;
        }
        res.render('articles/tagarticle', {
            title: tag,
            success: req.flash('success').toString(),
            err: req.flash('err').toString(),
            user: req.session.name,
            articles: result
        })
    })
})

// 删除文章（只有自己的文章可删除）
route.get('/remove/:id?', check.checkLogin, function (req, res, next) {
    var id = req.params.id;
    if (!id) {
        req.flash('err', 'id参数错误！');
        res.redirect('/');
        return;
    }

    var article = new Article();
    var author = req.session.name;
    article.remove(id, author, function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('/');
            return;
        }
        req.flash('success', '删除成功了！')
        res.redirect('/');
    })
})

// 进入编辑文章页面（只有自己的文章可编辑）
route.get('/edit/:id?', check.checkLogin, function (req, res, next) {
    var id = req.params.id;
    if (!id) {
        req.flash('err', 'id参数错误！');
        res.redirect('/');
        return;
    }

    var article = new Article();
    article.getOne(id, false, function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('/');
            return;
        }

        res.render('articles/edit', {
            title: '编辑',
            success: req.flash('success').toString(),
            err: req.flash('err').toString(),
            user: req.session.name,
            article: result
        })
    })
})

// 提交编辑
route.post('/edit/:id?', check.checkLogin, function (req, res, next) {
    var id = req.body.id;
    var title = req.body.title;
    var tag1 = req.body.tag1;
    var tag2 = req.body.tag2;
    var tag3 = req.body.tag3;
    var content = req.body.content;
    if (!id) {
        req.flash('err', 'id参数错误！');
        res.redirect('back');
        return;
    }

    if (!title || !content) {
        req.flash('err', '标题，正文都不能为空！');
        res.redirect('back');
        return;
    }

    if (!(tag1 || tag2 || tag3)) {
        req.flash('err', '标签必须输入一个！');
        res.redirect('back');
        return;
    }

    var article = new Article({
        title: title,
        content: content,
        tags: [tag1, tag2, tag3],
        createTime: new Date(),
        author: req.session.name,
        comments: [],
        readCount: 0
    })

    article.editSave(id, function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('back');
            return;
        }

        req.flash('success', '编辑成功！');
        res.redirect('/');
    })
})

route.get('/type', function (req, res, next) {
    var article = new Article();
    article.get(function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('/');
            return;
        }
        res.render('articles/type', {
            title: '存档',
            success: req.flash('success').toString(),
            err: req.flash('err').toString(),
            user: req.session.name,
            articles: result
        })
    })
})

route.get('/taglist', function (req, res, next) {
    var article = new Article();
    article.getTags(function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('/');
            return;
        }
        res.render('articles/taglist', {
            title: '标签',
            success: req.flash('success').toString(),
            err: req.flash('err').toString(),
            user: req.session.name,
            tags: result
        })
    })
})

route.get('/search', function (req, res, next) {
    var keyword = req.query.keyword;

    var filter = {}
    var reg = new RegExp(keyword, 'i');
    if (keyword) {
        filter = { title: reg }
    }
    var article = new Article();
    article.search(filter, function (err, result) {
        if (err) {
            req.flash('err', err.message);
            res.redirect('/');
            return;
        }
        res.render('articles/search', {
            title: '搜索',
            success: req.flash('success').toString(),
            err: req.flash('err').toString(),
            user: req.session.name,
            articles: result
        })
    })
})

module.exports = route;