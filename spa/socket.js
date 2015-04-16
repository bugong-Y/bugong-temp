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
var io = socketIo.listen(server);  //socket.io����������
var countUp;
var count = 0;
var setWatch;
var watchMap = {};

countUp = function () {
    count++;
    console.log(count);
    io.sockets.send(count);  //socket.io��ͻ��˷�����Ϣ
};


setWatch = function (urlPath, fileType) {
    console.log('setWatch called on' + urlPath);
    if (!watchMap[urlPath]) {
        console.log('setting watch on' + urlPath);
        fs.watchFile(urlPath.slice(1), function (current, previous) {//ɾ��/����Ϊ�ļ�ϵͳ��Ҫ������Ե�ǰĿ¼�����·��
            if (current.mtime !== previous.mtime) {//�Ƚ��ļ���ǰ״̬����ǰ״̬��ʱ�����ȷ���Ƿ��޸�
                console.log('file changed');
                io.sockets.emit(fileType, urlPath); //��ͻ��˷���script��style�¼������������ļ���·��
            }
        });
        watchMap[urlPath] = true;
    }
};

app.configure(function () {
    app.use(function (request, response, next) {//ʹ���Զ�����м�������������о�̬��Դ
        if (request.url.indexOf('/js/') >= 0) {//����ű��ļ�
            setWatch(request.url, 'script');
        } else if (request.url.indexOf('/css/') >= 0) {//����css�ļ�
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
