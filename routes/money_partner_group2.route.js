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

// lấy thông tin qua stk 
router.post('/info', async(req, res)=>{
	// body = {
		// "stk_thanh_toan": "1111000000001" 
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

	console.log('body: ', body);
	console.log('headers: ', headers);
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
		body = ({
			data: {
				ten: body.desAccountName
			}
		});
		res.json(body);
	}

	request(options, callback);

		
	// res.json({
	// 	msg: 'post method route money partner group 2' 
	// });
});

// nap tiền
router.post('/add-money', async(req, res)=>{
	// body = {
		// "stk_nguoi_gui": "1234567891234"
		// "stk_nguoi_nhan": "1111000000001",
		// "so_tien": "1000000",
	 // "noi_dung": "chuyen luong"
	// }

	const srcAccountNumber = req.body.stk_nguoi_gui;
	const money = +req.body.so_tien;
	const srcBankCode = 'smartbanking';
	const desAccountNumber = req.body.stk_nguoi_nhan;
	const { desBankCode, secretString, urlAddMoney } = config.foreignBank.group2;
	const content = req.body.noi_dung;

	const { algorithm, expiresIn } = config.foreignBank.group2.jwt;
	const payload = {
		srcAccountNumber,
		srcBankCode,
		desAccountNumber,
		desBankCode,
		money,
		content,
		iat: getIssuedAtNow()
	};

	const x_hashed_data = await jwt.sign({payload}, secretString, {algorithm, expiresIn});
	const headers = ({
		x_hashed_data
	});

	const data = {
		srcAccountNumber,
		srcBankCode,
		desAccountNumber,
		desBankCode,
		money,
		content,
		iat: getIssuedAtNow()
	};

	const dataString = JSON.stringify(data);
	const encrypted_data = await encrypted_dataF(dataString);
	const signed_data = await sign_dataF(dataString);

	const body = ({
		encrypted_data,
		signed_data
	});

	console.log('headers: ', headers);
	console.log('body: ', body);


	res.json({
		status: 1, 
		msg: 'api nap tien cua ngan hang group 2'
	})
});


const getIssuedAtNow = _=>{
	return momentTz.tz('Asia/Bangkok').unix();
}

const encrypted_dataF = async  dataString=> {
    await openpgp.initWorker();

    const publicKeyArmored = key.pgpPubKey(0);

    const { data: encrypted } = await openpgp.encrypt({
        message: openpgp.message.fromText(dataString), // input as Message object
        publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for encryption
    });

    openpgp.destroyWorker();

    return encrypted;
}

const sign_dataF = async dataString=>{
	await openpgp.initWorker();

    const privateKeyArmored = 'YOUR PRIVATE KEY'; // encrypted private key
    const passphrase = '2ymWut79nLCdJIHE6gGODlprdC6cfRXH7e4CI1Tc4EcZkf7VIm7dSABgQS19lle06WHxNvETuGdArT1V'; // what the private key is encrypted with

    const {
        keys: [privateKey]
    } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);

    const {
        data: cleartext
    } = await openpgp.sign({
        message: openpgp.cleartext.fromText(dataString), // CleartextMessage or Message object
        privateKeys: [privateKey] // for signing
    });

    openpgp.destroyWorker();

    return cleartext;
}


//lấy thông tin

module.exports = router;