/*
 * spa.js
 * 程序入口模块
 * 全局变量  $,spa
 */

var spa = (function () {
	'use strict';
	
	var initModule = function ($container) {
		spa.data.initModule();  //必须最先初始化data
		spa.model.initModule();
		spa.shell.initModule($container);
	};
	
	return {
		initModule: initModule
	};
}());
