/*
 * spa.fake.js
 * fake模块
 * 全局变量  $,spa
 */

spa.fake = (function () {
	'use strict';
	var getPeopleList, fakeIdSerial, makeFakeId, mockSio;
	
	fakeIdSerial = 5;
	
	makeFakeId = function () {//模拟生成id
		return 'id_' + String(fakeIdSerial++);
	};
	
	getPeopleList = function () {//伪造的一些数据
		return [
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
	};
	
	mockSio = (function () {//模拟socketIO
		var onSio, emitSio, callbackMap = {};
		
		onSio = function (msgType, callback) {//在callbackMap对象中缓存一个回调函数
			callbackMap[msgType] = callback;  //callbackMap['userUpdate'] = completeLogin;
		};
		
		emitSio = function (msgType, data) {
			if (msgType === 'addUser' && callbackMap.userUpdate) {//userUpdate为从spa.mode模块传入的函数completeLogin
				setTimeout(function () {//延迟3000ms，模拟登录
					callbackMap.userUpdate([{
						_id: makeFakeId(),
						name: data.name,
						cssMap: data.cssMap
					}]);
				}, 3000);
			}
		};
		
		return {
			emit: emitSio,
			on: onSio
		};
	}());
	
	return {
		getPeopleList: getPeopleList,
		mockSio: mockSio
	};
}());
