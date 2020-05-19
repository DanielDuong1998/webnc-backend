const express = require('express');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const randToken = require('rand-token');
const foreignBankModel = require('../models/foreignBank.model');
const authModel = require('../models/auth.model');
const userModel = require('../models/user.model');

require('express-async-errors');

const config = require('../config/default.json');
const mdwFunc = require('../middlewares/auth.mdw');


const router = express.Router();

router.get('/', async (req, res)=> {
	const partnerCode = config.foreignBank.partnerCode;
	const ret = await foreignBankModel.all();
	res.json(ret);
});

//login
router.post('/auth', async(req, res)=>{
	// req.body = {
	// 	"body.stk_thanh_toan": "123456789",
	// 	"ma_pin": "123456"
	// }

	const ret = await authModel.login(req.body);

	if(ret === null){
		return res.json({
			authenticated: false
		});
	}

	const userId = ret.id_tai_khoan;
	const accessToken = generateAccessToken(userId);

	var { refresh_token } = await userModel.refreshTokenById(userId);
	
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
router.post('/auth-refresh', async(req, res)=>{
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


router.post('/add-money',mdwFunc.verifyRechargeForeign, async(req, res)=>{
	// req.body = { rsaString: "ádfasjdfaks"}
	//req.bodyDecrypt = {soTien: 10000000}

	let { soTien } = req.bodyDecrypt;
	if(soTien === undefined){
		return res.json({
			status: -6,
			msg: 'do not find field soTien'
		});
	}

	if(Number.isNaN(soTien)){
		return res.json({
			status: -6,
			msg: 'field soTien is not a number'
		});
	}

	if(soTien <= config.foreignBank.minimumMoney){
		return res.json({
			status: -6,
			msg: `soTien could not be smaller ${config.foreignBank.minimumMoney}`
		});
	}
	
	res.json(req.bodyDecrypt);

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