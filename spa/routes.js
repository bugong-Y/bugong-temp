/**
 * Created by bugong on 2015/4/15.
 */

'use strict';
var configRoutes;

configRoutes = function (app) {
    app.get('/', function (request, response) {
        response.redirect('/spa.html');
    });
    app.all('/:objType/*?', function (request, response, next) {
        response.contentType('json');
        next();
    });
    app.get('/:objType/list', function (request, response) {
        response.send({
            title: request.params.objType + 'user list'
        });
    });
    app.post('/:objType/create', function (request, response) {
        response.send({
            title: request.params.objType + 'user list created'
        });
    });
    app.get('/:objType/read/:id([0-9]+)', function (request, response) {
        response.send({
            title: 'user with id ' + request.params.objType + request.params.id + ' found'
        });
    });
    app.post('/:objType/update/:id([0-9]+)', function (request, response) {
        response.send({
            title: 'user with id ' + request.params.objType + request.params.id + ' updated'
        });
    });
    app.get('/:objType/delete/:id([0-9]+)', function (request, response) {
        response.send({
            title: 'user with id ' + request.params.objType + request.params.id + ' deleted'
        });
    });
};

module.exports = {
    configRoutes: configRoutes
};