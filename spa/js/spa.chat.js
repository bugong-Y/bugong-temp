/*
 * spa.chat.js
 * chat模块
 * 全局变量  $,spa,getComputedStyle
 */

spa.chat = (function () {
	var configMap = {
		chatHtml:
			'<div class="spa-chat">'
				+ '<div class="spa-chat-head">'
					+ '<div class="spa-chat-toggle">+</div>'
					+ '<div class="spa-chat-title">聊天窗口</div>'
				+ '</div>'
				+ '<div class="spa-chat-close">×</div>'
				+ '<div class="spa-chat-hold">'
					+ '<div class="spa-chat-message"></div>'
					+ '<div class="spa-chat-box">'
						+ '<input type="text"  />'
						+ '<div>发送</div>'
					+ '</div>'
				+ '</div>'
			+ '</div>',
		settableMap: {
			sliderOpenTime: true,
			sliderCloseTime: true,
			sliderOpenEm: true,
			sliderCloseEm: true,
			sliderOpenTitle: true,
			sliderCloseTitle: true,
			chatModel: true,
			peopleModel: true,
			setChatAnchor: true
		},
		sliderOpenTime: 250,
		sliderCloseTime: 250,
		sliderOpenEm: 18,
		sliderCloseEm: 2,
		sliderOpenTitle: '点击折叠',
		sliderCloseTitle: '点击展开',
		sliderOpenMinEm: 10,  //chat模块最小高度
		windowHeightMinEm: 20,  //设置浏览器窗口的临界点
		chatModel: null,
		peopleModel: null,
		setChatAnchor: null  //引用shell模块定义的函数
	};
	var stateMap = {//缓存中间值
		$container: null,
		positionType: 'closed',
		pxPerEm : 0,
		sliderHiddenPx: 0,
		sliderClosedPx: 0,
		sliderOpenedPx: 0
	};
	var jqueryMap = {};
	var setJqueryMap, configModule, initModule,
		getEmSize, setPxSize, setSliderPosition, onClickToggle,
		removeSlider, handleResize;
	
	getEmSize = function (elem) {//得到当前字体像素大小，从而得到1em代表多少像素
		return Number(
			getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]  //getComputedStyle,第二个参数为伪类 
		);
	};
	
	setJqueryMap = function () {
		var $container = stateMap.$container;
		var $slider = $container.find('.spa-chat');
		jqueryMap = {//初始化并缓存chat模块各元素
			$slider: $slider,
			$head: $slider.find('.spa-chat-head'),
			$toggle: $slider.find('.spa-chat-toggle'),
			$title: $slider.find('.spa-chat-title'),
			$hold: $slider.find('.spa-chat-hold'),
			$message: $slider.find('.spa-chat-message'),
			$box: $slider.find('.spa-chat-box'),
			$input: $slider.find('.spa-chat-box input[type=text]')
		};
	};
	
	setPxSize = function () {//缓存模块各元素应该对应的像素值
		var pxPerEm, openedHeightEm, windowHeightEm;
		pxPerEm = getEmSize(jqueryMap.$slider[0]);  //得到1em对应的像素值
		windowHeightEm = Math.floor(($(window).height() / pxPerEm) + 0.5);  //获取当前窗口大小
		openedHeightEm = (windowHeightEm > configMap.windowHeightMinEm) ? configMap.sliderOpenEm : configMap.sliderOpenMinEm;
		stateMap.pxPerEm = pxPerEm;  //缓存1em对应的像素值
		stateMap.sliderOpenedPx = openedHeightEm * pxPerEm;  //缓存配置展开状态像素高度
		stateMap.sliderClosedPx = configMap.sliderCloseEm * pxPerEm;  //缓存配置折叠状态像素高度
		jqueryMap.$hold.css({//设置剔除chat模块头部后，对话框的高度，防止因为绝对定位，改变高度时，文本框等元素脱离文档流
			height: (openedHeightEm - 2) * pxPerEm
		});
	};
	
	handleResize = function () {//窗口尺寸变化发生时，chat模块的处理函数
		if (!jqueryMap.$slider) {
			return false;
		}
		setPxSize();
		console.log('正在调整！');
		if (stateMap.positionType === 'opened') {
			jqueryMap.$slider.css({
				'height': stateMap.sliderOpenedPx
			});
		}
		return true;
	};
	
	removeSlider = function () {//移除chat模块
		if (jqueryMap.$slider) {
			jqueryMap.$slider.remove();
			jqueryMap = null;
		}
		configMap.chatModel = null;
		configMap.peopleModel = null;
		configMap.setChatAnchor = null;
		return true;
	};
	
	setSliderPosition = function (positionType, callback) {//执行关闭折叠动作
		var heightPx, animateTime, sliderTitle, toggleText;
		if (stateMap.positionType === positionType) {//如果当前已是目标状态，不执行任何操作，返回true值
			return true;
		}
		switch (positionType) {//设置动画函数，需要的参数值
			case 'opened':
					heightPx = stateMap.sliderOpenedPx;
					animateTime = configMap.sliderOpenTime;
					sliderTitle = configMap.sliderOpenTitle;
					toggleText = '=';
					break;
			case 'hidden':
					heightPx = 0;
					animateTime = configMap.sliderOpenTime;
					sliderTitle = '';
					toggleText = '+';
					break;
			case 'closed':
					heightPx = stateMap.sliderClosedPx;
					animateTime = configMap.sliderCloseTime;
					sliderTitle = configMap.sliderCloseTitle;
					toggleText = '+';
					break;
			default:
					return false;
		}
		jqueryMap.$slider.animate(//动画函数
			{height: heightPx},
			animateTime,
			function () {//动画完成后的回调
				jqueryMap.$toggle.prop('title', sliderTitle);
				jqueryMap.$toggle.text(toggleText);
				stateMap.positionType = positionType;  //缓存动画完成后，chat模块的状态
				callback && callback(jqueryMap.$slider);  //传入的回调函数
			}
		);
		return true;
	};
	
	onClickToggle = function () {//点击chat模块头部时
		var setChatAnchor = configMap.setChatAnchor;  //configMap.setChatAnchor通过初始化配置时得到，是shell模块的一个函数
		if (stateMap.positionType === 'opened') {
			setChatAnchor('closed');  //setChatAnchor在shell模块中定义，setChatAnchor -> changeAnchorPart -> onHashChange
		} else if (stateMap.positionType === 'closed') {
			setChatAnchor('opened');
		}
		return false;
	};
	
	configModule = function (setMap) {//setMap为shell模块出传入的参数，（当前传入了一个setChatAnchor函数）
		spa.util.setConfigMap({//shell模块传入的参数，和chat模块自己的参数合并，并传给spa.util.setConfigMap函数处理
			setMap: setMap,
			settableMap: configMap.settableMap,
			configMap: configMap
		});
		return true;
	};
	
	initModule = function ($container) {
		$container.append(configMap.chatHtml);
		stateMap.$container = $container;
		setJqueryMap();  //缓存chat模块elem元素
		setPxSize();  //缓存各元素各状态应该对应的像素尺寸
		jqueryMap.$toggle.prop('title', configMap.sliderCloseTitle);
		jqueryMap.$head.click(onClickToggle);  //注册点击头部侦听器
		return true;
	};
	
	return {
		configModule: configModule,
		initModule: initModule,
		setSliderPosition: setSliderPosition,
		removeSlider: removeSlider,
		handleResize: handleResize
	};
}());
