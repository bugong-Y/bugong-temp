/*
 * spa.chat.js
 * chat模块
 * 全局变量  $,spa,getComputedStyle
 */

spa.chat = (function () {
	'use strict';
	var configMap = {
		chatHtml:
			'<div class="spa-chat">'
				+ '<div class="spa-chat-head">'
					+ '<div class="spa-chat-toggle">+</div>'
					+ '<div class="spa-chat-title">聊天窗口</div>'
				+ '</div>'
				+ '<div class="spa-chat-close">×</div>'
				+ '<div class="spa-chat-hold">'
					+ '<div class="spa-chat-list">'
						+ '<div class="spa-chat-list-box">'
						+ '</div>'
					+ '</div>'
					+ '<div class="spa-chat-message-wrapper">'
						+ '<div class="spa-chat-message">'
						+ '</div>'
						+ '<div class="spa-chat-box">'
                            + '<form class="spa-chat-form">'
                                + '<input type="text"  />'
                                + '<input type="submit" style="display: none;" />'
                                + '<div class="spa-chat-send">发送</div>'
                            + '</form>'
			            + '</div>'
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
		setPxSize, setSliderPosition,
		removeSlider, handleResize, scrollChat, writeChat,
        writeAlert, clearChat, onTapToggle, onSubmitMsg,
        onTapList, onSetChatting, onUpdateChat, onListChange,
        onLogin, onLogout;

	setJqueryMap = function () {
		var $container = stateMap.$container;
		var $slider = $container.find('.spa-chat');
		jqueryMap = {//初始化并缓存chat模块各元素
			$slider: $slider,
			$head: $slider.find('.spa-chat-head'),
			$toggle: $slider.find('.spa-chat-toggle'),
			$title: $slider.find('.spa-chat-title'),
			$hold: $slider.find('.spa-chat-hold'),
            $listBox: $slider.find('.spa-chat-list-box'),
            $msgLog: $slider.find('.spa-chat-message'),
            $msgSendBox: $slider.find('.spa-chat-box'),
            $input: $slider.find('.spa-chat-box input[type=text]'),
            $sendBtn: $slider.find('.spa-chat-send'),
            $form: $slider.find('.spa-chat-form'),
            $window: $(window)
		};
	};
	
	setPxSize = function () {//缓存模块各元素应该对应的像素值
		var pxPerEm, openedHeightEm, windowHeightEm;
		pxPerEm = spa.util_b.getEmSize(jqueryMap.$slider[0]);  //得到1em对应的像素值
		windowHeightEm = Math.floor((jqueryMap.$window.height() / pxPerEm) + 0.5);  //获取当前窗口大小
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
        if (positionType === 'opened' && configMap.peopleModel.getUser().getIsAnon()) {
            return false;
        }
		if (stateMap.positionType === positionType) {//如果当前已是目标状态，不执行任何操作，返回true值
            if (positionType === 'opened') {
                jqueryMap.$input.focus();
            }
			return true;
		}
		switch (positionType) {//设置动画函数，需要的参数值
			case 'opened':
					heightPx = stateMap.sliderOpenedPx;
					animateTime = configMap.sliderOpenTime;
					sliderTitle = configMap.sliderOpenTitle;
					toggleText = '=';
                    jqueryMap.$input.focus();
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

    scrollChat = function () {//滚动对话消息展示窗口，使其展示最新消息
        var $msgLog = jqueryMap.$msgLog;
        $msgLog.animate({
            scrollTop: $msgLog.prop('scrollHeight') - $msgLog.height()
        }, 150);
    };

    writeChat = function (personName, text, isUser) {//插入一条用户消息
        var msgClass = isUser ? 'spa-chat-message-me' : 'spa-chat-message-listener';
        jqueryMap.$msgLog.append(
            '<div class="' + msgClass + '">'
            + spa.util_b.encodeHtml(personName) + ': '
            + spa.util_b.encodeHtml(text) + '</div>'
        );
        scrollChat();  //滚动对话信息展示窗口，使其展示最新消息
    };

    writeAlert = function (alertText) {//插入一条系统提示消息
        jqueryMap.$msgLog.append(
            '<div class="spa-chat-message-alert">'
            + spa.util_b.encodeHtml(alertText)
            + '</div>'
        );
    };

    clearChat = function () {//清空消息展示窗口
        jqueryMap.$msgLog.empty();
    };

    onTapToggle = function () {//点击chat模块头部时
		var setChatAnchor = configMap.setChatAnchor;  //configMap.setChatAnchor通过初始化配置时得到，是shell模块的一个函数
		if (stateMap.positionType === 'opened') {
			setChatAnchor('closed');  //setChatAnchor在shell模块中定义，setChatAnchor -> changeAnchorPart -> onHashChange
		} else if (stateMap.positionType === 'closed') {
			setChatAnchor('opened');
		}
		return false;
	};

    onSubmitMsg = function (event) {//发送消息
        var msgText = jqueryMap.$input.val();
        if (msgText.trim() === '') {
            return false;
        }
        configMap.chatModel.sendMsg(msgText);  //发布发送消息事件
        jqueryMap.$input.focus();
        jqueryMap.$sendBtn.addClass('spa-x-select');
        setTimeout(function () {
            jqueryMap.$sendBtn.removeClass('spa-x-select');
        }, 250);
        return false;
    };

    onTapList = function (event) {//点击用户列表时，设置新的聊天对象
        var tapped = $(event.elem_target),chattingId;
        if (!tapped.hasClass('spa-chat-list-name')) {
            return false;
        }
        chattingId = tapped.attr('data-id');
        if (!chattingId) {
            return false;
        }
        configMap.chatModel.setChatting(chattingId);  //设置新的聊天对象
        return false;
    };

    onSetChatting = function (event, argMap) {//设置当前正在聊天的对象
        var newChatting = argMap.newChatting,
            oldChatting = argMap.oldChatting;
        jqueryMap.$input.focus();
        if (!newChatting) {//如果没有设置新的聊天对象
            if (oldChatting) {
                writeAlert(oldChatting.name + ' 本来就在和这个人聊天！');
            } else {
                writeAlert('没和任何人聊天！');
            }
            jqueryMap.$title.text('聊天室');
            return false;
        }
        jqueryMap.$listBox
            .find('.spa-chat-list-name')
            .removeClass('spa-x-select')
            .end()
            .find('[data-id=' + argMap.newChatting.id + ']')
            .addClass('spa-x-select');  //设置左侧聊天列表的样式
        writeAlert('现在正和' + argMap.newChatting.name + '聊天！');  //发送系统消息
        jqueryMap.$title.text('现在正和' + argMap.newChatting.name + '聊天！');  //设置chat模块标题
        return true;
    };

    onListChange = function (event) {//更新用户列表
        var listHtml = '',
            peopleDb = configMap.peopleModel.getDb(),  //得到taffyDb数据集合
            chatting = configMap.chatModel.getChatting();  //得到当前用户

        peopleDb().each(function (person, id) {
            var selectClass = '';
            if (person.getIsAnon() || person.getIsUser()) {//匿名用户或当前用户时，不执行任何操作
                return true;
            }
            if (chatting && chatting.id === person.id) {
                selectClass = 'spa-x-select';
            }
            listHtml +=
                '<div class="spa-chat-list-name ' + selectClass
                + '" data-id="' + person.id + '">'
                + spa.util_b.encodeHtml(person.name)
                + '</div>';
        });
        if (!listHtml) {
            listHtml =
                '<div class="spa-chat-list-note">'
                + '无人在线！'
                + '</div>';
            clearChat();
        }
        jqueryMap.$listBox.html(listHtml);
    };

    onUpdateChat = function (event, msgMap) {//更新消息展示窗口
        var isUser,
            senderId = msgMap.senderId,
            msgText = msgMap.msgText,
            chatting = configMap.chatModel.getChatting() || {},
            sender = configMap.peopleModel.getByCid(senderId);
        if (!sender) {
            writeAlert(msgText);
            return false;
        }
        isUser = sender.getIsUser();
        if (!(isUser || senderId === chatting.id)) {//如果不是用户自己或者不是当前正在聊天的对象
            configMap.chatModel.setChatting(senderId);
        }
        writeChat(sender.name, msgText, isUser);  //向对话框中，写入消息
        if (isUser) {//如果当前消息是用户自己发送的消息，清空输入框，并使其获得焦点，方便下一次发送
            jqueryMap.$input.val('');
            jqueryMap.$input.focus();
        }
    };

    onLogin = function (event, loginUser) {//用户登录时，打开chat模块
        configMap.setChatAnchor('opened');
    };

    onLogout = function (event, logoutUser) {//用户登出时，关闭chat模块
        configMap.setChatAnchor('closed');
        jqueryMap.$title.text('聊天室');
        clearChat();  //清空对话框中的消息
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
        var $listBox;
		$container.append(configMap.chatHtml);
		stateMap.$container = $container;
		setJqueryMap();  //缓存chat模块elem元素
		setPxSize();  //缓存各元素各状态应该对应的像素尺寸
		jqueryMap.$toggle.prop('title', configMap.sliderCloseTitle);

        $listBox = jqueryMap.$listBox;
        $.gevent.subscribe($listBox, 'spa-listchange', onListChange);
        $.gevent.subscribe($listBox, 'spa-setchatting', onSetChatting);
        $.gevent.subscribe($listBox, 'spa-updatechat', onUpdateChat);
        $.gevent.subscribe($listBox, 'spa-login', onLogin);
        $.gevent.subscribe($listBox, 'spa-logout', onLogout);

        jqueryMap.$head.bind('utap', onTapToggle);
        jqueryMap.$listBox.bind('utap', onTapList);
        jqueryMap.$sendBtn.bind('utap', onSubmitMsg);
        jqueryMap.$form.bind('submit', onSubmitMsg);
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
