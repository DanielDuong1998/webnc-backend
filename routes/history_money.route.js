const express = require('express');
const moment = require('moment');

const history_send_receiveModel = require('../models/history_send_receive.model');
const history_pay_debtModel = require('../models/history_pay_debt.model');

const router = express.Router();

router.get('/', (req, res)=>{
	res.json({
		msg: 'history route'
	});
});

router.post('/send', async (req, res)=>{

	// body = {
	// 	stk_nguoi_gui: "1234567891234"
	// }

	const stk_nguoi_gui = req.body.stk_nguoi_gui;
	const entity = ({
		type: 0,
		stkTT: stk_nguoi_gui
	});
	let rows = await history_send_receiveModel.hisSendReceive(entity);
	rows.forEach(e=>{
		e.thoi_gian_gui = moment(e.thoi_gian_gui).format('YYYY-MM-DD HH:mm:ss');
	});

	res.json({
		status: 1,
		data: rows
	});
});

router.post('/receive', async(req, res)=>{
	// body = {
	// 	stk_nguoi_nhan: "4505168721234"
	// }
	
	const stk_nguoi_nhan = req.body.stk_nguoi_nhan;
	const entity = ({
		type: 1,
		stkTT: stk_nguoi_nhan
	});

	let rows = await history_send_receiveModel.hisSendReceive(entity);
	rows.forEach(e=>{
		e.thoi_gian_gui = moment(e.thoi_gian_gui).format('YYYY-MM-DD HH:mm:ss');
	});

	res.json({
		status: 1,
		data: rows
	});
});

router.post('/pay-debt', async (req, res)=>{
	// body = {
	// 	"stk_nguoi_thanh_toan": "1234567891234"
	// }

	const stkTT = req.body.stk_nguoi_thanh_toan;

	const entity = ({
		type: 0,
		stkTT
	});

	let data = await history_pay_debtModel.hisPayReceive(entity);
	data.forEach(e=>{
		e.thoi_gian = moment(e.thoi_gian).format('YYYY-MM-DD HH:mm:ss');
	});

	res.json({
		status: 1,
		data
	})
});

router.post('/receive-debt', async (req, res)=>{
	// body = {
	// 	"stk_nguoi_nhan": "1234567891234"
	// }

	const stkTT = req.body.stk_nguoi_nhan;

	const entity = ({
		type: 1,
		stkTT
	});

	let data = await history_pay_debtModel.hisPayReceive(entity);
	data.forEach(e=>{
		e.thoi_gian = moment(e.thoi_gian).format('YYYY-MM-DD HH:mm:ss');
	});

	res.json({
		status: 1,
		data
	})
});



module.exports = router;