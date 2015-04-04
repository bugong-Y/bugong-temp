/*
 * spa.shell.js
 * 程序主控制模块
 * 全局变量  $,spa
 */

spa.shell = (function () {
	var initModule, copyAnchorMap, changeAnchorPart, setJqueryMap, toggleChat,
		onClickChat, onHashChange;
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
		chatExtendTime: 800,
		chatRetractTime: 400,
		chatExtendTitle: '点击展开',
		chatRetractTitle: '点击折叠',
		anchorSchemaMap: {//设置传递给uriAnchor的参数
			chat: {
				opened: true,
				closed: true
			}
		}
	};
	var stateMap = {//中间层，储存元素当前状态
		$container: null,
		isChatRetract: true,
		anchorMap: {}
	};
	var jqueryMap = {};  //缓存jQuery对象
	
	
	copyAnchorMap = function () {
		return $.extend(true, {}, stateMap.anchorMap);
	};
	
	setJqueryMap = function () {//设置需缓存的jQuery对象
		var $container = stateMap.$container;
		jqueryMap = {
			$container: $container,
			$chat: $container.find('.spa-shell-chat')
		};
	};
	
	changeAnchorPart = function (anchorMap) {//改变浏览器地址栏中的hash值
		var anchorMapRevise = copyAnchorMap();  //深度复制，并创建了一个新对象，用于存储修正后的参数。
		var keyName,keyNameDep;
		KEY:
		for (keyName in anchorMap) {
			if (anchorMap.hasOwnProperty(keyName)) {
				if (keyName.indexOf('_') === 0) {//随着应用规模的增大，可能会出现关联的键值对
					continue KEY;
				}
				anchorMapRevise[keyName] = anchorMap[keyName];
				keyNameDep = '_' + keyName;  
				if (anchorMap[keyNameDep]) {//判断传入的参数是否存在关联的键值对
					anchorMapRevise[keyNameDep] = anchorMap[keyNameDep];
				} else {
					delete anchorMapRevise[keyNameDep];  //删除之前存储的关联的键值对，防止显示在地址栏
					delete anchorMapRevise['_s' + keyNameDep];  //删除makeAnchorMap方法，自动添加的_s型属性，防止显示在地址栏
				}
			}
		}
		try {
			$.uriAnchor.setAnchor(anchorMapRevise);  //如果传入的参数合法，修改地址栏hash值
		} catch (e) {
			$.uriAnchor.setAnchor(stateMap.anchorMap, null, true);  //还原地址栏中的hash值
			return false;
		}
		return true;
	};
	
	toggleChat = function (action, callback) {//切换chat模块状态
		var objTemp = jqueryMap.$chat;
		var curHeight = objTemp.height();
		var isOpened = (curHeight === configMap.chatExtendHeight);
		var isColsed = (curHeight === configMap.chatRetractHeight);
		if (!isOpened && !isColsed) {//动画执行中，不进行任何操作
			return;
		}
		if (action) {//当前状态关闭，执行展开动作
			objTemp.animate(
				{height: configMap.chatExtendHeight}, 
				configMap.chatExtendTime,
				function () {
					jqueryMap.$chat.attr('title', configMap.chatRetractTitle);
					stateMap.isChatRetract = false;
					callback&&callback();
				}
			);
			return true;
		}
		objTemp.animate(
			{height: configMap.chatRetractHeight}, 
			configMap.chatRetractTime,
			function () {
				jqueryMap.$chat.attr('title', configMap.chatExtendTitle);
				stateMap.isChatRetract = true;
				callback&&callback();
			}
		);
		return true;
	};
	
	onClickChat = function (e) {//点击chat模块时，执行的操作
		//toggleChat();  改为改变hash值，触发hashchange事件，执行动作
		changeAnchorPart({
			chat: (stateMap.isChatRetract ? 'opened' : 'closed')
		});
		return false;
	};
	
	onHashChange = function (e) {//浏览器hashchange事件处理函数
		var anchorMapPrevious = copyAnchorMap();  //读取之前缓存的hash值
		var anchorMapProposed;
		var sChatPrevious, sChatProposed;
		try {
			anchorMapProposed = $.uriAnchor.makeAnchorMap();  //makeAnchorMap会自动添加_s属性
		} catch (e) {
			$.uriAnchor.setAnchor({}, null, true );  //清空地址栏中的hash值，chat模块折叠
			return false;
		}
		stateMap.anchorMap = anchorMapProposed;  //缓存浏览器中当前的hash值
		
		sChatPrevious = anchorMapPrevious._s_chat;  //第一次为undefined
		sChatProposed = anchorMapProposed._s_chat;  //第一次为undefined
		if (!anchorMapPrevious || sChatPrevious !== sChatProposed) {//第一次加载页面，判断结果为false
			sChatProposed = anchorMapProposed.chat;
			switch (sChatProposed) {
				case 'opened':
						toggleChat(true);
						break;
				case 'closed':
						toggleChat(false);
						break;
				default: 
						toggleChat(false);
						delete anchorMapProposed.chat;  //删除错误的参数，用于清空hash值
						$.uriAnchor.setAnchor(anchorMapProposed, null, true);  //清空地址栏中的hash值，chat模块折叠
			}
		}
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
		//配置uriAnchor
		$.uriAnchor.configModule({
			schema_map: configMap.anchorSchemaMap  //uriAnchor插件定义了schema_map的写法，不能为驼峰
		});
		//绑定hashchange事件
		$(window)
			.bind('hashchange', onHashChange)
			.trigger('hashchange');
	};
	
	return {
		initModule: initModule
	};
}());
