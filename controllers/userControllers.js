const UserModel = require('../models/userModel');
const redis = require('../config/db_redis');
const md5 = require('../tools/Jcrypto').md5;
const Jverify = require('../tools/Jverify');
const Jcommon = require('../tools/Jcommon');
/**
 * params:  {user_email,user_password,user_name}
 * return:  users
 * describe: user_regist
 **/
const user_regist = async function (req, res) {
	console.log("controllers/UserController.js/user_regist start --> " + JSON.stringify(req.body));
	const respondData = {
		status: 200,
		data: {},
		error: '',
		msg:''
	};
	// 检查必传字段是否传过来
	const is_available = Jcommon.check_key_words(["user_email", "user_password","user_name"], req, res, 'POST');
	if (is_available == false) return; // 如果字段不合格，直接返回
	const user_email = req.body.user_email;
	const user_password = req.body.user_password;
	const user_name = req.body.user_name;

	// 验证邮箱是否正确
	const is_email = Jverify.verify_email(user_email);
	if (is_email == false) {
		respondData.status = 10000;
		respondData.error = "邮箱不符合规范";
		return res.json(respondData);
	}

	// 验证密码是否正确
	const is_password_str = Jverify.verify_password(user_password);
	const is_enable_length = (user_password.length > 6 && user_password.length < 20) ? true : false;
	if (!(is_password_str && is_enable_length)) {
		respondData.status = 10001;
		respondData.error = "密码不符合规范";		
		return res.json(respondData);
	}
	try {
		const user = await findUserAsyc({ 'useremail': user_email });//验证用户是否已注册
		if (user) {
			respondData.status = 10002;
			respondData.error = "邮箱已注册";
			return res.json(respondData);
		}
		//用户参数
		const userpassword = md5(user_password);
		const userInfo = {
			useremail: user_email,
			username: user_name,
			userpwd: userpassword,
			status:0,
			create_time: Date.now('YYYY-MM-DD')
		};
		//新建用户
		console.log("newGuess.save userInfo-->" + JSON.stringify(userInfo));
		const newUser = new UserModel(userInfo);
		newUser.save(function (err, data) {
			if (err) {
				console.log("newGuess.save err-->" + JSON.stringify(err));
				respondData.status = "00001";
				respondData.error = "mongodb system error";
				return res.json(respondData);
			}
			console.log("newGuess.save data -->" + JSON.stringify(data));
			respondData.msg = "新用户注册成功";
			return res.json(respondData);
		});
	} catch (error) {
		//错误处理
		console.log("controllers/UserController.js/user_regist error -->" + JSON.stringify(error));
		respondData.error = error;
		return res.json(respondData);
	}
}

/**
 * params:  {cnd}:user find condition
 * return:  user
 * describe: findUserAsyc
 **/
const findUserAsyc = async function (cnd) {
	console.log("controllers/UserController.js/findUserAsyc start --> " + JSON.stringify(cnd));
	return new Promise(function (resolve, reject) {
		UserModel.findOne(cnd, function (error, data) {
			console.log("controllers/UserController.js/findUserAsyc findOne  data --> " + JSON.stringify(data));
			if (error) {
				return reject(error);
			}
			return resolve(data);
		});
	})
}

exports.user_regist = user_regist;