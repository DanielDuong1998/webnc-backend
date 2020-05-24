const express = require('express');
const jwt = require('jsonwebtoken');
const randToken = require('rand-token');

const userModel = require('../models/user.model');
const authModel = require('../models/auth.model');

const config = require('../config/default.json');

const router = express.Router();


//login
router.post('/', async(req, res)=>{
	// req.body = {
	// 	"stk_thanh_toan": "123456789",
	// 	"ma_pin": "123456"
	// }
	
	const ret = await authModel.login(req.body);

	if(ret === null){
		return res.json({
			status: -1,
			msg: 'authenticated false'
		});
	}

	const userId = ret.id_tai_khoan;
	const accessToken = generateAccessToken(userId);

	let refresh_token = (await userModel.refreshTokenById(userId)).refresh_token;
	
	//neu refreshToken khong co san tu truoc, generate refresh token va add vao db
	if(refresh_token === undefined){
		refresh_token = randToken.generate(config.auth.refreshTokenSize);
		await userModel.updateRefreshToken(userId, refresh_token);
	}

	res.json({
		accessToken,
		'refreshToken' : refresh_token,
		ten: ret.ten,
		stkThanhToan: ret.stk_thanh_toan,
		soDuHienTai: ret.so_du_hien_tai
	})
});


//refresh token
router.post('/refresh', async(req, res)=>{
 	// req.body = {
 	// 	accessToken,
 	// 	refreshToken
 	// }

 	jwt.verify(req.body.accessToken, config.auth.secretPassword, {ignoreExpiration: true}, async function(err, payload){
 		const {userId} = payload;
 		const ret = await userModel.verifyRefreshToken(userId, req.body.refreshToken);
 		if(ret === false){
 			//throw createError(400, 'Invalid refresh token.');
 			return res.status(400).json({msg: 'Invalid refresh token.'});
 		}

 		const accessToken = generateAccessToken(userId);
		res.json({ accessToken });
 	});
 });

// generate AccessToken
const generateAccessToken = userId =>{
	const payload = { userId };

	const accessToken = jwt.sign(payload, config.auth.secretPassword, {
		expiresIn: config.auth.expiresIn //10mins 
	});
	return accessToken;
}

module.exports = router;