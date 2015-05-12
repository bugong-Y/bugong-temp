/**
 * Created by bugong on 2015/4/25.
 */

'use strict';
var redisDriver = require('redis');
var redisClient = redisDriver.createClient();  //�õ�redis�ͻ���ʵ��
var makeString, deleteKey, getValue, setValue;

makeString = function (keyData) {//��JSON����ת�����ַ�����ʽ
    return (typeof keyData === 'string') ? keyData : JSON.stringify(keyData);
};

deleteKey = function (key) {//��redis�����У�ɾ��ĳ������
    redisClient.del(makeString(key));
};

getValue = function (key, hitCallBack, missCallBack) {//��redis�����У��õ�ĳ������
    redisClient.get(makeString(key), function (error, reply) {
        if (reply) {//����ɹ��ӻ����еõ�ĳ������
            console.log('HIT');
            hitCallBack(reply);
        } else {
            console.log('MISS');
            missCallBack();
        }
    });
};

setValue = function (key, value) {//��redis�����е���������
    redisClient.set(makeString(key), makeString(value));
};

module.exports = {
    deleteKey: deleteKey,
    getValue: getValue,
    setValue: setValue
};