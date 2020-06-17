const express = require('express');
const moment = require('moment');
const momentTz = require('moment-timezone');


const debt_reminder_listModel = require('../models/debt_reminder_list.model');
const userModel = require('../models/user.model');

const config = require('../config/default.json');

const router = express.Router();

router.get('/', (req, res)=>{
	res.json({
		msg: 'debt reminder list route'
	});
});

router.post('/', async (req, res)=>{
	// body = {
		// "stk_nguoi_gui": "1234567891234",
		// "stk_nguoi_nhan": "3423595061234",
		// "noi_dung": "muon tien dam cuoi nho khong?",
		// "so_tien": "200000"
	// }

	//xac thuc stk_nguoi_nhan
	const stk_nguoi_nhan = req.body.stk_nguoi_nhan;
	const rows = await verifyStkTT(stk_nguoi_nhan);
	if(rows.length === 0){
		return res.json({
			status: -1,
			msg: 'stk_nguoi_nhan did not find'
		});
	}

	//so tien phai lơn hon 100k
	const so_tien = +req.body.so_tien;
	if(so_tien < config.debt.minDebt){
		return res.json({
			status: -2,
			msg: `so_tien < ${config.debt.minDebt}`
		});
	}

	let tg_tao = moment().format('YYYY-MM-DD HH:mm:ss');
	tg_tao = momentTz(tg_tao).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');


	const entity = ({
		...req.body,
		trang_thai: 0,
		noi_dung_xoa: '',
		tg_tao,
		tg_xoa: ''
	});

	console.log('entity: ', entity);

	await debt_reminder_listModel.add(entity);

	res.json({
		status: 1,
		msg: 'tao nhac no thanh cong'
	});
});

router.post('/delete', async(req, res)=>{
	// body = {
		// "id": "1",
		// "nguoi_xoa": 1,
		// "noi_dung_xoa": "tra hom bua roi ma"
	// }

	//kiem tra id no da duoc xoa chua hay id no co ton tai hay khong?
	const id = req.body.id;
	const status = await debt_reminder_listModel.statusById(id);
	if(status.length === 0){
		return res.json({
			status: -1,
			msg: 'did not find id'
		});
	}

	if(status[0].trang_thai === 1){
		return res.json({
			status: -2,
			msg: 'debt_reminder was deleted!'
		});
	}


	let tg_xoa = moment().format('YYYY-MM-DD HH:mm:ss');
	tg_xoa = momentTz(tg_xoa).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');

	let entity = ({
		noi_dung_xoa: req.body.noi_dung_xoa,
		tg_xoa,
		nguoi_xoa: +req.body.nguoi_xoa,
		trang_thai: 1
	});

	await debt_reminder_listModel.ud(entity, id);

	res.json({
		status: 1,
		msg: 'xoa nhac no thanh cong'
	});
});

const verifyStkTT = async (stkTT)=>{
	const rows = await userModel.idByStkTT(stkTT);
	return rows;
}

module.exports = router;