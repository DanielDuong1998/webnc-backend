const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sha256 = require('sha256');
const moment = require('moment'); // test time
const NodeRSA = require('node-rsa');

const config = require('../config/default.json');

const publicKey = `-----BEGIN PUBLIC KEY-----
MIICITANBgkqhkiG9w0BAQEFAAOCAg4AMIICCQKCAgB5NqBS6gT/H+hEfpRZNKee
VO6AxT/hHtcrMmWG9NuVtT/hQltYYidru7o45y9Xw8fb9xNcF/kKRBBNQyp5g7Wa
jt7nn8SyR8T9/ftOO2VihQwMKh8U1Or3BBSvJmrxfHl6qNpTVN8zicnL8ZccbXAg
vqFiF5e2WyemaXmRMvcCokznfOPqePLDqjpbTEotPSu7UJbmrGyjC0wit78e8Zfj
Xtngl+W6U9/eSRUIc1PBddM6zG8s4jv1FXfL2CC7DJ2g0/J6tyLHykzj/ohEp9CM
JnJugz1Nod8/2KF+1rGiWO6UV4WW/BPaZ6vhJ5daLjQZSmm2iMFUyt/zAeHakYTQ
lkJzFu8MQXfaKRdBAH+NboIKmxvByO+siYeHb2vHQTBDcGGWPvkbgQFJdXy3MyxX
fUjJPPQhm7nCIQSiHBuEbMQN0kj6SUvYkmpdVso1hylrV0+ItE5L8WGpnPbjho+j
5mrMU0l/w2YjPjUz8EKer0Uy/wA31BMBZpjH3+QRTCQtkmnKC0nLUku3yYTEFdjy
iYecRQZ9017OjDB08JwyxnGKdemuI2Eh5yvWEblXzifbCe+NfhDlXY3QLAnUbn+n
HfaC6nn6rvDEktP7KWa8H+WYCMTP2oFmlG+FoQFBXCCQGiL9jBj5OrASBSTUy7d8
VnZ6exs6i2lHKVKvJ+IYwQIDAQAB
-----END PUBLIC KEY-----`;
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`;

const test = _=>{

}

const verifyPartnerCode = partnerCode=>{
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
	let delayTime = moment(currentTime).diff(moment(timestamp));
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

const verifyJWTf = (req, accessToken)=>{
	let ret = ({
		status: -3,
		msg: ''
	});

	if(accessToken === undefined){
		ret.msg = 'do not find access token';
	}

	jwt.verify(accessToken, config.auth.secretPassword, function(err, payload){
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

const verifyForeignLogin = req =>{
	let partnerCode = req.headers['x-partner-code'];
	let timestamp = req.headers['x-timestamp'];
	let sign = req.headers['x-sign'];

	let verify = verifyPartnerCode(partnerCode);
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

const decryptRSA = (req)=>{
	//rsaString  = req.body.rsaString
	// bodyCrypt = ({
	// 	soTienNapVao: 10000000
	// });

	let ret = ({
		status: -5,
		msg: ''
	});
	let { body } = req;
	//let plKey = new NodeRSA(publicKey);
	let pvKey = new NodeRSA(privateKey);
	//let encryptString = plKey.encrypt(body, 'base64');
	//console.log('strRSA: ', encryptString);
	let str = body.rsaString;
	let bodyDecrypt = pvKey.decrypt(str, 'utf8');
	ret.status = 1;
	ret.msg = 'success decrypt';
	console.log('decrypt: ', JSON.parse(bodyDecrypt));
	req.bodyDecrypt = JSON.parse(bodyDecrypt);
	return ret;
}

module.exports = {
	verifyJWT: (req, res, next) =>{
		let accessToken = req.headers['x-access-token'];
		let verify = verifyJWTf(req, accessToken);
		console.log('verify: ', verify);
		if(verify.status === -4){
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

		test();

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
		let accessToken = req.headers['x-access-token'];
		let verify = verifyJWTf(req, accessToken);
		console.log('verify: ', verify);
		if(verify.status === -4){
			console.log('invalid token!');
			return res.json(verify);
		}

		verify = decryptRSA(req);
		console.log('msg: ', verify.msg);
		if(verify.status ==- -5){
			return res.json(verify);
		}
		next();
	}
};