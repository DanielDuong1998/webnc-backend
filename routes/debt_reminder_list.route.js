const express = require('express');
const moment = require('moment');
const momentTz = require('moment-timezone');


const debt_reminder_listModel = require('../models/debt_reminder_list.model');
const history_pay_debtModel = require('../models/history_pay_debt.model');
const userModel = require('../models/user.model');
const notificationModel = require('../models/notification.model');

const config = require('../config/default.json');

const router = express.Router();

router.get('/', (req, res)=>{
	res.json({
		msg: 'debt reminder list route'
	});
});

//tao nhac no
router.post('/', async (req, res)=>{
	// body = {
		// "stk_nguoi_gui": "1234567891234",
		// "stk_nguoi_nhan": "3423595061234",
		// "noi_dung": "muon tien dam cuoi nho khong?",
		// "so_tien": "200000"
	// }

	//xac thuc stk_nguoi_nhan
	const stk_nguoi_nhan = req.body.stk_nguoi_nhan;
	const stk_nguoi_gui = req.body.stk_nguoi_gui;
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

	//socketIO
	var io = req.app.get('io');
	var listSocket = req.app.get('listSocket');
	let listId = [];
	listSocket.forEach(e =>{
		if(e.stk === stk_nguoi_nhan){
			listId.push(e);
		}
	});

	let debtNotification = ({
		...req.body
	});
	delete debtNotification.stk_nguoi_nhan;
	listId.forEach(e =>{
		io.to(`${e.id}`).emit('debt', debtNotification);
	});

	if(listId.length === 0){
		let entityNoti = ({
			stk_thanh_toan: stk_nguoi_nhan,
			noi_dung: JSON.stringify(debtNotification),
			thoi_gian: momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss'),
			trang_thai: 0,
			type: 2
		});

		await notificationModel.add(entityNoti);
	}

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
	const rows = await debt_reminder_listModel.singleRowById(id);
	if(rows.length === 0){
		return res.json({
			status: -1,
			msg: 'did not find id'
		});
	}

	if(rows[0].trang_thai === 1){
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

	//socket io
	const {stk_nguoi_gui, stk_nguoi_nhan} = rows[0];
	var io = req.app.get('io');
	var listSocket = req.app.get('listSocket');
	let listId = [];

	let stkTT = stk_nguoi_nhan;
	let type = 3;
	if(req.body.nguoi_xoa == 1){
		stkTT = stk_nguoi_gui;
		type = 4;
	}

	listSocket.forEach(e =>{
		if(e.stk === stkTT){
			listId.push(e);
		}
	});

	let debtNotification = ({
		...req.body
	});
	listId.forEach(e =>{
		io.to(`${e.id}`).emit(`deleteDebt${req.body.nguoi_xoa}`, debtNotification);
	});

	if(listId.length === 0){
		let entityNoti = ({
			stk_thanh_toan: stk_nguoi_nhan,
			noi_dung: JSON.stringify(debtNotification),
			thoi_gian: momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss'),
			trang_thai: 0,
			type: type
		});

		await notificationModel.add(entityNoti);
	}

	res.json({
		status: 1,
		msg: 'xoa nhac no thanh cong'
	});
});

router.post('/pay', async(req, res)=>{
	// body = {
		// "id" : "1",
		// "stk_nguoi_gui": "3423595061234",
		// "noi_dung_xoa": "hoan tat",
		// "ten_nguoi_gui": "Đồ Văn Án"
	// }

	const id = req.body.id;
	const stk_nguoi_gui = req.body.stk_nguoi_gui;
	const ten_nguoi_gui = req.body.ten_nguoi_gui;
	let noi_dung_xoa = req.body.noi_dung_xoa;
	const rows = await debt_reminder_listModel.singleRowById(id);
	
	// kiem tra id neu trang thai = 0 moi thuc hien
	if(rows[0].trang_thai === 1){
		return res.json({
			status: -1,
			msg: 'debt_reminder was deleted'
		});
	}
	if(rows[0].trang_thai === 2){
		return res.json({
			status: -2,
			msg: 'debt reminder was payed!'
		});
	}

	// kiem tra stk nguoi gui co du tien hay khong
	const so_du_hien_tai = await userModel.moneyByStkTT(stk_nguoi_gui);
	if(so_du_hien_tai < Number(rows[0].so_tien)){
		return res.json({
			status: -3,
			msg: `your so_du < ${rows[0].so_tien}`
		});
	}

	await userModel.addMoney(rows[0].stk_nguoi_gui, Number(rows[0].so_tien));
	await userModel.subMoney(stk_nguoi_gui, Number(rows[0].so_tien))

	if(noi_dung_xoa.length === 0){
		noi_dung_xoa = 'da thanh toan';
	}

	let tg_xoa = momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
	let entity = ({
		trang_thai: 2,
		noi_dung_xoa: noi_dung_xoa,
		tg_xoa: tg_xoa,
		nguoi_xoa: 1
	});

	await debt_reminder_listModel.ud(entity, id);

	let ten_nguoi_nhan = await userModel.nameByStkTT(rows[0].stk_nguoi_gui);
	ten_nguoi_nhan = ten_nguoi_nhan[0].ten;

	let entity2 = ({
		thoi_gian: tg_xoa,
		stk_nguon: stk_nguoi_gui,
		stk_dich: rows[0].stk_nguoi_gui,
		ten_nguoi_gui: ten_nguoi_gui,
		ten_nguoi_nhan: ten_nguoi_nhan,
		noi_dung: noi_dung_xoa,
		so_tien: Number(rows[0].so_tien)
	});
	await history_pay_debtModel.add(entity2);

	//ud trang thai

	res.json({
		status: 1,
		msg: 'success pay debt'
	})
});

router.post('/list-send', async(req, res)=>{
	// body = {
	// 	"stk_nguoi_gui": "3423595061234"
	// }

	const stk_nguoi_gui = req.body.stk_nguoi_gui;
	const entity = ({
		type: 0,
		stkTT: stk_nguoi_gui
	})
	const list = await debt_reminder_listModel.listSendReceive(entity);

	res.json({
		status: 1,
		list
	})
});

router.post('/list-receive', async(req, res)=>{
	// body = {
	// 	"stk_nguoi_nhan": "3423595061234"
	// }

	const stk_nguoi_nhan = req.body.stk_nguoi_nhan;
	const entity = ({
		type: 1,
		stkTT: stk_nguoi_nhan
	})
	const list = await debt_reminder_listModel.listSendReceive(entity);

	res.json({
		status: 1,
		list
	})
});

const verifyStkTT = async (stkTT)=>{
	const rows = await userModel.idByStkTT(stkTT);
	return rows;
}

module.exports = router;