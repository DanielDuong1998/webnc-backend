const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sha256 = require('sha256');
const moment = require('moment'); // test time
const momentTz = require('moment-timezone');
const NodeRSA = require('node-rsa');

const config = require('../config/default.json');
const rsaKey = require('../config/RSAKey');

const publicKey = rsaKey.publicKey();
const privateKey = rsaKey.privateKey();

const test = req=>{
	let ts = req.headers['x-timestamp'];
	let priKey = new NodeRSA(rsaKey.priKey(1));
	const sign = priKey.sign(ts, 'base64', 'utf8');
	console.log('signrsa: ', sign);
}


const verifyPartnerCode = (req, partnerCode)=>{
	let ret = ({
		status: -1,
		msg: ''
	});

	if(partnerCode === undefined){
		ret.msg = 'do not find partner code';
		return ret;
	}

	const listPartnerCode = config.foreignBank.partnerCode;
	const found = listPartnerCode.find(e => e === partnerCode);

	if(found === undefined){
		ret.msg = 'do not find partner';
		return ret;
	}
	
	const idPartner = listPartnerCode.findIndex(e=>{
		return e === found;
	});
	req.idPartner = idPartner;

	ret = ({
		status: 1,
		msg: 'success verify partner code!'
	});
	console.log('status-time: ', ret.msg);
	return ret;
}


const verifyTime = timestamp=>{
	let ret = ({
		status: -2,
		msg: ''
	});

	if(timestamp === undefined){
		ret.msg = 'do not find timestamp';
		return ret;
	}

	// chưa đổi múi giờ
	let currentTime = moment().format('YYYY-MM-DD HH:mm:ss');

	// đổi sang múi giờ việt nam
	let timestampTZ = momentTz(timestamp).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
	let currentTimeTZ = momentTz(currentTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');

	let delayTime = moment(currentTimeTZ).diff(moment(timestampTZ));

	console.log('delayTime: ', delayTime);
	if(delayTime > config.foreignBank.delayTime){
		ret.msg = 'The package was expired';
		return ret;
	}
	ret.status = 1;
	ret.msg = 'success verify timestamp';
	return ret;
}


const verifySign = (req, sign, timestamp, partnerCode)=>{
	let ret = ({
		status: -3,
		msg: ''
	});

	if(sign === undefined) {
		ret.msg = 'do not find sign';
		return ret;
	}

	
	let str = JSON.stringify(req.body) + timestamp + config.foreignBank.secretSign + partnerCode;
	console.log('time: ', timestamp);
	console.log('sign: ', sign);
	let signRemake = sha256(str);
	console.log('signRemake: ', signRemake);
	if(sign !== signRemake){
		ret.msg = 'The package was changed';
		return ret;
	}
	ret.status = 1;
	ret.msg = 'success verify sign';
	return ret;
}


const verifyForeignLogin = req =>{
	let partnerCode = req.headers['x-partner-code'];
	let timestamp = req.headers['x-timestamp'];
	let sign = req.headers['x-sign'];

	let verify = verifyPartnerCode(req, partnerCode);
	if(verify.status === -1){
		return verify;
	}

	verify = verifyTime(timestamp);
	if(verify.status === -2){
		return verify;
	}

	verify = verifySign(req, sign, timestamp, partnerCode);
	if(verify.status === -3){
		return verify;
	}

	verify.status = 1;
	verify.msg = 'success verify foreign login';

	return verify;
}


const verifyJWTf = (req, accessToken, id)=>{
	let ret = ({
		status: -3,
		msg: ''
	});

	if(accessToken === undefined){
		ret.msg = 'do not find access token';
	}

	jwt.verify(accessToken, config.auth.secretPassword[id], function(err, payload){
		console.log('payload: ', payload);
		if(err) {
			console.log('err: ', err);
			ret.msg = 'accessToken err';
		}
		else {
			req.tokenPayload = payload;
			ret.status = 1;
			ret.msg = 'success verify access token';
		}
	});
	return ret;
}


const verifyRSA = (req)=>{
	// headers['x-rsa-sign']
	// rsaSign = (ts, 'base64', 'utf8')
	let rsaSign = req.headers['x-rsa-sign'];
	let timeStamp = req.headers['x-timestamp'];

	let ret = ({
		status: -4,
		msg: ''
	});

	if(rsaSign === undefined){
		ret.msg = 'do not find rsaSign';
		return ret;
	}

	console.log('idpartner: ', req.idPartner);
	let pubKey = new NodeRSA(rsaKey.pubKey(req.idPartner));
	let verify = pubKey.verify(timeStamp, rsaSign, 'utf8', 'base64');
	if(verify === false){
		ret.msg = 'verify rsa errors';
		return ret;
	}

	ret.status = 1;
	ret.msg = 'success verify rsa';
	return ret;
}

module.exports = {
	verifyJWT: (req, res, next) =>{
		let accessToken = req.headers['x-access-token'];
		console.log('headers: ', req.headers);
		let verify = verifyJWTf(req, accessToken, 0);
		console.log('verify: ', verify);
		if(verify.status === -3){
			console.log('invalid token!');
			return res.json(verify);
		}
		console.log('correct token');
		next();
	},
	verifyJWTAd: (req, res, next) =>{
		let accessToken = req.headers['x-access-token'];
		console.log('headers: ', req.headers);
		let verify = verifyJWTf(req, accessToken, 1);
		console.log('verify: ', verify);
		if(verify.status === -3){
			console.log('invalid token!');
			return res.json(verify);
		}
		console.log('correct token');
		next();
	},
	verifyJWTEm: (req, res, next) =>{
		let accessToken = req.headers['x-access-token'];
		console.log('headers: ', req.headers);
		let verify = verifyJWTf(req, accessToken, 2);
		console.log('verify: ', verify);
		if(verify.status === -3){
			console.log('invalid token!');
			return res.json(verify);
		}
		console.log('correct token');
		next();
	},
	verifyGetInfoForeign: (req, res, next) =>{
		// req.headers = {
		// 	"x-partner-code": "",
		// 	"x-timestamp": "",
		// 	"x-sign": "" == (req.body + timestamp + config.secretSign + partnerCode )
		// }

		test(req);

		let verify = verifyForeignLogin(req);
		if(verify.status === 1){
			console.log('verify: ', verify);
			next();
		}
		else {
			return res.json(verify);
		}
	},
	verifyRechargeForeign: (req, res, next)=>{
		// let accessToken = req.headers['x-access-token'];
		// let verify = verifyJWTf(req, accessToken);
		// console.log('verify: ', verify);
		// if(verify.status === -4){
		// 	console.log('invalid token!');
		// 	return res.json(verify);
		// }

		let verify = verifyRSA(req);
		console.log('msg: ', verify.msg);
		if(verify.status === -4){
			return res.json(verify);
		}
		next();
	}
};