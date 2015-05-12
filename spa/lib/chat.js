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

emitUserList = function (io) {//io��ȫ��socket����
    crud.read('user', {isOnline: true}, {}, function(resultList) {//��ȡ���������û�
        io.of('/chat')
            .emit('listchange', resultList);  //��ͻ��˷����û��б�仯�¼�����ÿ���ͻ��˸����û��б�
    });
};

signIn = function (io, userMap, socket) {//�û���¼
    crud.update('user', {'_id': userMap._id}, {isOnline: true}, function (resultMap) {
        emitUserList(io);  //�����пͻ��ˣ�����listchange�¼�
        userMap.isOnline = true;
        socket.emit('userupdate', userMap);  //�ͻ���ִ���û���¼��ض���
    });
    chattingMap[userMap._id] = socket;  //���浱ǰsocketʵ��
    socket.userId = userMap._id;
};

signOut = function (io, userId) {//�û��ǳ�
    crud.update('user', {'_id': userId}, {isOnline: false}, function (resultList) {
        emitUserList(io);  //�����пͻ��ˣ�����listchange�¼�
    });
    delete  chattingMap[userId];
};

chatObj = {
    connect: function (server) {//���Ⱪ¶һ��connect����
        var io = socket.listen(server);  //socket.ioģ�����������
        io.of('/chat')  //��Ӧ�ͻ��˵�����·��
            .on('connection', function (socket) {//���пͻ����������÷�����ʱ  socket�൱��һ���������ͻ���
                socket.on('adduser', function (userMap) {//�����ͻ��˷��͹�����adduser�¼�
                    crud.read('user', {name: userMap.name}, {}, function (resultList) {
                        var resultMap;
                        var cid = userMap.cid;  //����ͻ��˴������Ŀͻ���id
                        delete userMap.cid;  //ɾ���ͻ���id
                        if (resultList.length > 0) {//������ݿ����Ѵ��ڸ��û�
                            resultMap = resultList[0];  //�����ݿ���ȡ������
                            if (chattingMap[resultMap._id]) {//��ǰ�û����������ͻ��˵�¼ʱ��ֱ�ӷ���
                                console.log('user has logged in!');
                                return;
                            }
                            resultMap.cid = cid;  //��ȡ�õ����ݶ������һ��cid����
                            signIn(io, resultMap, socket);  //io������socket.io
                        } else {//������ݿ��в����ڸ��û�
                            userMap.isOnline = true;
                            crud.construct('user', userMap, function (resultList) {
                                resultMap = resultList[0];
                                resultMap.cid = cid;
                                chattingMap[resultMap._id] = socket;
                                socket.userId = resultMap._id;
                                socket.emit('userupdate', resultMap);  //�ͻ���ִ���û���¼��ض���
                                emitUserList(io);  //�����пͻ��ˣ�����listchange�¼�
                            });
                        }
                    });
                });
                socket.on('updatechat', function (chatMap) {//�����ͻ��˷��͹�����updatechat�¼�
                    if (chattingMap.hasOwnProperty(chatMap.destId)) {//����������Ķ�������
                        chattingMap[chatMap.destId].emit('updatechat', chatMap);  //�õ�Ŀ������socket����Ŀ���������Ϣ
                    } else {//����������Ķ����Ѿ�����
                        socket.emit('updatechat', {//��ǰ������Ϣ���û�������Ŀ���û��Ѿ����ߵ���ʾ��Ϣ
                            senderId: chatMap.senderId,
                            msgText: chatMap.destName + ' has gone offline'
                        });
                    }
                });
                socket.on('leavechat', function () {//�����ͻ����û�����˳���¼ʱ�����͹�����leavechat�¼�
                    console.log('** user %s logged out **', socket.userId);
                    signOut(io, socket.userId);
                });
                socket.on('disconnect', function () {//�����ͻ����û��رձ�ǩҳʱ�����͹�����disconnect�¼�
                    console.log('** user %s closed brower window or tab **', socket.userId);
                    signOut(io, socket.userId);
                });
                socket.on('updateavatar', function (avatarMap) {//�����ͻ����û��ı�ͷ��ʱ�����͹�����updateavatar�¼�
                    crud.update('user', {'_id': makeMongoId(avatarMap.personId)}, {cssMap: avatarMap.cssMap}, function (resultList) {
                        emitUserList(io);
                    });
                });
            });
        return io;
    }
};

module.exports = chatObj;