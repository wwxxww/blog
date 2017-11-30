var db = require('./db.js');
var tableName = 'articles';

// 创建文章对象
function Article(article) {
    if (article) {
        this.title = article.title;
        this.content = article.content;
        this.tags = article.tags;
        this.createTime = db.formatDate(article.createTime);
        this.author = article.author;
        this.comments = article.comments;
        this.readCount = article.readCount;
    }
}

Article.prototype.save = function (cb) {
    var docs = [this];
    db.insertData(tableName, docs, function (err, result) {
        if (err) { return cb(err); }

        return cb(null, result);
    })
}

Article.prototype.editSave = function (id, cb) {
    var filter = { _id: new db.ObjectID(id) };
    var author = this.author;
    var update = {
        $set: {
            title: this.title,
            content: this.content,
            tags: this.tags
        }
    }
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
                    if (article.author != author) {
                        db.close();
                        return cb({ code: 201, message: '只能编辑自己的文章' });
                    }

                    collection.update(filter, update, function (err, result) {
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

Article.prototype.get = function (cb) {
    db.findData(tableName, {}, { createTime: -1 }, function (err, result) {
        if (err) { return cb(err); }

        return cb(null, result);
    })
}

Article.prototype.search = function (filter, cb) {
    db.findData(tableName, filter, { createTime: -1 }, function (err, result) {
        if (err) { return cb(err); }

        return cb(null, result);
    })
}

Article.prototype.getPaged = function (filter, pageCount, pageSize, cb) {
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
            // count()用来获取数据的个数
            // totalCount: 根据筛选条件filter查询出来的数据个数
            collection.count(filter, function (err, totalCount) {
                if (err) {
                    db.close();
                    return cb(err);
                }
                // 你想显示的列
                var showCol = {
                    _id: 1,
                    title: 1,
                    content: 1,
                    tags: 1,
                    createTime: 1,
                    author: 1,
                    comments: 1,
                    readCount: 1
                };
                // 跨过的数据个数 假定pageSize：10  [1-10)[10-20)
                var skip = (pageCount - 1) * pageSize;
                // limit： 限制只取pageSize条数据
                collection.find(filter, showCol, skip, pageSize)
                .sort({createTime: -1}) // 排序
                .toArray(function (err, result) { // 转换成数组
                    if (err) {
                        db.close();
                        return cb(err);
                    }
                    db.close();
                    var data = {
                        articles: result,
                        totalCount: totalCount
                    }
                    return cb(null, data);
                })

            })
        })
    })
}

Article.prototype.getOne = function (id, isUpdateReadCount, cb) {
    var filter = { _id: new db.ObjectID(id) };
    db.open(function (err, db) {
        if (err) {
            db.close();
            return cb(err)
        };
        db.collection(tableName, function (err, collection) {
            collection.findOne(filter, function (err, article) {
                if (err) {
                    db.close();
                    return cb(err);
                }

                if (article) {
                    if (isUpdateReadCount) {
                        // { $set: { readCount: article.readCount + 1 }
                        collection.update(filter, { $inc: { readCount: 1 } }, function (err, result) {
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
                } else {
                    db.close();
                    return cb(null, article);
                }
            })
        })
    })
}

Article.prototype.remove = function (id, author, cb) {
    var filter = { _id: new db.ObjectID(id) };
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
                    if (article.author == author) {
                        collection.remove(filter, function (err, result) {
                            if (err) {
                                db.close();
                                return cb(err);
                            }
                            db.close();
                            return cb(null, article);
                        })
                    } else {
                        db.close();
                        return cb({ code: 201, message: '你只能删除你自己发表的文章！' });
                    }
                } else {
                    db.close();
                    return cb(null, article);
                }
            })
        })
    })
}

Article.prototype.getUserArticle = function (author, cb) {
    db.findData(tableName, { author }, { createTime: -1 }, function (err, result) {
        if (err) {
            return cb(err);
        }
        return cb(null, result);
    })
}

Article.prototype.getTagArticle = function (tag, cb) {
    db.findData(tableName, { tags: tag }, { createTime: -1 }, function (err, result) {
        if (err) {
            return cb(err);
        }
        return cb(null, result);
    })
}

Article.prototype.getTags = function (cb) {
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
            collection.distinct('tags', {}, function (err, result) {
                if (err) {
                    db.close();
                    return cb(err);
                }

                db.close();
                return cb(null, result);
            })
        })
    })
}

module.exports = Article;