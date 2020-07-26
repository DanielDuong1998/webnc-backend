const express = require('express');
const request = require('request');
const NodeRSA = require('node-rsa');

const key = require('../config/RSAKey');
const config = require('../config/default.json');

const router = express.Router();

router.get('', (req, res)=>{

	res.json({
		msg: 'route money partner group 15'
	});
});

// lấy thông tin qua stk 
router.post('/info', async(req, res)=>{
	// body = {
	// 	"stk_thanh_toan": "9001888290950" 
	// }

	const body = ({
		stk: req.body.stk_thanh_toan
	});

	const { partnerCode, secretKey, urlInfo } = config.foreignBank.group15;
	const time = Date.now();
	const publicKeyStr = key.pubKey(1);
	const pubKey = new NodeRSA(publicKeyStr);
	const encryptedData = pubKey.encrypt(JSON.stringify(body) + secretKey + time + partnerCode, 'base64');
	console.log('encrypt: ', encryptedData);

	const headers = ({
		'Content-Type': 'application/json',
		'x-partner-code': partnerCode,
    	'x-timestamp': time,
    	'x-data-encrypted': encryptedData
	});


	const options = {
		url: urlInfo,
		headers,
		method: 'POST',
		body,
		json: true
	};

	const callback = (err, response, body)=>{
		if(err) throw err;
		console.log('body: ', body);
		res.json(body);
	}

	request(options, callback);

});

// nap tiền
router.post('/add-money', async(req, res)=>{
	// body = {
	// 	"stk_nguoi_gui": "1234567891234",
	// 	"stk_nguoi_nhan": "9001654734322",
	// 	"noi_dung": "chuyen tien xay nha",
	// 	"so_tien": "5000000",
	// 	"type": 2 //nguoi nhan chiu phi
	// }

	const body = ({
		from: req.body.stk_nguoi_gui,
		to: req.body.stk_nguoi_nhan,
		description: req.body.noi_dung,
		amount: req.body.so_tien,
		type: req.body.type
	});

	const { partnerCode, secretKey, urlAddMoney } = config.foreignBank.group15;

	const privateKeyStr = key.privateKey();
	const publicKeyStr = key.pubKey(1);
	const priKey = new NodeRSA(privateKeyStr);
	const pubKey = new NodeRSA(publicKeyStr);

	const signature = priKey.sign(JSON.stringify(body), 'base64', 'utf8');

	const time = Date.now();
	const encryptedData = pubKey.encrypt(JSON.stringify(body) + secretKey + time + partnerCode, 'base64');

	const headers = ({
		'Content-Type': 'application/json',
		'x-partner-code': partnerCode,
		'x-rsa-sign': signature,  
		'x-timestamp': time,
		'x-data-encrypted': encryptedData
	});


	const options = {
		url: urlAddMoney,
		headers,
		method: 'POST',
		body,
		json: true
	};

	const callback = (err, response, body)=>{
		if(err) throw err;
		console.log('body: ', body);
		console.log('sign: ', body.signNature);
		res.json(body);
	}

	request(options, callback);
	
});


//lấy thông tin

module.exports = router;