/*
 * spa.fake.js
 * fake模块
 * 全局变量  $,spa
 */

spa.fake = (function () {
	'use strict';
	var peopleList, fakeIdSerial, makeFakeId, mockSio;
	
	fakeIdSerial = 5;
	
	makeFakeId = function () {//模拟生成id
		return 'id_' + String(fakeIdSerial++);
	};
	
	peopleList = [
			{
				name: 'brendan',
				_id: 'id_01',
				cssMap: {
					top: 20,
					left: 20,
					'background-color': 'red'
				}
			},
			{
				name: 'mike',
				_id: 'id_02',
				cssMap: {
					top: 60,
					left: 20,
					'background-color': 'green'
				}
			},
			{
				name: 'fuck',
				_id: 'id_03',
				cssMap: {
					top: 100,
					left: 20,
					'background-color': 'blue'
				}
			},
			{
				name: 'yyl',
				_id: 'id_04',
				cssMap: {
					top: 140,
					left: 20,
					'background-color': 'yellow'
				}
			}
		];
	
	mockSio = (function () {//模拟socketIO
		var onSio, emitSio, callbackMap = {};
		var sendListChange, listChangeTimeoutId;
		var emitMockMsg;
		
		onSio = function (msgType, callback) {//在callbackMap对象中缓存一个回调函数
			callbackMap[msgType] = callback;  //如callbackMap['userUpdate'] = completeLogin;
		};
		
		emitSio = function (msgType, data) {
			var personMap;
			
			if (msgType === 'addUser' && callbackMap.userUpdate) {//userUpdate为从spa.mode模块传入的函数completeLogin
				setTimeout(function () {//延迟3000ms，模拟登录
					personMap = {
						_id: makeFakeId(),
						name: data.name,
						cssMap: data.cssMap						
					};
					peopleList.push(personMap);
					callbackMap.userUpdate([personMap]);
				}, 3000);
			}
			
			if (msgType === 'updatechat' && callbackMap.updatechat) {//发送信息，接收信息时
				setTimeout(function () {
					var user = spa.model.people.getUser();	
					
					callbackMap.updatechat([{//模拟我接收信息
						destId: user.id,  //消息发送者
						destName: user.name, 
						senderId: data.destId,  //data.destId代表我（另一个我），消息接受者
						msgText: '我是' + user.name
					}]);
				}, 2000);
			}
			
			if (msgType === 'leavechat') {//用户（可能是我）离开聊天室时，当前并未指定谁离开
				delete callbackMap.listchange;  //移除对listchange事件处理函数的引用
				delete callbackMap.updatechat;  //移除对updatechat事件处理函数的引用
				if (listChangeTimeoutId) {//如果这时有listchange事件还未处理，先移除这个侦听器，用最新的列表一次性更新。
					clearTimeout(listChangeTimeoutId);
					listChangeTimeoutId = undefined;
				}
				sendListChange();  //触发listchange事件
			}
		};
		
		sendListChange = function () {//有用户离开，用户列表发生变化
			listChangeTimeoutId = setTimeout(function () {
				if (callbackMap.listchange) {
					callbackMap.listchange([peopleList]);  //传递了最新的用户列表
					emitMockMsg();  //模拟另一个用户向我发送信息
					listChangeTimeoutId = undefined;
				} else {
					sendListChange();
				}
			}, 1000);
		};
		
		emitMockMsg = function () {//模拟用户向我发送信息
			setTimeout(function () {
				var user = spa.model.people.getUser();
				if (callbackMap.updatechat) {
					callbackMap.updatechat([{
						destId: user.id,  //消息接收者
						destName: user.name,
						senderId: 'id_04',  //消息发送者
						msgText: '你好，'+ user.name + '，我发生了一些操作!'
					}]);
				} else {
					emitMockMsg();
				}
			}, 8000);
		};
		
		sendListChange();  //模拟用户离开
		
		return {
			emit: emitSio,
			on: onSio
		};
	}());
	
	return {
		mockSio: mockSio,
		peopleList: peopleList
	};
}());
