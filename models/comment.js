var db = require('./db.js');
var tableName = 'articles'
// 定义评论的对象
function Comment(comment) {
    if (comment) {
        this.author = comment.author;
        this.email = comment.email;
        this.website = comment.website;
        this.createTime = db.formatDate(comment.createTime);
        this.content = comment.content;
    }
}

Comment.prototype.save = function (id, cb) {
    var filter = { _id: new db.ObjectID(id) };
    var comment = {
        author: this.author,
        email: this.email,
        website: this.website,
        createTime: db.formatDate(this.createTime),
        content: this.content
    };
    db.open(function (err, db) {
        if (err) {
            db.close();
            return cb(err);
        }
        db.collection(tableName, function (err, collection) {
            if (err) {
                db.close();
                return cb(err);
            }
            collection.findOne(filter, function (err, article) {
                if (err) {
                    db.close();
                    return cb(err);
                }
                if (article) {
                    // 保留到article对象中，对象是存储在内存中
                    article.comments.push(comment);
                    // 更新数据库，永久保存
                    collection.update(filter, { $set: { comments: article.comments } }, function (err, result) {
                        if (err) {
                            db.close();
                            return cb(err);
                        }

                        db.close();
                        return cb(null, article);
                    })
                } else {
                    db.close();
                    return cb(null, article);
                }
            })
        })
    })
}

module.exports = Comment;