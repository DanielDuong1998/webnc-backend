const express = require('express');
const request = require('request');
const momentTz = require('moment-timezone');
const sha256 = require('sha256');
const jwt = require('jsonwebtoken');
const openpgp = require('openpgp');

const key = require('../config/RSAKey');
const config = require('../config/default.json');

const router = express.Router();

router.get('', (req, res)=>{
	res.json({
		msg: 'route money partner group 2'
	});
});

router.post('/info', async(req, res)=>{
	// body = {
	// 	"stk_thanh_toan": "1111000000001" 
	// }

	const { secretString, desBankCode, urlInfo } = config.foreignBank.group2;
	const { algorithm, expiresIn } = config.foreignBank.group2.jwt;
	const desAccountNumber = req.body.stk_thanh_toan;

	const payload = {
		desAccountNumber,
		desBankCode,
		iat: getIssuedAtNow()
	}

	const x_hashed_data = await jwt.sign({payload}, secretString, {algorithm, expiresIn});

	const headers = ({
		x_hashed_data
	});

	const data = {
		desAccountNumber,
		desBankCode,
		iat: getIssuedAtNow()
	}

	const dataString = JSON.stringify(data);
	const encrypted_data = await encrypted_dataF(dataString);
	const body = ({
		encrypted_data
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

		
	// res.json({
	// 	msg: 'post method route money partner group 2' 
	// });
});

router.post('/add-money', async(req, res)=>{

});




const getIssuedAtNow = _=>{
	return momentTz.tz('Asia/Bangkok').unix();
}

const encrypted_dataF = async  dataString=> {
    await openpgp.initWorker();

    const publicKeyArmored = key.pubKey(0);

    const { data: encrypted } = await openpgp.encrypt({
        message: openpgp.message.fromText(dataString), // input as Message object
        publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for encryption
    });

    openpgp.destroyWorker();

    return encrypted;
}


//lấy thông tin

module.exports = router;