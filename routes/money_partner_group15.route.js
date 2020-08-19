const express = require('express');
const request = require('request');
const NodeRSA = require('node-rsa');
const momentTz = require('moment-timezone');

const userModel = require('../models/user.model.js');
const history_partner_bankModel = require('../models/history_partner_bank.model');
const bankModel = require('../models/bank.model');
const recipient_listModel = require('../models/recipient_list.model');

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
		try{
			console.log('body: ', body);
			body = (
				body.data 
				? 
				{
					 data: {
						ten: body.data.name
					}
				}
				: 
				{
					message : body.message
				} 
			);
			res.json(body);
		}
		catch(e){
			res.json({
				status: -1,
				msg: '404 resource not found'
			})
		}
		
	}

	request(options, callback);

});

// nap tiền
router.post('/add-money', async(req, res)=>{
	// body = {
		// "stk_nguoi_gui": "1234567891234",
		// "stk_nguoi_nhan": "1234567891011",
	 // "ten_nguoi_nhan": "Ân Hòa",
		// "noi_dung": "chuyen tien xay nha",
		// "so_tien": "5000000",
		// "type": 2 //nguoi nhan chiu phi
	// }

	//check tien co du de chuyen hay khong
	const entity = ({
		stk_nguoi_gui: req.body.stk_nguoi_gui,
		so_tien: +req.body.so_tien
	});

	let verify = await checkMoneyByStkTT(entity);
	if(verify === -1){
		return res.json({
			status: -1,
			msg: 'stkTT khong ton tai'
		});
	}
	else if(verify === -2){
		return res.json({
			status: -2,
			msg: 'so du hien tai nho hon so tien'
		});
	}

	// console.log('verify: ', verify);
	// return res.json({
	// 	msg: 'test'
	// });


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

	const {stk_nguoi_gui, stk_nguoi_nhan, ten_nguoi_nhan, so_tien, noi_dung} = req.body;

	const callback = async (err, response, body)=>{
		if(err) throw err;
		try{
			console.log('body: ', body);
			console.log('sig: ', response.body.signNature);
			let verifySign = pubKey.verify(JSON.stringify(response.body.payload + response.body.timeStamp), response.body.signNature, 'utf8', 'base64');
			console.log('verifySign: ', verifySign);
			
			if(verifySign === true){
				await subMoney(entity);
				let ret = ({
					stk_nguoi_gui,
					stk_nguoi_nhan,
					ten_nguoi_nhan,
					so_tien,
					noi_dung,
					sign: body.signNature
				});
				await saveHistory(ret);
	
				body.status = 1;
			}
			const id_ngan_hang = 2;
			const ten = await bankModel.nameById(id_ngan_hang);
			const isExist = await recipient_listModel.checkInList(stk_nguoi_gui, stk_nguoi_nhan);
			const data = ({
				stk_nguoi_gui,
				stk_nguoi_nhan,
				ten_goi_nho: ten_nguoi_nhan,
				id_ngan_hang,
				ten: ten[0].ten,
				isExist
			})

			body.data = data;

			res.json(body);
		}
		catch(e){
			res.json({
				status: -1,
				msg: '404 resource not found'
			})
		}
		
	}

	request(options, callback);
	
});

const checkMoneyByStkTT = async entity=>{
	let {stk_nguoi_gui, so_tien} = entity;
	let rows = await userModel.singleByStkTT(stk_nguoi_gui);
	if(rows.length === 0){ //stkTT khong ton tai
		return -1;
	}
	const real_money = +rows[0].so_du_hien_tai;
	if(so_tien <= real_money){ // so du hien tai lon hon ho so tien chuyen
		return 1;
	}
	return -2;
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
		id_ngan_hang_doi_tac: 1,
		sign
	});
	await history_partner_bankModel.add(ret);
}


//lấy thông tin

module.exports = router;