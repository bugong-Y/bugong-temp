/*
 * spa.data.js
 * data模块
 * 全局变量  $,spa
 */

spa.data = (function () {
	'use strict';
	var stateMap = {
        sio: null
    };
    var makeSio, getSio, clearSio, initModule;

    makeSio = function () {
        var socket = io.connect('http://localhost:3000/chat', {'force new connection': true});  // {'force new connection': true}  同一页面每次登录时强制重新连接socket，解决多次登录消息重复bug
        return {
            emit: function (eventName, data) {
                socket.emit(eventName, data);
            },
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    callback(arguments);
                });
            }
        };
    };

    getSio = function () {
        if (!stateMap.sio) {
            stateMap.sio = makeSio();
        }
        return stateMap.sio;
    };

    clearSio = function () {
        stateMap.sio = null;
    };

    initModule = function () {

    };

	return {
        getSio: getSio,
        clearSio: clearSio,
        initModule: initModule
    };
}());
