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
    app.get('/:objType/list', function (request, response) {//��ͻ����г������б�
        crud.read(request.params.objType, {}, {}, function (mapList) {
            response.send(mapList);
        });
    });
    app.post('/:objType/create', function (request, response) {//�����ݿ��д���һ������
        crud.construct(request.params.objType, request.body, function (resultMap) {
            response.send(resultMap);
        });
    });
    app.get('/:objType/read/:id', function (request, response) {//�����ݿ��ж�ȡһ������
        crud.read(request.params.objType, {_id: makeMongoId(request.params.id)}, {}, function (mapList) {
            response.send(mapList);
        });
    });
    app.post('/:objType/update/:id', function (request, response) {//�����ݿ��и���һ������
        crud.update(request.params.objType, {_id: makeMongoId(request.params.id)}, request.body, function (resultMap) {
            response.send(resultMap);
        });
    });
    app.get('/:objType/delete/:id', function (request, response) {//�����ݿ���ɾ��һ������
        crud.destroy(request.params.objType, {_id: makeMongoId(request.params.id)}, function (resultMap) {
            response.send(resultMap);
        });
    });
    chat.connect(server);  //socketio����������
};

module.exports = {
    configRoutes: configRoutes
};