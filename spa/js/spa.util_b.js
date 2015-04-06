/*
 * spa.util_b.js
 * util_b模块
 * 全局变量  $,spa,getComputedStyle
 */

spa.util_b = (function () {
	'use strict';
	var configMap = {
		regEncodeHtml: /[&"'><]/g,
		regEncodeNoamp: /["'><]/g,
		htmlEncodeMap: {
			'&': '&#38',
			'"': '&#34',
			"'": '&#39',
			'>': '&#62',
			'<': '&#60'
		}
	};	
	var decodeHtml, encodeHtml,  getEmSize;
	
	configMap.encodeNoampMap = $.extend(true, {}, configMap.htmlEncodeMap);
	delete configMap.encodeNoampMap['&'];
	
	decodeHtml = function (str) {
		return $('<div/>').html(str || '').text();
	};
	
	encodeHtml = function (argStr, excludeAmp) {
		var inputStr = String(argStr);
		var regex, lookUpMap;
		if (excludeAmp) {
			lookUpMap = configMap.encodeNoampMap;
			regex = configMap.regEncodeNoamp;
		} else {
			lookUpMap = configMap.htmlEncodeMap;
			regex = configMap.regEncodeHtml;
		}
		return inputStr.replace(regex, function (match, name) {
			return lookUpMap[match] || '';
		});
	};
	
	getEmSize = function (elem) {
		return Number(
			getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]
		);
	};
	
	return {
		decodeHtml: decodeHtml,
		encodeHtml:　encodeHtml,
		getEmSize: getEmSize
	};
}());
