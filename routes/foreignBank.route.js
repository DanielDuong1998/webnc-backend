const express = require('express');
const moment = require('moment');
const NodeRSA = require('node-rsa');

const foreignBankModel = require('../models/foreignBank.model');
const userModel = require('../models/user.model');

require('express-async-errors');

const config = require('../config/default.json');
const rsaKey = require('../config/RSAKey');
const mdwFunc = require('../middlewares/auth.mdw');


const router = express.Router();

router.get('/', async (req, res)=> {
	const partnerCode = config.foreignBank.partnerCode;
	const ret = await foreignBankModel.all();
	res.json(ret);
});


router.post('/info', async(req, res) =>{

	let { stk_thanh_toan } = req.body;
	if(stk_thanh_toan === undefined){
		return res.json({
			status: -4,
			msg: 'do not find stk'
		});
	}

	let row = await userModel.singleForeignByStkTT(stk_thanh_toan);
	if(row.length === 0){
		return res.json({
			status: -5,
			msg: 'stk is invalid'
		});
	}

	console.log('row: ', row[0]);
	res.json({
		status: 1,
		ten: row[0].ten
	});
});


router.post('/add-money',mdwFunc.verifyRechargeForeign, async(req, res)=>{
	// req.body = {
	// 	stk_thanh_toan: 123456789,
	// 	soTien: 10000000
	// }

	let { stk_thanh_toan, soTien } = req.body;
	if(stk_thanh_toan === undefined){
		return res.json({
			status: -5,
			msg: 'do not find stk_thanh_toan'
		});
	}

	let row = await userModel.singleForeignByStkTT(stk_thanh_toan);
	if(row.length === 0){
		return res.json({
			status: -6,
			msg: 'stk is invalid'
		});
	}

	if(soTien === undefined){
		return res.json({
			status: -7,
			msg: 'do not find field soTien'
		});
	}

	if(Number.isNaN(soTien)){
		return res.json({
			status: -8,
			msg: 'field soTien is not a number'
		});
	}

	if(soTien <= config.foreignBank.minimumMoney){
		return res.json({
			status: -9,
			msg: `soTien could not be smaller ${config.foreignBank.minimumMoney}`
		});
	}

	let result = await userModel.addMoney(stk_thanh_toan, soTien);

	let privateKeyStr = rsaKey.privateKey();
	let privateKey = new NodeRSA(privateKeyStr);
	let ts = moment().format('YYYY-MM-DD HH:mm:ss');
	let rsaSign = privateKey.sign(ts, 'base64', 'utf8');

	res.json({
		status: 1,
		timeStamp: ts,
		rsaSign: rsaSign,
		status: 1,
		msg: 'completed add money'
	});
});


module.exports = router;