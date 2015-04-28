/**
 * Created by bugong on 2015/4/15.
 */

'use strict';
var configRoutes;
var mongodb = require('mongodb');
var fsHandle = require('fs');
var JSV = require('JSV').JSV;  //json验证
var mongoServer = new mongodb.Server('localhost', mongodb.Connection.DEFAULT_PORT);
var dbHandle = new mongodb.Db('spa', mongoServer, {safe: true});
var makeMongoId = mongodb.ObjectID;
var objTypeMap = {//验证要存储的数据
    user: {}
};
var loadSchema;
var checkSchema;
var validator = JSV.createEnvironment();

loadSchema = function (schemaName, schemaPath) {//读取json验证文件
    fsHandle.readFile(schemaPath, 'utf-8', function (error, data) {
        objTypeMap[schemaName] = JSON.parse(data);  //得到并存储json验证的范式
    });
};

checkSchema = function (objType, objMap, callback) {//验证要存储的数据是否符合范式规范
    var schemaMap = objTypeMap[objType];
    var reportMap = validator.validate(objMap, schemaMap);
    callback(reportMap.errors);
};

(function () {
    var schemaName, schemaPath;
    for (schemaName in objTypeMap) {
        if (objTypeMap.hasOwnProperty(schemaName)) {
            schemaPath = __dirname + '/' + schemaName + '.json';  //取得验证json格式文件的路径
            loadSchema(schemaName, schemaPath);
        }
    }
}());

dbHandle.open(function () {//打开数据库
    console.log('** Connected to MongoDB **');
});

configRoutes = function (app) {
    app.get('/', function (request, response) {
        response.redirect('/spa.html');
    });
    app.all('/:objType/*?', function (request, response, next) {
        response.contentType('json');
        if (objTypeMap[request.params.objType]) {//如果对象存在该属性
            next();
        } else {
            response.send({
                errorMsg: request.params.objType + 'is not a valid object type！'
            });
        }
    });
    app.get('/:objType/list', function (request, response) {//向客户端列出数据列表
        dbHandle.collection(request.params.objType, function (error, collection) {
            collection.find().toArray(function (error, mapList) {
                response.send(mapList);
            });
        });
    });
    app.post('/:objType/create', function (request, response) {//向数据库中存储数据
        var objType = request.params.objType;
        var objMap = request.body;
        checkSchema(objType, objMap, function (errorList) {//验证要存储的数据是否符合范式规范
            if (errorList.length === 0) {//验证通过
                dbHandle.collection(objType, function (error, collection) {
                    var optionsMap = {safe: true};  //safe指定成功把文档插入MongoDB里面才会调用回调函数
                    collection.insert(objMap, optionsMap, function (error, resultMap) {
                        response.send(resultMap);
                    });
                });
            } else {
                response.send({
                    errorMsg: 'JSON 格式不规范',
                    errorList: errorList
                });
            }
        });

    });
    app.get('/:objType/read/:id', function (request, response) {//读取某个用户
        var findMap = {
            _id: makeMongoId(request.params.id)
        };
        dbHandle.collection(request.params.objType, function (error, collection) {
            collection.findOne(findMap, function (error, resultMap) {
                response.send(resultMap);
            });
        });
    });
    app.post('/:objType/update/:id', function (request, response) {//向数据库中更新数据
        var findMap = {
            _id: makeMongoId(request.params.id)
        };
        var objMap = request.body;
        var objType = request.params.objType;
        checkSchema(objType, objMap, function (errorList) {//验证格式
            if (errorList.length === 0) {//格式验证通过
                dbHandle.collection(objType, function (error, collection) {
                    var sortOrder = [];
                    var optionsMap = {
                        'new': true,
                        upsert: false,
                        safe: true
                    };
                    collection.findAndModify(findMap, sortOrder, objMap, optionsMap, function (error, updatedMap) {
                        response.send(updatedMap);
                    });
                });
            } else {
                response.send({
                    errorMsg: 'JSON 格式不规范',
                    errorList: errorList
                });
            }
        });

    });
    app.get('/:objType/delete/:id', function (request, response) {//删除某个用户
        var findMap = {
            _id: makeMongoId(request.params.id)
        };
        dbHandle.collection(request.params.objType, function (error, collection) {
            var optionsMap = {
                safe: true,
                single: true
            };
            collection.remove(findMap, optionsMap, function (error, deleteCount) {
                response.send({
                    deleteCount: deleteCount
                });
            });
        });
    });
};

module.exports = {
    configRoutes: configRoutes
};