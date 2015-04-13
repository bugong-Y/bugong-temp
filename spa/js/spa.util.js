/*
 * spa.util.js
 * 通用函数包模块
 * 全局变量  $,spa
 */

spa.util = (function () {
	'use strict';
	var makeError, setConfigMap;
	
	makeError = function (name, msg, data) {//构造一个错误
		var err = new Error();
		err.name = name;
		err.message = msg;
		if (data) {
			err.data = data;
		}
		return err;
	};
	
	setConfigMap = function (argMap) {//按传入的参数配置模块
		var setMap = argMap.setMap,
			settableMap = argMap.settableMap,
			configMap = argMap.configMap;
		var keyName, error;
		for (keyName in setMap) {
			if (setMap.hasOwnProperty(keyName)) {
				if (settableMap.hasOwnProperty(keyName)) {
					configMap[keyName] = setMap[keyName];
				} else {
					error = makeError('setMap error', 'Setting config key | '
							+ keyName
							+ ' |is not supported'
						);
					throw error;					
				}
			}
		}
	};
	
	return {
		makeError: makeError,
		setConfigMap: setConfigMap
	};
}());
