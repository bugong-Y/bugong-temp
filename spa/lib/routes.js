/**
 * Created by bugong on 2015/4/15.
 */

'use strict';
var configRoutes;
var crud = require('./crud');
var chat = require('./chat');  //得到chatObj对象
var makeMongoId = crud.makeMongoId;
var agentText = '<h1>single page application bugong!</h1>';  //SEO,搜索引擎优化

configRoutes = function (app, server) {//配置路由
    app.all('*', function (req, res, next) {//对所有请求预处理
        if (req.headers['user-agent'] === 'Googlebot/2.1 (+http://www.googlebot.com/bot.html)') {//判断访问者，是否为Google爬虫
            res.contentType('html');
            res.end(agentText);
        } else {
            next();
        }
    });
    app.get('/', function (request, response) {//配置域名默认跳转
        response.redirect('/spa.html');
    });
    app.all('/:objType/*?', function (request, response, next) {//全局配置返回数据的格式
        response.contentType('json');
        next();
    });
    app.get('/:objType/list', function (request, response) {//向客户端列出用户列表
        crud.read(request.params.objType, {}, {}, function (mapList) {
            response.send(mapList);
        });
    });
    app.post('/:objType/create', function (request, response) {//向数据库中添加用户
        crud.construct(request.params.objType, request.body, function (resultMap) {
            response.send(resultMap);
        });
    });
    app.get('/:objType/read/:id', function (request, response) {//从数据库中读取某用户信息
        crud.read(request.params.objType, {_id: makeMongoId(request.params.id)}, {}, function (mapList) {
            response.send(mapList);
        });
    });
    app.post('/:objType/update/:id', function (request, response) {//更新数据库中的某用户信息
        crud.update(request.params.objType, {_id: makeMongoId(request.params.id)}, request.body, function (resultMap) {
            response.send(resultMap);
        });
    });
    app.get('/:objType/delete/:id', function (request, response) {//从数据库中删除某用户数据
        crud.destroy(request.params.objType, {_id: makeMongoId(request.params.id)}, function (resultMap) {
            response.send(resultMap);
        });
    });

    chat.connect(server);  //socket.io监听服务器
};

module.exports = {
    configRoutes: configRoutes
};