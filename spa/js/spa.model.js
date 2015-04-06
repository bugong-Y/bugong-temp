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
		user: null  //引用当前用户
	};
	var isFakeData = true;
	var personProto, makePerson, people, makeCid,
		clearPeopleDb, completeLogin, removePerson, initModule;
	
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
	
	removePerson = function (person) {
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

	
	completeLogin = function (userList) {//userUpdate事件（用户登录）的回调函数，更新当前用户
		var userMap = userList[0];  //spa.fake模块传入的一个数组
		delete stateMap.peopleCidMap[userMap.cid];
		stateMap.user.cid = userMap._id;
		stateMap.user.id = userMap._id;
		stateMap.user.cssMap = userMap.cssMap;
		stateMap.peopleCidMap[userMap._id] = stateMap.user;
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
					top: 25,
					left: 25,
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
			var isRemoved, 
				user = stateMap.user;
			isRemoved = removePerson(user);
			stateMap.user = stateMap.anonUser;  //stateMap.anonUser为一个匿名用户，初始化时定义
			$.gevent.publish('spa-logout', [user]);  //发布spa-logout事件
			return isRemoved;
		};
		
		return {
			getByCid: getByCid,
			getDb: getDb,
			getUser: getUser,
			login: login,
			logout: logout
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
			peopleList = spa.fake.getPeopleList();  //得到模拟的数据
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
		people: people
	};
	
}());
