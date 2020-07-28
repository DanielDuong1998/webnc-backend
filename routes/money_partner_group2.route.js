const express = require('express');
const request = require('request');
const momentTz = require('moment-timezone');
const sha256 = require('sha256');
const jwt = require('jsonwebtoken');
const openpgp = require('openpgp');

const key = require('../config/RSAKey');
const config = require('../config/default.json');

const userModel = require('../models/user.model');
const history_partner_bankModel = require('../models/history_partner_bank.model');


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
	 // 	"noi_dung": "chuyen luong"
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

	// console.log('headers: ', headers);
	// console.log('body: ', body);

	const options = {
		url: urlAddMoney,
		headers,
		method: 'POST',
		body,
		json: true
	};

	const {stk_nguoi_gui, stk_nguoi_nhan, ten_nguoi_nhan, so_tien, noi_dung} = req.body;
	const entity = ({
		stk_nguoi_gui: req.body.stk_nguoi_gui,
		so_tien: +req.body.so_tien
	});

	const callback = async (err, response, body)=>{
		if(err) throw err;
		console.log('body: ', body);
		body.status = body.status || 1;
		await subMoney(entity);
		let ret = ({
			stk_nguoi_gui,
			stk_nguoi_nhan,
			ten_nguoi_nhan,
			so_tien,
			noi_dung,
			"sign": body.signedData
		});
		console.log('ret: ', ret);
		await saveHistory(ret);
		res.json(body);
	}

	request(options, callback);


	// res.json({
	// 	status: 1, 
	// 	msg: 'api nap tien cua ngan hang group 2'
	// })
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

    const privateKeyArmored = key.pgpPriKey(0); // encrypted private key
    const passphrase = config.foreignBank.group2.pgpStr.passphrase; // what the private key is encrypted with

    const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
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

const subMoney = async entity=>{
	let {stk_nguoi_gui, so_tien} = entity;
	await userModel.subMoney(stk_nguoi_gui, so_tien);
}

const saveHistory = async entity=>{
	let {stk_nguoi_gui, stk_nguoi_nhan, ten_nguoi_nhan, so_tien, noi_dung, sign} = entity;
	let thoi_gian = momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
	let ret = ({
		stk_doi_tac: stk_nguoi_nhan,
		stk_noi_bo: stk_nguoi_gui,
		ten_doi_tac: ten_nguoi_nhan,
		so_tien,
		noi_dung,
		thoi_gian,
		type: 0,
		id_ngan_hang_doi_tac: 2,
		sign
	});
	await history_partner_bankModel.add(ret);
}


//lấy thông tin

module.exports = router;