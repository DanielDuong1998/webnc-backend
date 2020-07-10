const express = require('express');
const moment = require('moment');
const NodeRSA = require('node-rsa');

const foreignBankModel = require('../models/foreignBank.model');
const userModel = require('../models/user.model');
const history_partner_bankModel = require('../models/history_partner_bank.model');

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
	// "stk_nguoi_gui": "1111000000001",
	//   "ten_nguoi_gui": "LE MINH DUC",
	//  "stk_thanh_toan": "1234567891234",
	//  "soTien": "100000",
	//  "noi_dung": "tra luong thang 5/2020"
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

	const ten_doi_tac = req.body.ten_nguoi_gui || '';
	const stk_nguoi_gui = req.body.stk_nguoi_gui || '';
	const noi_dung = req.body.noi_dung || '';

	// console.log('headers: ', req.headers);
	const partnerCode = req.headers['x-partner-code'];
	console.log('partnerCode: ', partnerCode);
	let index = config.foreignBank.partnerCode.findIndex(e=>{
		return e === partnerCode;
	})
	index++;

	let entity = ({
		stk_doi_tac: stk_nguoi_gui,
		stk_noi_bo: stk_thanh_toan,
		ten_doi_tac,
		so_tien: soTien,
		noi_dung,
		thoi_gian: ts,
		type: 1,
		id_ngan_hang_doi_tac: index 
	});

	await history_partner_bankModel.add(entity);

	res.json({
		status: 1,
		timeStamp: ts,
		rsaSign: rsaSign,
		status: 1,
		msg: 'completed add money'
	});
});


module.exports = router;