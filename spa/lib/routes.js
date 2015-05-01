/**
 * Created by bugong on 2015/4/15.
 */

'use strict';
var configRoutes;
var crud = require('./crud');
var chat = require('./chat');
var makeMongoId = crud.makeMongoId;

configRoutes = function (app, server) {
    app.get('/', function (request, response) {
        response.redirect('/spa.html');
    });
    app.all('/:objType/*?', function (request, response, next) {
        response.contentType('json');
        next();
    });
    app.get('/:objType/list', function (request, response) {//向客户端列出数据列表
        crud.read(request.params.objType, {}, {}, function (mapList) {
            response.send(mapList);
        });
    });
    app.post('/:objType/create', function (request, response) {//向数据库中创建一条数据
        crud.construct(request.params.objType, request.body, function (resultMap) {
            response.send(resultMap);
        });
    });
    app.get('/:objType/read/:id', function (request, response) {//从数据库中读取一条数据
        crud.read(request.params.objType, {_id: makeMongoId(request.params.id)}, {}, function (mapList) {
            response.send(mapList);
        });
    });
    app.post('/:objType/update/:id', function (request, response) {//向数据库中更新一条数据
        crud.update(request.params.objType, {_id: makeMongoId(request.params.id)}, request.body, function (resultMap) {
            response.send(resultMap);
        });
    });
    app.get('/:objType/delete/:id', function (request, response) {//从数据库中删除一条数据
        crud.destroy(request.params.objType, {_id: makeMongoId(request.params.id)}, function (resultMap) {
            response.send(resultMap);
        });
    });
    chat.connect(server);  //socketio监听服务器
};

module.exports = {
    configRoutes: configRoutes
};