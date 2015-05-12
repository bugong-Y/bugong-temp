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
var makeMongoId = mongodb.ObjectID;  //��������_id
var objTypeMap = {
    user: {}
};
var loadSchema;
var validator = JSV.createEnvironment();
var checkSchema;
var clearIsOnline;
var checkType, constructObj, readObj, updateObj, destroyObj;

loadSchema = function (schemaName, schemaPath) {//�������ݸ�ʽ��֤�ļ�
    fsHandle.readFile(schemaPath, 'utf-8', function (error, data) {
        objTypeMap[schemaName] = JSON.parse(data);  //����֤�ļ������ݽ���Ϊobject���󣬴���objTypeMap������ݺϷ�����֤����
    });
};

checkSchema = function (objType, objMap, callback) {//��֤���ݸ�ʽ����
    var schemaMap = objTypeMap[objType];  //�涨�����ݸ�ʽ
    var reportMap = validator.validate(objMap, schemaMap);  //objMap����Ҫ��֤������
    callback(reportMap.errors);  //����reportMap.errors��length���ԣ�ִ�лص�
};

(function () {//��ִ�к������õ���֤���ݸ�ʽ��json�ļ�
    var schemaName, schemaPath;
    for (schemaName in objTypeMap) {
        if (objTypeMap.hasOwnProperty(schemaName)) {
            schemaPath = __dirname + '/' + schemaName + '.json';  //__dirname  D:\��վ\bugong\spa\lib
            loadSchema(schemaName, schemaPath);  //������֤�ļ�
        }
    }
}());

checkType = function (objType) {//������ݿ����Ƿ����ĳ�ű�
    if (!objTypeMap[objType]) {
        return {
            errorMsg: 'object type " ' + objType + ' "is not supported'
        };
    }
    return null;  //���ͨ��ʱ�����ؿ�
};

clearIsOnline = function () {//�ÿͻ��������û�����
    updateObj(
        'user',
        {isOnline: true},
        {isOnline: false},
        function (responseMap) {
            console.log('All users set to offline', responseMap);
        }
    );
};

dbHandle.open(function () {//�����ݿ�
    console.log('** Connected to MongoDB **');
});

constructObj = function (objType, objMap, callback) {//�����ݿ��в�������
    var typeCheckMap = checkType(objType);  //��֤���ݿ��У��Ƿ���ĳ�ű�
    if (typeCheckMap) {
        callback(typeCheckMap);
        return;
    }
    checkSchema(objType, objMap, function (errorList) {//�����ݸ�ʽ������֤
        if (errorList.length === 0) {//���ݸ�ʽ��֤ͨ��
            dbHandle.collection(objType, function (error, collection) {
                var optionsMap = {safe: true};  //safeָ���ɹ����ĵ�����MongoDB����Ż���ûص�����
                collection.insert(objMap, optionsMap, function (error, resultMap) {//�����ݿ��в�������
                    console.log(resultMap);
                    callback(resultMap);
                });
            });
        } else {//���ݸ�ʽ���淶
            callback({
                errorMsg: 'input document not valid',
                errorList: errorList
            });
        }
    });
};

readObj = function (objType, findMap, fieldsMap, callback) {//�����ݿ��ж�ȡ����
    var typeCheckMap = checkType(objType);  //��֤���ݿ��У��Ƿ���ĳ�ű�
    if (typeCheckMap) {
        callback(typeCheckMap);
        return;
    }
    //cache.getValue(findMap, callback, function () {//����redis�������
        dbHandle.collection(objType, function (error, collection) {
            collection.find(findMap, fieldsMap).toArray(function (error, mapList) {//fieldsMap��mongodb�Ĳ�ѯԼ������
                //cache.setValue(findMap, mapList);  //���û���
                callback(mapList);
            });
        });
    //});
};

updateObj = function (objType, findMap, setMap, callback) {//�������ݿ��е�����
    var typeCheckMap = checkType(objType);  //��֤���ݿ��У��Ƿ���ĳ�ű�
    if (typeCheckMap) {
        callback(typeCheckMap);
        return;
    }
    checkSchema(objType, setMap, function (errorList) {//�����ݸ�ʽ������֤
        if (errorList.length === 0) {//��֤ͨ��
            dbHandle.collection(objType, function (error, collection) {
                var optionsMap = {//optionsMap��mongodb��Լ������
                    upsert: false,
                    safe: true,
                    multi: true
                };
                collection.update(findMap, {$set: setMap}, optionsMap, function (error, updateCount) {//findAndModify
                    callback({//updateCount �����µ���������
                        updateCount: updateCount
                    });
                });
            });
        } else {//���ݸ�ʽ���淶
            callback({
                errorMsg: 'input document not valid',
                errorList: errorList
            });
        }
    });
};

destroyObj = function (objType, findMap, callback) {//�����ݿ���ɾ������
    var typeCheckMap = checkType(objType);  //��֤���ݿ��У��Ƿ���ĳ�ű�
    if (typeCheckMap) {
        callback(typeCheckMap);
        return;
    }
    //cache.deleteKey(findMap);  //��������е�ĳ������
    dbHandle.collection(objType, function (error, collection) {
        var optionsMap = {//optionsMap��mongodb��Լ������
            safe: true,
            single: true
        };
        collection.remove(findMap, optionsMap, function (error, deleteCount) {
            callback({//deleteCount ��ɾ������������
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

