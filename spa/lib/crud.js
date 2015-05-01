/**
 * Created by bugong on 2015/4/21.
 */

'use strict';

var mongodb = require('mongodb');
var fsHandle = require('fs');
var JSV = require('JSV').JSV;
var mongoServer = new mongodb.Server('localhost', mongodb.Connection.DEFAULT_PORT);
var dbHandle = new mongodb.Db('spa', mongoServer, {safe: true});
var makeMongoId = mongodb.ObjectID;
var objTypeMap = {//缓存数据范式
    user: {}
};
var loadSchema;
var validator = JSV.createEnvironment();
var checkSchema;
var clearIsOnline;
var checkType, constructObj, readObj, updateObj, destroyObj;

loadSchema = function (schemaName, schemaPath) {//加载数据格式范式
    fsHandle.readFile(schemaPath, 'utf-8', function (error, data) {
        objTypeMap[schemaName] = JSON.parse(data);
    });
};

checkSchema = function (objType, objMap, callback) {//验证数据是否符合格式规范
    var schemaMap = objTypeMap[objType];
    var reportMap = validator.validate(objMap, schemaMap);
    callback(reportMap.errors);
};

(function () {
    var schemaName, schemaPath;
    for (schemaName in objTypeMap) {
        if (objTypeMap.hasOwnProperty(schemaName)) {
            schemaPath = __dirname + '/' + schemaName + '.json';  //得到范式文件路径
            loadSchema(schemaName, schemaPath);  //加载范式文件
        }
    }
}());

clearIsOnline = function () {
    updateObj(
        'user',
        {isOnline: true},
        {isOnline: false},
        function (responseMap) {
            console.log('All users set to offline', responseMap);
        }
    );
};

checkType = function (objType) {//检测是否存在对应的表
    if (!objTypeMap[objType]) {
        return {
            errorMsg: 'object type " ' + objType + ' "is not supported'
        };
    }
    return null;
};



dbHandle.open(function () {
    console.log('** Connected to MongoDB **');
});

constructObj = function (objType, objMap, callback) {//向数据库中插入数据
    var typeCheckMap = checkType(objType);
    if (typeCheckMap) {//如果不存在该表
        callback(typeCheckMap);
        return;
    }
    checkSchema(objType, objMap, function (errorList) {
        if (errorList.length === 0) {
            dbHandle.collection(objType, function (error, collection) {
                var optionsMap = {safe: true};  //safe指定成功把文档插入MongoDB里面才会调用回调函数
                collection.insert(objMap, optionsMap, function (error, resultMap) {
                    callback(resultMap);
                });
            });
        } else {
            callback({
                errorMsg: '数据格式不规范！',
                errorList: errorList
            });
        }
    });
};

readObj = function (objType, findMap, fieldsMap, callback) {//从数据库中读取数据
    var typeCheckMap = checkType(objType);
    if (typeCheckMap) {//如果不存在该表
        callback(typeCheckMap);
        return;
    }
    dbHandle.collection(objType, function (error, collection) {
        collection.find(findMap, fieldsMap).toArray(function (error, mapList) {
            callback(mapList);
        });
    });
};

updateObj = function (objType, findMap, setMap, callback) {//向数据库中更新数据
    var typeCheckMap = checkType(objType);
    if (typeCheckMap) {//如果不存在该表
        callback(typeCheckMap);
        return;
    }
    checkSchema(objType, setMap, function (errorList) {
        if (errorList.length === 0) {
            dbHandle.collection(objType, function (error, collection) {
                var optionsMap = {
                    upsert: false,
                    safe: true,
                    multi: true
                };
                collection.findAndModify(findMap, {$set: setMap}, optionsMap, function (error, updateCount) {
                    callback({
                        updateCount: updateCount
                    });
                });
            });
        } else {
            callback({
                errorMsg: '数据格式不规范！',
                errorList: errorList
            });
        }
    });
};

destroyObj = function (objType, findMap, callback) {//从数据库中删除数据
    var typeCheckMap = checkType(objType);
    if (typeCheckMap) {//如果不存在该表
        callback(typeCheckMap);
        return;
    }
    dbHandle.collection(objType, function (error, collection) {
        var optionsMap = {
            safe: true,
            single: true
        };
        collection.remove(findMap, optionsMap, function (error, deleteCount) {
            callback({
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

