/*
 * spa.model.js
 * model模型
 * 全局变量  $,spa
 */

spa.model = (function () {
	'use strict';
	var configMap = {
		anonId: 'a0'
	};
	var stateMap = {
		anonUser: null,  //引用匿名用户
		peopleCidMap: {},  //通过cid映射所有用户  
		peopleDb: TAFFY(),  //生成taffyDb集合，初始化为空集合
		cidSerial: 0,  //客户端id编号
		user: null,  //引用当前用户
		isConnected: false  //当前用户是否在聊天室中
	};
	var isFakeData = true;
	var personProto, makePerson, people, makeCid,
		clearPeopleDb, completeLogin, removePerson, 
		chat, initModule;
	
	personProto = {//person对象的原型对象，初始包含两个判断是匿名用户还是非匿名用户的方法
		getIsUser: function () {
			return this.cid === stateMap.user.cid;
		},
		getIsAnon: function () {
			return this.cid === stateMap.anonUser.cid;
		}
	};
	
	makePerson = function (personMap) {//根据从数据库中读取数据，生成person对象
		var person;
		var cid = personMap.cid,
			cssMap = personMap.cssMap,
			id = personMap.id,
			name = personMap.name;
		if (cid === undefined || !name) {
			throw 'client id and name required!';
		}
		person = Object.create(personProto);  //已personProto为原型，创建一个新对象
		person.cid = cid;
		person.name = name;
		person.cssMap = cssMap;
		if (id) {//如果存在后台id
			person.id = id;
		}
		stateMap.peopleCidMap[cid] = person;  //构建依据cid的person对象映射
		stateMap.peopleDb.insert(person);  //插入到taffyDb的数据集合中
		return person;
	};
	
	makeCid = function () {//生成客户端id
		return 'c' + String(stateMap.cidSerial++);
	};
	
	clearPeopleDb = function () {//清除数据库中除了当前用户的其它person对象
		var user = stateMap.user;
		stateMap.peopleDb = TAFFY();  //重新初始化taffyDb，清空其中数据
		stateMap.peopleCidMap = {};  //清空依据cid的person对象映射
		if (user) {//重新添加当前用户
			stateMap.peopleDb.insert(user);
			stateMap.peopleCidMap[user.cid] = user;
		}
	};
	
	removePerson = function (person) {//移除一个指定的person对象
		if (!person) {
			return false;
		}
		if (person.id === configMap.anonId) {//如果是匿名用户，无需任何操作
			return false;
		}
		stateMap.peopleDb({cid: person.cid}).remove();  //从taffyDb中移除person数据
		if (person.cid) {
			delete stateMap.peopleCidMap[person.cid];  //清除该person依据cid的映射
		}
		return true;
	};

	
	completeLogin = function (userList) {//addUser（userUpdate）事件（用户登录）的回调函数，更新当前用户
		var userMap = userList[0];  //spa.fake模块传入的一个数组
		delete stateMap.peopleCidMap[userMap.cid];
		stateMap.user.cid = userMap._id;
		stateMap.user.id = userMap._id;
		stateMap.user.cssMap = userMap.cssMap;
		stateMap.peopleCidMap[userMap._id] = stateMap.user;
		chat.join();  //进入聊天室
		$.gevent.publish('spa-login', [stateMap.user]);  //发布spa-login事件
	};
	
	people = (function () {
		var getByCid, getDb, getUser, login, logout;
		
		getByCid = function (cid){//通过cid得到person对象
			return stateMap.peopleCidMap[cid];
		};
		
		getDb = function () {//得到taffyDb数据集合
			return stateMap.peopleDb;
		};
		
		getUser = function () {//得到当前用户
			return stateMap.user;
		};
		
		login = function (name) {//模拟一个用户的登录
			var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			
			stateMap.user = makePerson({//伪造一个将要登录的新用户
				cid: makeCid(),
				cssMap: {
					top: 180,
					left: 20,
					'background-color': '#8f8'
				},
				name: name
			});
			
			sio.on('userUpdate', completeLogin);  //向spa.fake模块，传递一个回调函数，供emit使用
			
			sio.emit('addUser', {//模拟触发登录事件
				cid: stateMap.user.cid,
				cssMap: stateMap.user.cssMap,
				name: stateMap.user.name
			});
		};
		
		logout = function () {//当前用户退出登录
			var user = stateMap.user;
			chat.leave();  //离开聊天室
			stateMap.user = stateMap.anonUser;  //stateMap.anonUser为一个匿名用户，初始化时定义
			clearPeopleDb();
			$.gevent.publish('spa-logout', [user]);  //发布spa-logout事件
		};
		
		return {
			getByCid: getByCid,
			getDb: getDb,
			getUser: getUser,
			login: login,
			logout: logout
		};
	}());
	
	chat = (function () {
		var publishListChange, updateList, leaveChat, joinChat;
		var publishUpdateChat, getChatting, setChatting, sendMsg;
		var chatting = null;  //缓存当前正在聊天的人
		var updateAvatar;

		updateList = function (argList) {//更新在线用户列表
			var i, personMap, makePersonMap;
			var peopleList = argList[0];
			var isChattingOnline = false;
			var person;
			clearPeopleDb();
			PERSON:
			for (i = 0; i < peopleList.length; i++) {
				personMap = peopleList[i];
				if (!personMap.name) {//不存在name属性时，返回
					continue PERSON;
				}
				if (stateMap.user && stateMap.user.id === personMap._id) {//如果是当前用户
                    console.log('dddd');
					stateMap.user.cssMap = personMap.cssMap;  //缓存其当前样式
					continue PERSON;
				}
				makePersonMap = {
					cid: personMap._id,
					cssMap: personMap.cssMap,
					id: personMap._id,
					name: personMap.name
				};
				person = makePerson(makePersonMap);  //存入数据库，并添加映射
				if (chatting && chatting.id === makePersonMap.id) {//如果新返回的列表中，上一次聊天的对象依旧存在
					isChattingOnline = true;
					chatting = person;
				}
			}
			stateMap.peopleDb.sort('name');
			if (chatting && !isChattingOnline) {//正在聊天的对象，已经离开
				setChatting('');
			}
		};
		
		publishListChange = function (argList) {//listchange事件，在线人员发生改变时触发
			updateList(argList);
			$.gevent.publish('spa-listchange', [argList]);
		};
		
		publishUpdateChat = function (argList) {//发布spa-updatechat事件
			var msgMap = argList[0];
			if (!chatting) {//如果不存在正在聊天的对象
				setChatting(msgMap.senderId);  //msgMap.senderId，设置聊天对象为自己
			} else if (msgMap.senderId !== stateMap.user.id && msgMap.senderId !== chatting.id) {//排除当前用户和当前正在聊天的用户
				setChatting(msgMap.senderId);  //重新设置新的聊天对象
			}
			$.gevent.publish('spa-updatechat', [msgMap]);  //发布spa-updatechat事件，由相应的处理程序处理
		};
		
		leaveChat = function () {//离开聊天室
			var sio = isFakeData ? spa.fake.mockSio : spa.data.Sio();
			chatting = null;  //清空正在聊天的人
			stateMap.isConnected = false;  
			if (sio) {
				sio.emit('leavechat');
			}
		};
		
		getChatting = function () {//得到当前正在聊天的人
			return chatting;
		};
		
		joinChat = function () {//进入聊天室
			var sio;
			if (stateMap.isConnected) {
				return false;
			}
			if (stateMap.user.getIsAnon()) {
				console.warn('用户未登录，不能进入聊天室！');
				return false;
			}
			sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			sio.on('listchange', publishListChange);  //通过onSio传入listchange的回调函数publishListChange
			sio.on('updatechat', publishUpdateChat);  //通过onSio传入updatechat的回调函数publishUpdateChat
			stateMap.isConnected = true;
			return true;
		};
		
		sendMsg = function (msgText) {//当前用户发送消息
			var msgMap;
			var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			
			if (!sio) {
				return false;
			}
			if (!(stateMap.user && chatting)) {
				return false;
			}
			msgMap = {
				destId: chatting.id,  //正在聊天的对象
				destName: chatting.name,
				senderId: stateMap.user.id,  //用户自己
				msgText: msgText
			};
			publishUpdateChat([msgMap]);  //执行更新聊天室操作
			sio.emit('updatechat', msgMap);  //模拟对方回复我信息
			return true;
		};
		
		setChatting = function (personId) {//设置正在聊天的对象
			var newChatting;
			newChatting = stateMap.peopleCidMap[personId];  //通过映射，得到一个person对象
			if (newChatting) {
				if (chatting && chatting.id === newChatting.id) {//如果聊天对象并未发生变动
					return false;
				}
			} else {
				newChatting = null;
			}
			$.gevent.publish('spa-setchatting', {//发布spa-setchatting事件
				oldChatting: chatting,
				newChatting: newChatting
			});
			chatting = newChatting;
			return true;
		};

		updateAvatar = function (avatarUpdateMap) {//更新peroson对象样式表
			var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			if (sio) {
				sio.emit('updateavater', avatarUpdateMap);
			}
		};
		
		return {
			leave: leaveChat,
			join: joinChat,
			getChatting: getChatting,
			setChatting: setChatting,
			sendMsg: sendMsg,
			updateAvatar: updateAvatar
		};
		
	}());
	
	initModule = function () {
		var i, peopleList, personMap;
		stateMap.anonUser = makePerson({
			cid: configMap.anonId,
			id: configMap.anonId,
			name: '匿名'
		});
		stateMap.user = stateMap.anonUser;  //初始化时，当前用户为匿名用户
		if (isFakeData) {
			peopleList = spa.fake.peopleList;  //得到模拟的数据
			for (i = 0; i < peopleList.length; i++) {
				personMap = peopleList[i];
				makePerson({
					cid: personMap._id,
					cssMap: personMap.cssMap,
					id: personMap._id,
					name: personMap.name
				});
			}
		}
	};
	
	return {
		initModule: initModule,
		people: people,
		chat: chat
	};
	
}());
