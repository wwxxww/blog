// 数据访问层 DAL(data access layer)
var db = require('./db.js');
var tableName = 'users';

// 把数据库中的集合映射成javascript对象
function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

// 向对象的原型链中添加get方法
User.prototype.get = function (filter, cb) {
    db.findData(tableName, filter, {}, function (err, result) {
        if (err) { return cb(err); }

        var user = result.length == 0 ? null : result[0];
        cb(null, user);
    })
}

User.prototype.save = function (cb) {
    var users = [{
        name: this.name,
        password: this.password,
        email: this.email
    }];
    db.insertData(tableName, users, function (err, result) {
        if (err) { return cb(err); }

        cb(null, result);
    })
}

module.exports = User;

