/*
 * spa.js
 * 程序入口模块
 * 全局变量  $,spa
 */

var spa = (function () {
	var initModule = function ($container) {
		spa.shell.initModule($container);
	};
	
	return {
		initModule: initModule
	};
}());
