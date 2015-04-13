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
	
	configMap.encodeNoampMap = $.extend(true, {}, configMap.htmlEncodeMap);  //不包含&的map
	delete configMap.encodeNoampMap['&'];
	
	decodeHtml = function (str) {//只得到其中的文本
		return $('<div/>').html(str || '').text();
	};
	
	encodeHtml = function (argStr, excludeAmp) {//编制成计算机语言
		var inputStr = String(argStr);
		var regex, lookUpMap;
		if (excludeAmp) {//是否替换&
			lookUpMap = configMap.encodeNoampMap;
			regex = configMap.regEncodeNoamp;
		} else {
			lookUpMap = configMap.htmlEncodeMap;
			regex = configMap.regEncodeHtml;
		}
		return inputStr.replace(regex, function (match, part1) {
			return lookUpMap[match] || '';
		});
	};
	
	getEmSize = function (elem) {//得到当前字体像素大小，从而得到1em代表多少像素
		return Number(
			getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]  //getComputedStyle,第二个参数为伪类
		);
	};
	
	return {
		decodeHtml: decodeHtml,
		encodeHtml:　encodeHtml,
		getEmSize: getEmSize
	};
}());
