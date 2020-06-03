const express = require('express');

const recipientModel = require('../models/recipient_list.model');
const userModel = require('../models/user.model');

const router = express.Router();

//lấy danh sách
router.get('/', (req, res)=>{
	res.json({
		status: 1,
		msg: 'recipient list here!'
	});
});

// thêm mới vào danh sách
router.post('/', async (req, res)=>{
	// body = {
	// 	"stk_nguoi_gui": "123456789",
	// 	"stk_nguoi_nhan": "342359506",
	// 	"ten_goi_nho": "do an",
	// 	"id_ngan_hang": 0
	// }
	
	// kiem tra stk_thanh_toan co ton tai hay khong
	const stkTT = req.body.stk_nguoi_gui;
	const stkNN = req.body.stk_nguoi_nhan;
	let verify = await verifyStkTT(stkTT);
	console.log('verify tt: ', verify);
	if(verify === false){
		return res.json({
			status: -1,
			msg: 'stk_nguoi_gui is incorrect'
		});
	}
	verify = await verifyStkTT(stkNN);
	console.log('verify ttnn: ', verify);
	if(verify === false){
		return res.json({
			status: -2,
			msg: 'stk_nguoi_nhan is incorrect'
		});
	}

	//kiem tra stk_nguoi_nhan da ton tai trong danh sach chua
	const entity = ({
		stk_nguoi_gui: stkTT,
		stk_nguoi_nhan: stkNN
	});
	verify = await verifyStkNN(entity);
	console.log('verify nn: ', verify);
	if(verify === false){
		return res.json({
			status: -3,
			msg: 'stk_nguoi_nhan was exist'
		});
	}

	const ret = ({
		...req.body
	});
	console.log('ret: ', ret);
	await recipientModel.add(ret);

	res.json({
		status: 1,
		msg: 'success add itemt'
	});
});

//lấy ds bằng stk_nguoi_gui
router.post('/list', async (req, res)=>{
	// body = {
	// 	"stk_nguoi_gui": "123456789"
	// }
	const stkTT = req.body.stk_nguoi_gui;
	let verify = await verifyStkTT(stkTT);
	if(stkTT === false){
		return res.json({
			status: -1,
			msg: 'stk_nguoi_gui is incorrect'
		});
	}

	const row = await recipientModel.listByStkTT(stkTT);
	return res.json({
		status: 1,
		msg: 'success get list recipient',
		list: row
	});
});

//cap nhat ten cua nguoi nhan
router.put('/name', async (req, res)=>{
	// body = {
	// 	"stk_nguoi_gui": "123456789",
	// 	"stk_nguoi_nhan": "450516872",
	// "ten": "abc"
	// }

	const stkTT = req.body.stk_nguoi_gui;
	const stkNN = req.body.stk_nguoi_nhan;
	const name = req.body.ten;
	let verify = await verifyStkTT(stkTT);
	if(verify === false){
		return res.json({
			status: -1,
			msg: 'stk_nguoi_gui is incorrect'
		});
	}

	verify = await verifyStkTT(stkNN);
	if(verify === false){
		return res.json({
			status: -2,
			msg: 'skt_nguoi_nhan is incorrect'
		});
	}

	await recipientModel.udName(stkTT, stkNN, name);

	res.json({
		status: 1,
		msg: 'completed update name'
	});
});

const verifyStkTT = async stkTT =>{
	const entity = ({
		stk_thanh_toan: stkTT
	});

	const flag = await userModel.verifyEntityInfo(entity);
	if(flag === false){
		return true;
	}
	return false;
}

//kiem tra stk nguoi nhan da duoc them vao danh sach nguoi nhan chua
const verifyStkNN = async entity =>{
	const flag = await recipientModel.verifyExist(entity.stk_nguoi_gui, entity.stk_nguoi_nhan);
	if(flag === false){
		return false;
	}
	return true;
}

module.exports = router;