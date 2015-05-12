/**
 * Created by bugong on 2015/4/21.
 */

'use strict';

var mongodb = require('mongodb');
var fsHandle = require('fs');
var JSV = require('JSV').JSV;
//var cache = require('./cache');
var mongoServer = new mongodb.Server('localhost', mongodb.Connection.DEFAULT_PORT);
var dbHandle = new mongodb.Db('spa', mongoServer, {safe: true});
var makeMongoId = mongodb.ObjectID;  //生成数据_id
var objTypeMap = {
    user: {}
};
var loadSchema;
var validator = JSV.createEnvironment();
var checkSchema;
var clearIsOnline;
var checkType, constructObj, readObj, updateObj, destroyObj;

loadSchema = function (schemaName, schemaPath) {//加载数据格式验证文件
    fsHandle.readFile(schemaPath, 'utf-8', function (error, data) {
        objTypeMap[schemaName] = JSON.parse(data);  //将验证文件的内容解析为object对象，存入objTypeMap这个数据合法性验证对象
    });
};

checkSchema = function (objType, objMap, callback) {//验证数据格式操作
    var schemaMap = objTypeMap[objType];  //规定的数据格式
    var reportMap = validator.validate(objMap, schemaMap);  //objMap，想要验证的数据
    callback(reportMap.errors);  //根据reportMap.errors的length属性，执行回调
};

(function () {//自执行函数，得到验证数据格式的json文件
    var schemaName, schemaPath;
    for (schemaName in objTypeMap) {
        if (objTypeMap.hasOwnProperty(schemaName)) {
            schemaPath = __dirname + '/' + schemaName + '.json';  //__dirname  D:\网站\bugong\spa\lib
            loadSchema(schemaName, schemaPath);  //加载验证文件
        }
    }
}());

checkType = function (objType) {//检测数据库中是否包含某张表
    if (!objTypeMap[objType]) {
        return {
            errorMsg: 'object type " ' + objType + ' "is not supported'
        };
    }
    return null;  //检测通过时，返回空
};

clearIsOnline = function () {//让客户端所有用户下线
    updateObj(
        'user',
        {isOnline: true},
        {isOnline: false},
        function (responseMap) {
            console.log('All users set to offline', responseMap);
        }
    );
};

dbHandle.open(function () {//打开数据库
    console.log('** Connected to MongoDB **');
});

constructObj = function (objType, objMap, callback) {//向数据库中插入数据
    var typeCheckMap = checkType(objType);  //验证数据库中，是否含有某张表
    if (typeCheckMap) {
        callback(typeCheckMap);
        return;
    }
    checkSchema(objType, objMap, function (errorList) {//对数据格式进行验证
        if (errorList.length === 0) {//数据格式验证通过
            dbHandle.collection(objType, function (error, collection) {
                var optionsMap = {safe: true};  //safe指定成功把文档插入MongoDB里面才会调用回调函数
                collection.insert(objMap, optionsMap, function (error, resultMap) {//向数据库中插入数据
                    console.log(resultMap);
                    callback(resultMap);
                });
            });
        } else {//数据格式不规范
            callback({
                errorMsg: 'input document not valid',
                errorList: errorList
            });
        }
    });
};

readObj = function (objType, findMap, fieldsMap, callback) {//从数据库中读取数据
    var typeCheckMap = checkType(objType);  //验证数据库中，是否含有某张表
    if (typeCheckMap) {
        callback(typeCheckMap);
        return;
    }
    //cache.getValue(findMap, callback, function () {//引入redis缓存机制
        dbHandle.collection(objType, function (error, collection) {
            collection.find(findMap, fieldsMap).toArray(function (error, mapList) {//fieldsMap，mongodb的查询约束条件
                //cache.setValue(findMap, mapList);  //设置缓存
                callback(mapList);
            });
        });
    //});
};

updateObj = function (objType, findMap, setMap, callback) {//更新数据库中的数据
    var typeCheckMap = checkType(objType);  //验证数据库中，是否含有某张表
    if (typeCheckMap) {
        callback(typeCheckMap);
        return;
    }
    checkSchema(objType, setMap, function (errorList) {//对数据格式进行验证
        if (errorList.length === 0) {//验证通过
            dbHandle.collection(objType, function (error, collection) {
                var optionsMap = {//optionsMap，mongodb的约束条件
                    upsert: false,
                    safe: true,
                    multi: true
                };
                collection.update(findMap, {$set: setMap}, optionsMap, function (error, updateCount) {//findAndModify
                    callback({//updateCount 被更新的数据条数
                        updateCount: updateCount
                    });
                });
            });
        } else {//数据格式不规范
            callback({
                errorMsg: 'input document not valid',
                errorList: errorList
            });
        }
    });
};

destroyObj = function (objType, findMap, callback) {//从数据库中删除数据
    var typeCheckMap = checkType(objType);  //验证数据库中，是否含有某张表
    if (typeCheckMap) {
        callback(typeCheckMap);
        return;
    }
    //cache.deleteKey(findMap);  //清除缓存中的某条数据
    dbHandle.collection(objType, function (error, collection) {
        var optionsMap = {//optionsMap，mongodb的约束条件
            safe: true,
            single: true
        };
        collection.remove(findMap, optionsMap, function (error, deleteCount) {
            callback({//deleteCount 被删除的数据条数
                deleteCount: deleteCount
            });
        });
    });
};

module.exports = {
    makeMongoId: makeMongoId,
    checkType: checkType,
    construct: constructObj,
    read: readObj,
    update: updateObj,
    destroy: destroyObj
};

console.log('** CRUD module loaded **');

