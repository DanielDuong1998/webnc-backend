const express = require('express');
const moment = require('moment');
const NodeRSA = require('node-rsa');
const momentTz = require('moment-timezone');

const foreignBankModel = require('../models/foreignBank.model');
const userModel = require('../models/user.model');
const history_partner_bankModel = require('../models/history_partner_bank.model');
const bankModel = require('../models/bank.model');
const notificationModel = require('../models/notification.model');

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
	});
	index++;

	const sign = req.headers['x-rsa-sign'];

	let entity = ({
		stk_doi_tac: stk_nguoi_gui,
		stk_noi_bo: stk_thanh_toan,
		ten_doi_tac,
		so_tien: soTien,
		noi_dung,
		thoi_gian: ts,
		type: 1,
		id_ngan_hang_doi_tac: index,
		sign
	});

	await history_partner_bankModel.add(entity);
	const name = await bankModel.nameById(index);
	
	//socket io
	var io = req.app.get('io');
	var listSocket = req.app.get('listSocket');
	console.log('list socket: ', listSocket);
	let listId = [];

	//lấy hết tất cả id có stk = stk_thanh_toan gôm lại vào list id
	listSocket.forEach(e =>{
		if(e.stk === stk_thanh_toan){
			listId.push(e);
		}
	});

	let debtNotification = ({
		...req.body,
		ten_ngan_hang: name[0].ten
	});

	console.log('length list: ', listId);
	listId.forEach(e =>{
		io.to(`${e.id}`).emit('receiveMoneyOtherBank', debtNotification);
	});

	if(listId.length === 0){
		let entityNoti = ({
			stk_thanh_toan: stk_thanh_toan,
			noi_dung: JSON.stringify(debtNotification),
			thoi_gian: momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss'),
			trang_thai: 0,
			type: 6
		});

		await notificationModel.add(entityNoti);
	}

	res.json({
		status: 1,
		timeStamp: ts,
		rsaSign: rsaSign,
		status: 1,
		msg: 'completed add money'
	});
});


module.exports = router;