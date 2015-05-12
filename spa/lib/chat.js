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

emitUserList = function (io) {//io，全局socket集合
    crud.read('user', {isOnline: true}, {}, function(resultList) {//读取所有在线用户
        io.of('/chat')
            .emit('listchange', resultList);  //向客户端发送用户列表变化事件，让每个客户端更新用户列表
    });
};

signIn = function (io, userMap, socket) {//用户登录
    crud.update('user', {'_id': userMap._id}, {isOnline: true}, function (resultMap) {
        emitUserList(io);  //向所有客户端，发送listchange事件
        userMap.isOnline = true;
        socket.emit('userupdate', userMap);  //客户端执行用户登录相关动作
    });
    chattingMap[userMap._id] = socket;  //缓存当前socket实例
    socket.userId = userMap._id;
};

signOut = function (io, userId) {//用户登出
    crud.update('user', {'_id': userId}, {isOnline: false}, function (resultList) {
        emitUserList(io);  //向所有客户端，发送listchange事件
    });
    delete  chattingMap[userId];
};

chatObj = {
    connect: function (server) {//对外暴露一个connect方法
        var io = socket.listen(server);  //socket.io模块监听服务器
        io.of('/chat')  //对应客户端的请求路径
            .on('connection', function (socket) {//当有客户端连接至该服务器时  socket相当于一个服务器客户端
                socket.on('adduser', function (userMap) {//监听客户端发送过来的adduser事件
                    crud.read('user', {name: userMap.name}, {}, function (resultList) {
                        var resultMap;
                        var cid = userMap.cid;  //缓存客户端传过来的客户端id
                        delete userMap.cid;  //删除客户端id
                        if (resultList.length > 0) {//如果数据库中已存在该用户
                            resultMap = resultList[0];  //从数据库中取得数据
                            if (chattingMap[resultMap._id]) {//当前用户已在其它客户端登录时，直接返回
                                console.log('user has logged in!');
                                return;
                            }
                            resultMap.cid = cid;  //给取得的数据对象，添加一个cid属性
                            signIn(io, resultMap, socket);  //io，代表socket.io
                        } else {//如果数据库中不存在该用户
                            userMap.isOnline = true;
                            crud.construct('user', userMap, function (resultList) {
                                resultMap = resultList[0];
                                resultMap.cid = cid;
                                chattingMap[resultMap._id] = socket;
                                socket.userId = resultMap._id;
                                socket.emit('userupdate', resultMap);  //客户端执行用户登录相关动作
                                emitUserList(io);  //向所有客户端，发送listchange事件
                            });
                        }
                    });
                });
                socket.on('updatechat', function (chatMap) {//监听客户端发送过来的updatechat事件
                    if (chattingMap.hasOwnProperty(chatMap.destId)) {//当正在聊天的对象在线
                        chattingMap[chatMap.destId].emit('updatechat', chatMap);  //得到目标对象的socket，向目标对象发送消息
                    } else {//当正在聊天的对象已经下线
                        socket.emit('updatechat', {//向当前发送消息的用户，发送目标用户已经下线的提示消息
                            senderId: chatMap.senderId,
                            msgText: chatMap.destName + ' has gone offline'
                        });
                    }
                });
                socket.on('leavechat', function () {//监听客户端用户点击退出登录时，发送过来的leavechat事件
                    console.log('** user %s logged out **', socket.userId);
                    signOut(io, socket.userId);
                });
                socket.on('disconnect', function () {//监听客户端用户关闭标签页时，发送过来的disconnect事件
                    console.log('** user %s closed brower window or tab **', socket.userId);
                    signOut(io, socket.userId);
                });
                socket.on('updateavatar', function (avatarMap) {//监听客户端用户改变头像时，发送过来的updateavatar事件
                    crud.update('user', {'_id': makeMongoId(avatarMap.personId)}, {cssMap: avatarMap.cssMap}, function (resultList) {
                        emitUserList(io);
                    });
                });
            });
        return io;
    }
};

module.exports = chatObj;