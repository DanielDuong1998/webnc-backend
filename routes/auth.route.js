const express = require('express');
const jwt = require('jsonwebtoken');
const randToken = require('rand-token');

const userModel = require('../models/user.model');
const authModel = require('../models/auth.model');
const accountModel = require('../models/account.model');

const config = require('../config/default.json');

const router = express.Router();


//login
router.post('/', async(req, res)=>{
	// req.body = {
	// 	"stk_thanh_toan": "123456789",
	// 	"ma_pin": "123456"
	// }

	console.log('body: ',req.body);

	let role, ret;
	if(req.body.stk_thanh_toan.length === 13){
		role = 0;
		ret = await authModel.login(req.body);
	}
	else if(req.body.stk_thanh_toan.length === 12){
		role = 1;
		req.body.role = 0;
		const entity1 = ({
			tai_khoan: req.body.stk_thanh_toan,
			mat_khau: req.body.ma_pin,
			role: 0
		});
		ret = await authModel.loginAccount(entity1);
	}
	else if(req.body.stk_thanh_toan.length === 11){
		role = 2;
		req.body.role = 1;
		const entity2 = ({
			tai_khoan: req.body.stk_thanh_toan,
			mat_khau: req.body.ma_pin,
			role: 1
		});
		ret = await authModel.loginAccount(entity2);
	}

	if(ret === null){
		return res.json({
			status: -1,
			msg: 'authenticated false'
		});
	}

	switch(role){
		case 0: {
			const userId = ret.id_tai_khoan;
			const accessToken = generateAccessToken(userId, 0);

			let row = (await userModel.refreshTokenById(userId));
			let refresh_token = '';
			//neu refreshToken khong co san tu truoc, generate refresh token va add vao db
			if(row === undefined){
				refresh_token = randToken.generate(config.auth.refreshTokenSize);
				await userModel.updateRefreshToken(userId, refresh_token);
			}
			else refresh_token = row.refresh_token;

			return res.json({
				status: 1,
				accessToken,
				refreshToken : refresh_token,
				ten: ret.ten,
				stkThanhToan: ret.stk_thanh_toan,
				soDuHienTai: ret.so_du_hien_tai,
				role
			});
		}
		case 1: {
			const userId = ret.id;
			const accessToken = generateAccessToken(userId, 1);

			let row = (await accountModel.refreshTokenById(userId));
			let refresh_token = '';
			//neu refreshToken khong co san tu truoc, generate refresh token va add vao db
			if(row.refresh_token === null){
				refresh_token = randToken.generate(config.auth.refreshTokenSize);
				await accountModel.updateRefreshToken(userId, refresh_token);
			}
			else refresh_token = row.refresh_token;

			return res.json({
				status: 1,
				accessToken,
				refreshToken: refresh_token,
				id: ret.id,
				taiKhoan: ret.tai_khoan,
				ten: ret.ten,
				role: 1
			});
		}
		default: {
			const userId = ret.id;
			const accessToken = generateAccessToken(userId, 2);

			let row = (await accountModel.refreshTokenById(userId));
			let refresh_token = '';
			//neu refreshToken khong co san tu truoc, generate refresh token va add vao db
			if(row.refresh_token === null){
				refresh_token = randToken.generate(config.auth.refreshTokenSize);
				await accountModel.updateRefreshToken(userId, refresh_token);
			}
			else refresh_token = row.refresh_token;

			return res.json({
				status: 1,
				accessToken,
				refreshToken: refresh_token,
				id: ret.id,
				taiKhoan: ret.tai_khoan,
				ten: ret.ten,
				role: 2
			});
		}
	}

	const userId = ret.id_tai_khoan;
	const accessToken = generateAccessToken(userId);

	let row = (await userModel.refreshTokenById(userId));
	let refresh_token = '';
	//neu refreshToken khong co san tu truoc, generate refresh token va add vao db
	if(row === undefined){
		refresh_token = randToken.generate(config.auth.refreshTokenSize);
		await userModel.updateRefreshToken(userId, refresh_token);
	}
	else refresh_token = row.refresh_token;

	res.json({
		status: 1,
		accessToken,
		refreshToken : refresh_token,
		ten: ret.ten,
		stkThanhToan: ret.stk_thanh_toan,
		soDuHienTai: ret.so_du_hien_tai,
		role
	});
});


//refresh token
router.post('/refresh', async(req, res)=>{
 	// req.body = {
 		// accessToken,
 		// refreshToken
	 // }
	 const access_token = req.body.accessToken;
	 const refresh_token = req.body.refreshToken;
 	console.log('secret: ', config.auth.secretPassword[0]);
 	jwt.verify(access_token, config.auth.secretPassword[0], {ignoreExpiration: true}, async function(err, payload){
 		if(err) throw err;
 		console.log('payload: ', payload);
 		const {userId} = payload;
 		const ret = await userModel.verifyRefreshToken(userId, refresh_token);
		 
		 if(ret === false){
			 //throw createError(400, 'Invalid refresh token.');
			 
			// jwt.verify(access_token, config.auth.secretPassword[1], {ignoreExpiration: true}, async function(err1, payload1){
			// 	if(err1) throw err1;
			// 	console.log('payload1: ', payload1);
			// 	const {userId} = payload1;
			// 	const ret1 = await 
			// });

 			return res.status(400).json({msg: 'Invalid refresh token.'});
 		}

 		const accessToken = generateAccessToken(userId, 0);
		res.json({ accessToken });
 	});
 });

// generate AccessToken
const generateAccessToken = (userId, role) =>{
	const payload = { userId };
	const accessToken = jwt.sign(payload, config.auth.secretPassword[role], {
		expiresIn: config.auth.expiresIn //10mins 
	});
	return accessToken;
}

module.exports = router;