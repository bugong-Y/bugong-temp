'use strict';

var http = require('http');
var express = require('express');
var app = express();
var routes = require('./lib/routes.js');
var server;

app.configure(function () {//app.configure用来组织中间件
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    //app.use(express.basicAuth('yyl', '123789'));
    app.use(express.static(__dirname + '/public'));  //__dirname为系统根目录，全局变量
    app.use(app.router);
});
app.configure('development', function () {//开发环境  SET NODE_ENV=development node app
    console.log('development');
    app.use(express.logger());
    app.use(express.errorHandler({
        dumpException: true,
        showStack: true
    }));
});
app.configure('production' ,function () {//生产环境
    console.log('production');
    app.use(express.errorHandler());
});

server = http.createServer(app);
routes.configRoutes(app, server);
server.listen(3000);

console.log('express server is listening on port %d in %s mode', server.address().port, app.settings.env);