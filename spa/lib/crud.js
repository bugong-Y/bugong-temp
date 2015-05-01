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
var objTypeMap = {//�������ݷ�ʽ
    user: {}
};
var loadSchema;
var validator = JSV.createEnvironment();
var checkSchema;
var clearIsOnline;
var checkType, constructObj, readObj, updateObj, destroyObj;

loadSchema = function (schemaName, schemaPath) {//�������ݸ�ʽ��ʽ
    fsHandle.readFile(schemaPath, 'utf-8', function (error, data) {
        objTypeMap[schemaName] = JSON.parse(data);
    });
};

checkSchema = function (objType, objMap, callback) {//��֤�����Ƿ���ϸ�ʽ�淶
    var schemaMap = objTypeMap[objType];
    var reportMap = validator.validate(objMap, schemaMap);
    callback(reportMap.errors);
};

(function () {
    var schemaName, schemaPath;
    for (schemaName in objTypeMap) {
        if (objTypeMap.hasOwnProperty(schemaName)) {
            schemaPath = __dirname + '/' + schemaName + '.json';  //�õ���ʽ�ļ�·��
            loadSchema(schemaName, schemaPath);  //���ط�ʽ�ļ�
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

checkType = function (objType) {//����Ƿ���ڶ�Ӧ�ı�
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

constructObj = function (objType, objMap, callback) {//�����ݿ��в�������
    var typeCheckMap = checkType(objType);
    if (typeCheckMap) {//��������ڸñ�
        callback(typeCheckMap);
        return;
    }
    checkSchema(objType, objMap, function (errorList) {
        if (errorList.length === 0) {
            dbHandle.collection(objType, function (error, collection) {
                var optionsMap = {safe: true};  //safeָ���ɹ����ĵ�����MongoDB����Ż���ûص�����
                collection.insert(objMap, optionsMap, function (error, resultMap) {
                    callback(resultMap);
                });
            });
        } else {
            callback({
                errorMsg: '���ݸ�ʽ���淶��',
                errorList: errorList
            });
        }
    });
};

readObj = function (objType, findMap, fieldsMap, callback) {//�����ݿ��ж�ȡ����
    var typeCheckMap = checkType(objType);
    if (typeCheckMap) {//��������ڸñ�
        callback(typeCheckMap);
        return;
    }
    dbHandle.collection(objType, function (error, collection) {
        collection.find(findMap, fieldsMap).toArray(function (error, mapList) {
            callback(mapList);
        });
    });
};

updateObj = function (objType, findMap, setMap, callback) {//�����ݿ��и�������
    var typeCheckMap = checkType(objType);
    if (typeCheckMap) {//��������ڸñ�
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
                errorMsg: '���ݸ�ʽ���淶��',
                errorList: errorList
            });
        }
    });
};

destroyObj = function (objType, findMap, callback) {//�����ݿ���ɾ������
    var typeCheckMap = checkType(objType);
    if (typeCheckMap) {//��������ڸñ�
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

