/**
 * Created by bugong on 2015/4/25.
 */

'use strict';
var redisDriver = require('redis');
var redisClient = redisDriver.createClient();  //得到redis客户端实例
var makeString, deleteKey, getValue, setValue;

makeString = function (keyData) {//将JSON对象，转换成字符串形式
    return (typeof keyData === 'string') ? keyData : JSON.stringify(keyData);
};

deleteKey = function (key) {//从redis缓存中，删除某条数据
    redisClient.del(makeString(key));
};

getValue = function (key, hitCallBack, missCallBack) {//从redis缓存中，得到某条数据
    redisClient.get(makeString(key), function (error, reply) {
        if (reply) {//如果成功从缓存中得到某条数据
            console.log('HIT');
            hitCallBack(reply);
        } else {
            console.log('MISS');
            missCallBack();
        }
    });
};

setValue = function (key, value) {//在redis缓存中的设置数据
    redisClient.set(makeString(key), makeString(value));
};

module.exports = {
    deleteKey: deleteKey,
    getValue: getValue,
    setValue: setValue
};