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
    var makeSio, getSio, initModule;

    makeSio = function () {
        var socket = io.connect('/chat');
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

    initModule = function () {

    };

	return {
        getSio: getSio,
        initModule: initModule
    };
}());
