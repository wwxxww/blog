// 数据库层 database layer
var mongodb = require('mongodb');
var server = new mongodb.Server('127.0.0.1', 27017);
var db = new mongodb.Db('myblog', server);
var Err = require('./error.js');
var error = new Err(200, "成功!");

// 公共的方法
// db: 操作的数据库对象
// operator：操作的类型： insert, find, update, remove
// collection：操作的集合名称
// filter：是查询时的过滤条件，更新时的过滤条件，删除时的过滤条件
// update：只对更新有效，指更新的列表
// docs：只对插入有效，指插入的数组
// cb：是执行成功或失败的回调函数callback
function operator(db, operator, collection, filter, sort, update, docs, cb) {
    db.open(function (err, db) {
        if (err) {
            error.code = 201;
            error.message = '数据库打开出错!';
            db.close();
            return cb(error);
        }

        db.collection(collection, function (err, c) {
            if (err) {
                error.code = 201;
                error.message = '获取集合出错!';
                db.close();
                return cb(error);
            }

            if (operator == "insert") {
                c.insertMany(docs, function (err, result) {
                    if (err) {
                        error.code = 201;
                        error.message = '添加数据出错!';
                        db.close();
                        return cb(error);
                    }

                    db.close();
                    cb(null, result);
                })
            }

            if (operator == "find") {
                c.find(filter).sort(sort).toArray(function (err, result) {
                    if (err) {
                        error.code = 201;
                        error.message = '查询数据出错!';
                        db.close();
                        return cb(error);
                    }

                    db.close();
                    cb(null, result);
                });
            }

            if (operator == "update") {
                c.update(filter, update, function (err, result) {
                    if (err) {
                        error.code = 201;
                        error.message = '更新数据出错!';
                        db.close();
                        return cb(error);
                    }

                    db.close();
                    cb(null, result);
                })
            }

            if (operator == "remove") {
                c.remove(filter, function (err, result) {
                    if (err) {
                        error.code = 201;
                        error.message = '删除数据出错!';
                        db.close();
                        return cb(error);
                    }

                    db.close();
                    cb(null, result);
                })
            }

        })
    })
}

function formatDate(date) {
    var y = date.getFullYear();
    var M = date.getMonth() + 1;
    var D = date.getDate();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    M = M < 10 ? '0' + M : M;
    D = D < 10 ? '0' + D : D;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    s = s < 10 ? '0' + s : s;
    return y + '-' + M + '-' + D + ' ' + h + ':' + m + ":" + s;
}

// 给db对象扩展添加方法
db.insertData = function (collection, docs, cb) {
    operator(this, 'insert', collection, null, null, null, docs, cb);
}
// 给db对象扩展更新方法
db.updateData = function (collection, filter, update, cb) {
    operator(this, 'update', collection, filter, null, update, null, cb);
}
// 给db对象扩展查询方法
db.findData = function (collection, filter, sort, cb) {
    operator(this, 'find', collection, filter, sort, null, null, cb);
}
// 给db对象扩展删除方法
db.removeData = function (collection, filter, cb) {
    operator(this, 'remove', collection, filter, null, null, null, cb);
}
// 给db对象扩展ObjectID类型
db.ObjectID = mongodb.ObjectID;
// 给db对象扩展格式化日期函数
db.formatDate = formatDate;

module.exports = db;

