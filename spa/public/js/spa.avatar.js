/*
 * spa.avatar.js
 * avatar模块
 * 全局变量  $,spa
 */

spa.avatar = (function () {
	'use strict';
	var configMap = {
		settableMap: {
			chatModel: true,
			peopleModel: true
		},
		chatModel: null,
		peopleModel: null
	};
	var stateMap = {//缓存中间值
		dragMap: null,
		$dragTarget: null,
        dragBgColor: undefined
	};
	var jqueryMap = {};
	var getRandRgb, setJqueryMap, updateAvatar,
        onTapNav, onHeldStartNav, onHeldMoveNav,
        onHeldEndNav, onSetChatting, onListChange,
        onLogout, configModule, initModule;

    getRandRgb = function () {//得到一个随机的rgb颜色值
        var i, rgbList = [];
        for (i = 0; i < 3; i++) {
            rgbList.push(Math.floor(Math.random() * 128) + 128);
        }
        return 'rgb(' + rgbList.join(',') + ')';
    };

	setJqueryMap = function ($container) {//缓存jquery对象
        jqueryMap = {
            $container: $container
        };
	};

    updateAvatar = function ($target) {//更新peroson对象样式表，最终会触发listchange事件
        var cssMap, personId;
        cssMap = {
            top: parseInt($target.css('top'), 10),
            left: parseInt($target.css('left'), 10),
            'background-color': $target.css('background-color')
        };
        personId = $target.attr('data-id');
        configMap.chatModel.updateAvatar({
            personId: personId,
            cssMap: cssMap
        });
    };

    onTapNav = function (event) {//点击avatar头像
        var cssMap;
        var $target = $(event.elem_target).closest('.spa-avatar-box');
        if ($target.length === 0) {
            return false;
        }
        $target.css({
            'background-color': getRandRgb()
        });
        updateAvatar($target);
    };

    onHeldStartNav = function (event) {//移动端触摸开始时，初始化拖动对象的初始信息
        var offsetTargetMap, offsetNavMap,
            $target = $(event.elem_target).closest('.spa-avatar-box');
        if ($target.length === 0) {
            return false;
        }
        stateMap.$dragTarget = $target;  //缓存拖动对象
        offsetTargetMap = $target.offset();  //avatar头像偏移值
        offsetNavMap = jqueryMap.$container.offset();  //容器偏移值
        offsetTargetMap.top -= offsetNavMap.top;
        offsetTargetMap.left -= offsetNavMap.left;
        stateMap.dragMap = offsetTargetMap;  //缓存修正后的头像偏移值
        stateMap.dragBgColor = $target.css('background-color');  //缓存背景色
        $target
            .addClass('spa-x-is-darg')
            .css('background-color', '');
    };

    onHeldMoveNav = function (event) {//移动端拖动
        var dragMap = stateMap.dragMap;
        if (!dragMap) {
            return false;
        }
        dragMap.top += event.px_delta_y;  //根据缓存的值，动态修改样式，达到拖动效果
        dragMap.left += event.px_delta_x;
        stateMap.$dragTarget.css({
            top: dragMap.top,
            left: dragMap.left
        });
    };

    onHeldEndNav = function (event) {//移动端触摸结束
        var $dragTarget = stateMap.$dragTarget;
        if (!$dragTarget) {
            return false;
        }
        $dragTarget
            .removeClass('spa-x-is-drag')
            .css('background-color', stateMap.dragBgColor);
        stateMap.dragBgColor = undefined;  //清除缓存
        stateMap.$dragTarget = null;
        stateMap.dragMap = null;
        updateAvatar($dragTarget);  //更新样式表
    };

    onSetChatting = function (event, argMap) {//设置列表的avatar样式
        var newChatting = argMap.newChatting,
            oldChatting = argMap.oldChatting,
            $nav = $(this);
        if (oldChatting) {
            $nav
                .find('.spa-avatar-box[data-id="' + oldChatting.cid + '"]')
                .removeClass('spa-x-is-chatting');
        }
        if (newChatting) {
            $nav
                .find('.spa-avatar-box[data-id="'+ newChatting.cid +'"]')
                .addClass('spa-x-is-chatting');
        }
    };

    onListChange = function (event) {//设置avatar用户列表
        var $nav = $(this),  //当前avatar列表的容器元素
            peopleDb = configMap.peopleModel.getDb(),
            user = configMap.peopleModel.getUser(),
            chatting = configMap.chatModel.getChatting() || {},
            $box;
        $nav.empty();
        if (user.getIsAnon()) {
            return false;
        }
        peopleDb().each(function (person, id) {
            var classList;
            if (person.getIsAnon()) {
                return false;
            }
            classList = ['spa-avatar-box'];
            if (person.id === chatting.id) {//如果是当前正在聊天的对象
                classList.push('spa-x-is-chatting');
            }
            if (person.getIsUser()) {//如果是当前用户
                classList.push('spa-x-is-user');
            }
            $box = $('<div />')
                        .addClass(classList.join(' '))
                        .css(person.cssMap)
                        .attr('data-id', String(person.id))
                        .prop('title', spa.util_b.encodeHtml(person.name))
                        .text(person.name)
                        .appendTo($nav);
        });
    };

	onLogout = function (event, logoutUser) {//当前用户离开时，清空avatar列表
        jqueryMap.$container.empty();
	};

	configModule = function (setMap) {//setMap为shell模块出传入的参数
		spa.util.setConfigMap({//shell模块传入的参数，和chat模块自己的参数合并，并传给spa.util.setConfigMap函数处理
			setMap: setMap,
			settableMap: configMap.settableMap,
			configMap: configMap
		});
		return true;
	};

	initModule = function ($container) {
        setJqueryMap($container);

		$.gevent.subscribe($container, 'spa-listchange', onListChange);
		$.gevent.subscribe($container, 'spa-setchatting', onSetChatting);
		$.gevent.subscribe($container, 'spa-logout', onLogout);

        $container
            .bind('utap', onTapNav)
            .bind('uheldstart', onHeldStartNav)
		    .bind('uheldmove', onHeldMoveNav)
		    .bind('uheldend', onHeldEndNav);
		return true;
	};

	return {
		configModule: configModule,
		initModule: initModule
	};
}());
