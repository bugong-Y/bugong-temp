/*
 * spa.js
 * 程序入口模块
 * 全局变量  $,spa
 */

var spa = (function () {
	'use strict';
	
	var initModule = function ($container) {
		spa.model.initModule();
		spa.shell.initModule($container);
	};
	
	return {
		initModule: initModule
	};
}());
