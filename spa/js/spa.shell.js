/*
 * spa.shell.js
 * 程序主控制模块
 * 全局变量  $,spa
 */

spa.shell = (function () {
	var initModule, setJqueryMap, toggleChat;
	var configMap = {//储存程序配置
		layoutHtml: 
			'<div class="spa-shell-header">'
				+ '<div class="spa-logo"></div>'
				+ '<div class="spa-login"></div>'
				+ '<div class="spa-search"></div>'
			+ '</div>'
			+ '<div class="spa-shell-content">'
				+ '<div class="spa-nav"></div>'
				+ '<div class="spa-main"></div>'
			+ '</div>'
			+ '<div class="spa-shell-footer"></div>'
			+ '<div class="spa-shell-chat"></div>'
			+ '<div class="spa-shell-modal"></div>',
		chatExtendHeight: 460,
		chatRetractHeight: 16,
		chatExtendTime: 300,
		chatRetractTime: 240,
		chatExtendTitle: '点击展开',
		chatRetractTitle: '点击折叠'
	};
	var stateMap = {//中间层，储存元素当前状态
		$container: null,
		isChatRetract: true
	};
	var jqueryMap = {};  //缓存jQuery对象
	
	setJqueryMap = function () {//设置需缓存的jQuery对象
		var $container = stateMap.$container;
		jqueryMap = {
			$container: $container,
			$chat: $container.find('.spa-shell-chat')
		};
	};
	
	toggleChat = function (callback) {//切换chat模块状态
		var objTemp = jqueryMap.$chat;
		var curHeight = objTemp.height();
		var isOpened = (curHeight === configMap.chatExtendHeight);
		var isColsed = (curHeight === configMap.chatRetractHeight);
		if (!isOpened && !isColsed) {//动画执行中，不进行任何操作
			return;
		}
		if (isColsed) {//当前状态关闭，执行展开动作
			objTemp.animate(
				{height: configMap.chatExtendHeight}, 
				configMap.chatExtendTime,
				function () {
					jqueryMap.$chat.attr('title', configMap.chatRetractTitle);
					stateMap.isChatRetract = false;
					callback&&callback();
				}
			);
		}
		if (isOpened) {//当前状态打开，执行折叠动作
			objTemp.animate(
				{height: configMap.chatRetractHeight}, 
				configMap.chatRetractTime,
				function () {
					jqueryMap.$chat.attr('title', configMap.chatExtendTitle);
					stateMap.isChatRetract = true;
					callback&&callback();
				}
			);
		}
	};
	
	onClickChat = function (e) {//点击chat模块时，执行的动作
		toggleChat();
		return false;
	};
	
	initModule = function ($container) {//程序初始化
		//整体结构初始化
		stateMap.$container = $container;
		$container.html(configMap.layoutHtml);
		setJqueryMap();
		//chat模块初始化
		stateMap.isChatRetract = true;
		jqueryMap.$chat
			.attr('title', configMap.chatExtendTitle)
			.click(onClickChat);
	};
	
	return {
		initModule: initModule
	};
}());
