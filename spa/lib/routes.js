/**
 * Created by bugong on 2015/4/15.
 */

'use strict';
var configRoutes;
var crud = require('./crud');
var chat = require('./chat');  //�õ�chatObj����
var makeMongoId = crud.makeMongoId;
var agentText = '<h1>single page application bugong!</h1>';  //SEO,���������Ż�

configRoutes = function (app, server) {//����·��
    app.all('*', function (req, res, next) {//����������Ԥ����
        if (req.headers['user-agent'] === 'Googlebot/2.1 (+http://www.googlebot.com/bot.html)') {//�жϷ����ߣ��Ƿ�ΪGoogle����
            res.contentType('html');
            res.end(agentText);
        } else {
            next();
        }
    });
    app.get('/', function (request, response) {//��������Ĭ����ת
        response.redirect('/spa.html');
    });
    app.all('/:objType/*?', function (request, response, next) {//ȫ�����÷������ݵĸ�ʽ
        response.contentType('json');
        next();
    });
    app.get('/:objType/list', function (request, response) {//��ͻ����г��û��б�
        crud.read(request.params.objType, {}, {}, function (mapList) {
            response.send(mapList);
        });
    });
    app.post('/:objType/create', function (request, response) {//�����ݿ�������û�
        crud.construct(request.params.objType, request.body, function (resultMap) {
            response.send(resultMap);
        });
    });
    app.get('/:objType/read/:id', function (request, response) {//�����ݿ��ж�ȡĳ�û���Ϣ
        crud.read(request.params.objType, {_id: makeMongoId(request.params.id)}, {}, function (mapList) {
            response.send(mapList);
        });
    });
    app.post('/:objType/update/:id', function (request, response) {//�������ݿ��е�ĳ�û���Ϣ
        crud.update(request.params.objType, {_id: makeMongoId(request.params.id)}, request.body, function (resultMap) {
            response.send(resultMap);
        });
    });
    app.get('/:objType/delete/:id', function (request, response) {//�����ݿ���ɾ��ĳ�û�����
        crud.destroy(request.params.objType, {_id: makeMongoId(request.params.id)}, function (resultMap) {
            response.send(resultMap);
        });
    });

    chat.connect(server);  //socket.io����������
};

module.exports = {
    configRoutes: configRoutes
};