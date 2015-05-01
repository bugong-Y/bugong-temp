/**
 * Created by bugong on 2015/4/22.
 */

'use strict';
var chatObj;
var socket = require('socket.io');
var crud = require('./crud');
var emitUserList, signIn, signOut;
var makeMongoId = crud.makeMongoId;
var chattingMap = {};

emitUserList = function (io) {//发布listchange事件，更新列表
    crud.read('user', {isOnline: true}, {}, function(resultList) {
        io.of('/chat')
            .emit('listchange', resultList);
    });
};

signIn = function (io, userMap, socket) {//用户登录
    crud.update('user', {'_id': userMap._id}, {isOnline: true}, function (resultMap) {
        emitUserList(io);
        userMap.isOnline = true;
        socket.emit('userupdate', userMap);  //发布userupdate事件，更新该用户信息
    });
    chattingMap[userMap._id] = socket;  //缓存当前用户的socket连接
    socket.userId = userMap._id;
};

signOut = function (io, userId) {//用户登出
    crud.update('user', {'_id': userId}, {isOnline: false}, function (resultList) {
        emitUserList(resultList);
    });
    delete  chattingMap[userId];
};

chatObj = {
    connect: function (server) {
        var io = socket.listen(server);
        io.set('blacklist', [])
            .of('/chat')
            .on('connection', function (socket) {
                socket.on('adduser', function (userMap) {//增加一个新用户
                    crud.read('user', {name: userMap.name}, {}, function (resultList) {
                        var resultMap;
                        var cid = userMap.cid;
                        delete userMap.cid;
                        if (resultList.length > 0) {//如果已存在该用户
                            resultMap = resultList[0];
                            resultMap.cid = cid;
                            signIn(io, resultMap, socket);   //登录
                        } else {
                            userMap.isOnline = true;
                            crud.construct('user', userMap, function (resultList) {//创建新用户
                                resultMap = resultList[0];
                                resultMap.cid = cid;
                                chattingMap[resultMap._id] = socket;
                                socket.userId = resultMap._id;
                                socket.emit('userupdate', resultMap);  //发布userupdate事件，更新该用户信息
                                emitUserList(io);  //发布listchange事件，更新列表
                            });
                        }
                    });
                });
                socket.on('updatechat', function (chatMap) {//更新聊天室
                    if (chattingMap.hasOwnProperty(chatMap.destId)) {//如果信息接收者，仍然在线
                        chattingMap[chatMap.destId].emit('updatechat', chatMap);
                    } else {//如果信息接收者，下线了
                        socket.emit('updatechat', {//系统消息
                            senderId: chatMap.senderId,
                            msgText: chatMap.destName + 'has gone offline'
                        });
                    }
                });
                socket.on('leavechat', function () {//用户正常退出
                    console.log('** user %s logged out **', socket.userId);
                    signOut(io, socket.userId);
                });
                socket.on('disconnect', function () {//用户关闭标签页退出
                    console.log('** user %s closed brower window or tab **', socket.userId);
                    signOut(io, socket.userId);
                });
                socket.on('updateavatar', function (avatarMap) {//更新用户头像
                    crud.update('user', {'_id': makeMongoId(avatarMap.personId)}, {cssMap: avatarMap.cssMap}, function (resultList) {
                        emitUserList(io);
                    });
                });
            });
        return io;
    }
};

module.exports = chatObj;