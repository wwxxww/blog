// 判断是否登录，未登录跳转到login
function checkLogin(req, res, next) {
    if (!req.session.name) {
        res.redirect('/users/login');
        return;
    }
    next();
}

// 判断登录过，跳转到主页，不让再次登录和注册
function checkLogined(req, res, next){
    if(req.session.name){
        res.redirect('/');
        return;
    }
    next();
}

module.exports = {
    checkLogin,
    checkLogined
}