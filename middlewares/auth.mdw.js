const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sha256 = require('sha256');
const moment = require('moment'); // test time

const config = require('../config/default.json');

const test = _=>{
	let currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
	//console.log('current: ', currentTime);
}

const verifyPartnerCode = partnerCode=>{
	const listPartnerCode = config.foreignBank.partnerCode;
	const found = listPartnerCode.find(e => e === partnerCode);
	if(found === undefined){
		return false;
	}
	return true;
}

const verifyTime = timestamp=>{
	// chưa đổi múi giờ
	const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
	const delayTime = moment(currentTime).diff(moment(timestamp));
	if(delayTime > config.foreignBank.delayTime){
		return false;
	}
	return true;
}

const verifySign = (req, sign, timestamp, partnerCode)=>{
	const str = JSON.stringify(req.body) + timestamp + config.foreignBank.secretSign + partnerCode;
	console.log('time: ', timestamp);
	console.log('sign: ', sign);
	const signRemake = sha256(str);
	console.log('signRemake: ', signRemake);
	if(sign !== signRemake){
		return false;
	}
	return true;
}


module.exports = {
	verifyJWT: (req, res, next) =>{
		const token = req.headers['x-access-token'];
		console.log('token: ', token);
		if(token){
			jwt.verify(token, config.auth.secretPassword, function(err, payload){
				if(err)
					throw createError(401, err);
				
				console.log('payload', payload);
				req.tokenPayload = payload;
				next();
			});
		}
		else {
			throw createError(401, 'No accessToken found');
		}
	},
	verifyGetInfoForeign: (req, res, next) =>{
		// req.headers = {
		// 	"x-partner-code": "",
		// 	"x-timestamp": "",
		// 	"x-sign": "" == (req.body + timestamp + config.secretSign + partnerCode )
		// }

		//kiem tra x-partner-code
		const partnerCode = req.headers['x-partner-code'];
		var verify = verifyPartnerCode(partnerCode);
		if(verify === false){
			console.log('No find partner');
			return res.status(401).json({
				status: -1,
				msg: 'No find partner'
			});
		}
		console.log('success verify partner code!');


		//kiem tra thoi gian
		const timestamp = req.headers['x-timestamp'];
		verify = verifyTime(timestamp);
		if(verify === false){
			console.log('The package was expired');
			return res.status(401).json({
				status: -2,
				msg: 'The package was expired'
			});
		}
		console.log('goi tin con han');


		//kiem tra sign
		const sign = req.headers['x-sign'];
		verify = verifySign(req, sign, timestamp, partnerCode);
		if(verify === false){
			console.log('The package was changed!');
			return res.status(401).json({
				status: -3,
				msg: 'The package was changed!'
			});
		}
		console.log('goi tin nguyen');

		next();
	}
};