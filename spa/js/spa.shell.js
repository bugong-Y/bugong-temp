/*
 * spa.shell.js
 * 程序主控制模块
 * 全局变量  $,spa
 */

spa.shell = (function () {
	var initModule, copyAnchorMap, changeAnchorPart,
		setJqueryMap, toggleChat, setChatAnchor,
		onHashChange, onResize, onTapLog, onLogin, onLogout;
	var configMap = {//储存程序配置
		layoutHtml: 
			'<div class="spa-shell-header">'
				+ '<div class="spa-logo"><h1>单页应用</h1></div>'
				+ '<div class="spa-login"></div>'
				+ '<div class="spa-search"></div>'
			+ '</div>'
			+ '<div class="spa-shell-content">'
				+ '<div class="spa-nav"></div>'
				+ '<div class="spa-main"></div>'
			+ '</div>'
			+ '<div class="spa-shell-footer"></div>',
			//+ '<div class="spa-shell-modal"></div>',
		anchorSchemaMap: {//设置传递给uriAnchor的参数
			chat: {
				opened: true,
				closed: true
			}
		},
		resizeInterval: 200  
	};
	var stateMap = {//中间层，储存元素当前状态
		$container: null,
		anchorMap: {},
		resizeInterId: undefined
	};
	var jqueryMap = {};  //缓存jQuery对象
	
	
	copyAnchorMap = function () {//深度复制，并生成一个新的对象
		return $.extend(true, {}, stateMap.anchorMap);
	};
	
	setJqueryMap = function () {//设置需缓存的jQuery对象
		var $container = stateMap.$container;
		jqueryMap = {
			$container: $container,
			$log: $container.find('.spa-login'),
			$nav: $container.find('.spa-nav')
		};
	};
	
	setChatAnchor = function (positionType) {//封装一层，使其可通过spa.chat.configModule传递给chat模块调用
		return changeAnchorPart({
			chat: positionType
		});
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
	
	onTapLog = function (e) {//点击登录区域时，执行的操作
		var logText, userName;
		var user = spa.model.people.getUser();
		if (user.getIsAnon()) {
			userName = prompt('请登录！');
			spa.model.people.login(userName);
			jqueryMap.$log.text('...登录中...');
		} else {
			spa.model.people.logout();
		}
		return false;
	};
	
	onLogin = function (e, loginUser) {//登录事件处理函数
		jqueryMap.$log.text(loginUser.name);
	};
	
	onLogout = function (e, logoutUser) {//登出事件处理函数
		jqueryMap.$log.text('请登录！');
	};
	
	onHashChange = function (e) {//浏览器hashchange事件处理函数
		var anchorMapPrevious = copyAnchorMap();  //读取之前缓存的hash值
		var anchorMapProposed;
		var sChatPrevious, sChatProposed;
		var isOk = true;
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
						isOk = spa.chat.setSliderPosition('opened');  //调用真正执行动画的函数
						break;
				case 'closed':
						isOk = spa.chat.setSliderPosition('closed');  //调用真正执行动画的函数
						break;
				default: 
						spa.chat.setSliderPosition('closed');
						delete anchorMapProposed.chat;  //删除错误的参数，用于清空hash值
						$.uriAnchor.setAnchor(anchorMapProposed, null, true);  //清空地址栏中的hash值，chat模块折叠
			}
		}
		if (!isOk) {//如果动画函数出错，一般是传入的状态有问题，opened，closed等
			if (anchorMapPrevious) {//如果存在缓存的hash值，则还原地址栏
				$.uriAnchor.setAnchor(anchorMapPrevious, null, true);
				stateMap.anchorMap = anchorMapPrevious;
			} else {
				delete anchorMapProposed.chat;  //删除错误的参数，用于清空hash值
				$.uriAnchor.setAnchor(anchorMapProposed, null, true);  //清空地址栏
			}
		}
		return false;
	};
	
	onResize = function () {//窗口尺寸变化事件侦听器
		if (stateMap.resizeInterId) {//防止浏览器resize事件触发频率太高
			return true;
		}
		spa.chat.handleResize();
		stateMap.resizeInterId = setTimeout(function () {
			stateMap.resizeInterId = undefined;  //定时器完成时，重置resizeInterId
		}, configMap.resizeInterval);
	};
	
	initModule = function ($container) {//程序初始化
		//整体结构初始化
		stateMap.$container = $container;
		$container.html(configMap.layoutHtml);
		setJqueryMap();

		//配置uriAnchor
		$.uriAnchor.configModule({
			schema_map: configMap.anchorSchemaMap  //uriAnchor插件定义了schema_map的写法，不能为驼峰
		});
		
		spa.chat.configModule({//设置chat初始配置
			setChatAnchor: setChatAnchor
			//chatModel: spa.model.chat,
			//peopleModel: spa.model.people
		});
		spa.chat.initModule(jqueryMap.$container);
		
		//绑定hashchange事件
		$(window)
			.bind('hashchange', onHashChange)
			.bind('resize', onResize)
			.trigger('hashchange');
			
		$.gevent.subscribe($container, 'spa-login', onLogin);
		$.gevent.subscribe($container, 'spa-logout', onLogout);
		jqueryMap.$log
			.text('请登录！')
			.bind('utap', onTapLog);
	};
	
	return {
		initModule: initModule
	};
}());
