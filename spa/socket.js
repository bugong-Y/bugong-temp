/**
 * Created by bugong on 2015/4/15.
 */

'use strict';
var http = require('http');
var express = require('express');
var socketIo = require('socket.io');
var fs = require('fs');
var app = express();
var server = http.createServer(app);
var io = socketIo.listen(server);  //socket.io监听服务器
var countUp;
var count = 0;
var setWatch;
var watchMap = {};

countUp = function () {
    count++;
    console.log(count);
    io.sockets.send(count);  //socket.io向客户端发送消息
};


setWatch = function (urlPath, fileType) {
    console.log('setWatch called on' + urlPath);
    if (!watchMap[urlPath]) {
        console.log('setting watch on' + urlPath);
        fs.watchFile(urlPath.slice(1), function (current, previous) {//删除/，因为文件系统需要的是相对当前目录的相对路径
            if (current.mtime !== previous.mtime) {//比较文件当前状态和先前状态的时间戳，确定是否被修改
                console.log('file changed');
                io.sockets.emit(fileType, urlPath); //向客户端发送script或style事件，并包含了文件的路径
            }
        });
        watchMap[urlPath] = true;
    }
};

app.configure(function () {
    app.use(function (request, response, next) {//使用自定义的中间件，来监听所有静态资源
        if (request.url.indexOf('/js/') >= 0) {//请求脚本文件
            setWatch(request.url, 'script');
        } else if (request.url.indexOf('/css/') >= 0) {//请求css文件
            setWatch(request.url, 'stylesheet');
        }
        next();
    });
    app.use(express.static(__dirname + '/'));
});
app.get('/', function (request, response) {
    response.redirect('/public/socket1.0.html');
});

server.listen(3000);
console.log('express server is listening on port %d in %s mode', server.address().port, app.settings.env);

//setInterval(countUp, 1000);
