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

emitUserList = function (io) {//����listchange�¼��������б�
    crud.read('user', {isOnline: true}, {}, function(resultList) {
        io.of('/chat')
            .emit('listchange', resultList);
    });
};

signIn = function (io, userMap, socket) {//�û���¼
    crud.update('user', {'_id': userMap._id}, {isOnline: true}, function (resultMap) {
        emitUserList(io);
        userMap.isOnline = true;
        socket.emit('userupdate', userMap);  //����userupdate�¼������¸��û���Ϣ
    });
    chattingMap[userMap._id] = socket;  //���浱ǰ�û���socket����
    socket.userId = userMap._id;
};

signOut = function (io, userId) {//�û��ǳ�
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
                socket.on('adduser', function (userMap) {//����һ�����û�
                    crud.read('user', {name: userMap.name}, {}, function (resultList) {
                        var resultMap;
                        var cid = userMap.cid;
                        delete userMap.cid;
                        if (resultList.length > 0) {//����Ѵ��ڸ��û�
                            resultMap = resultList[0];
                            resultMap.cid = cid;
                            signIn(io, resultMap, socket);   //��¼
                        } else {
                            userMap.isOnline = true;
                            crud.construct('user', userMap, function (resultList) {//�������û�
                                resultMap = resultList[0];
                                resultMap.cid = cid;
                                chattingMap[resultMap._id] = socket;
                                socket.userId = resultMap._id;
                                socket.emit('userupdate', resultMap);  //����userupdate�¼������¸��û���Ϣ
                                emitUserList(io);  //����listchange�¼��������б�
                            });
                        }
                    });
                });
                socket.on('updatechat', function (chatMap) {//����������
                    if (chattingMap.hasOwnProperty(chatMap.destId)) {//�����Ϣ�����ߣ���Ȼ����
                        chattingMap[chatMap.destId].emit('updatechat', chatMap);
                    } else {//�����Ϣ�����ߣ�������
                        socket.emit('updatechat', {//ϵͳ��Ϣ
                            senderId: chatMap.senderId,
                            msgText: chatMap.destName + 'has gone offline'
                        });
                    }
                });
                socket.on('leavechat', function () {//�û������˳�
                    console.log('** user %s logged out **', socket.userId);
                    signOut(io, socket.userId);
                });
                socket.on('disconnect', function () {//�û��رձ�ǩҳ�˳�
                    console.log('** user %s closed brower window or tab **', socket.userId);
                    signOut(io, socket.userId);
                });
                socket.on('updateavatar', function (avatarMap) {//�����û�ͷ��
                    crud.update('user', {'_id': makeMongoId(avatarMap.personId)}, {cssMap: avatarMap.cssMap}, function (resultList) {
                        emitUserList(io);
                    });
                });
            });
        return io;
    }
};

module.exports = chatObj;