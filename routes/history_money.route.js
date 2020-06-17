const express = require('express');
const moment = require('moment');

const history_send_receiveModel = require('../models/history_send_receive.model');

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


module.exports = router;