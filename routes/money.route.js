const express = require('express');
const moment = require('moment');
const momentTz = require('moment-timezone');

const userModel = require('../models/user.model');
const history_send_receiveModel = require('../models/history_send_receive.model');
const history_add_money_by_employeeModel = require('../models/history_add_money_by_employee.model');
const notificationModel = require('../models/notification.model');

const config = require('../config/default.json');

const router = express.Router();

router.post('/', async(req, res)=>{
	res.json({
		status: 1,
		msg: 'money router!'
	});
});


//người dùng gửi tiền cho người dùng khác, token cua nguoi dung
router.post('/send-money-user', async(req, res)=>{
	// body = {
		// "stk_nguoi_gui": "123456789",
		// "stk_nguoi_nhan": "450516872",
		// "ten_gui_gui": ""
		// "so_tien_gui": "300000",
		// "noi_dung": "tra luong thang 6",
		// "phi" : "0"
	// }
	const stk_nguoi_gui = req.body.stk_nguoi_gui;
	const stk_nguoi_nhan = req.body.stk_nguoi_nhan;
	const ten_nguoi_gui = req.body.ten_nguoi_gui;
	const so_tien_gui = req.body.so_tien_gui;
	const noi_dung = req.body.noi_dung;
	const phi = req.body.phi;
	let phi_money = 0;
	let thuc_nhan = +so_tien_gui;
	//xac thuc thong tin nguoi nhan	

	const ten_nguoi_nhan = await nameByStk(stk_nguoi_nhan);
	if(ten_nguoi_nhan.length === 0){
		return res.json({
			status: -1,
			msg: 'stk_nguoi_nhan is incorrect'
		});
	}

	if(String(phi) === '0'){ // nguoi gui tra phi
		phi_money = config.fee;
	}
	else {
		thuc_nhan -= config.fee;
	}

	const khau_tru = phi_money + Number(so_tien_gui);

	const mnByStkTT = await userModel.moneyByStkTT(stk_nguoi_gui);
	console.log('phi mn: ', typeof khau_tru, ' ', khau_tru);
	console.log('mnByStkTT: ', typeof mnByStkTT, ' ', mnByStkTT);
	//kiem tra nguoi gui du tien tra khong
	if(mnByStkTT < khau_tru){
		return res.json({
			status: -2,
			msg: 'stk_nguoi_gui do not have enough money'
		});
	}

	await recharge(stk_nguoi_nhan, thuc_nhan);
	console.log('chuyen tien thanh cong');
	await deduction(stk_nguoi_gui, khau_tru);
	console.log('khau tru thanh cong')
	let time_send = moment().format('YYYY-MM-DD HH:mm:ss');
	time_send = momentTz(time_send).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');

	const entity = ({
		id_ngan_hang_gui: 0,
		id_ngan_hang_nhan: 0,
		phi: phi_money,
		stk_nguon: stk_nguoi_gui,
		stk_dich: stk_nguoi_nhan,
		ten_nguoi_gui: ten_nguoi_gui,
		ten_nguoi_nhan: ten_nguoi_nhan[0].ten,
		noi_dung: noi_dung,
		so_tien_gui: so_tien_gui,
		so_tien_nhan: thuc_nhan,
		thoi_gian_gui: time_send
	});

	await history_send_receiveModel.add(entity);

	//socket io
	var io = req.app.get('io');
	var listSocket = req.app.get('listSocket');
	console.log('list socket: ', listSocket);
	let listId = [];

	listSocket.forEach(e =>{
		if(e.stk === stk_nguoi_nhan){
			listId.push(e);
		}
	});

	let debtNotification = ({
		...req.body
	});
	console.log('length list: ', listId);
	listId.forEach(e =>{
		io.to(`${e.id}`).emit('receiveMoney', debtNotification);
	});

	if(listId.length === 0){
		let entityNoti = ({
			stk_thanh_toan: stk_nguoi_nhan,
			noi_dung: JSON.stringify(debtNotification),
			thoi_gian: momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss'),
			trang_thai: 0,
			type: 0
		});

		await notificationModel.add(entityNoti);
	}

	res.json({
		status: 1,
		msg: 'recharge success'
	});
});

//nhân viên nạp tiền cho người dùng,
router.post('/send-money-employee', async(req, res)=>{ // token cua nhan vien
	// body = {
		// "stk_nguoi_nhan": "1234567891234",
		// "so_tien_gui": "30000",
		// "tai_khoan": "121578703691"
	// }

	const stk_nguoi_nhan = req.body.stk_nguoi_nhan;
	const so_tien_gui = +req.body.so_tien_gui;
	const tai_khoan_nhan_vien = req.body.tai_khoan;

	const verify = await verifyInfoStk(stk_nguoi_nhan);
	console.log('verify: ', verify);
	if(verify === false){
		return res.json({
			status: -1,
			msg: 'stk_nguoi_nhan is not incorrect'
		});
	}
	
	console.log('so tien nguoi gui: ', typeof so_tien_gui, so_tien_gui);
	await recharge(stk_nguoi_nhan, so_tien_gui);

	const time = momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
	const entity = ({
		tai_khoan_nhan_vien,
		stk_nguon: stk_nguoi_nhan,
		so_tien: so_tien_gui,
		thoi_gian: time
	});
	await history_add_money_by_employeeModel.add(entity);

	//socket io
	var io = req.app.get('io');
	var listSocket = req.app.get('listSocket');
	console.log('list socket: ', listSocket);
	let listId = [];

	listSocket.forEach(e =>{
		if(e.stk === stk_nguoi_nhan){
			listId.push(e);
		}
	});

	let debtNotification = ({
		...req.body
	});
	console.log('length list: ', listId);
	listId.forEach(e =>{
		io.to(`${e.id}`).emit('receiveMoneyEmployee', debtNotification);
	});

	if(listId.length === 0){
		let entityNoti = ({
			stk_thanh_toan: stk_nguoi_nhan,
			noi_dung: JSON.stringify(debtNotification),
			thoi_gian: momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss'),
			trang_thai: 0,
			type: 1
		});

		await notificationModel.add(entityNoti);
	}


	res.json({
		status: 1, 
		msg: 'recharge success'
	});
});

const recharge = async (stkTT, so_tien)=>{
	return userModel.addMoney(stkTT, so_tien);
}

const deduction = async (stkTT, so_tien)=>{
	return userModel.subMoney(stkTT, so_tien);
}

const verifyInfoStk = async(stkTT)=>{
	const entity = ({
		stk_thanh_toan: stkTT
	});
	let row = await userModel.verifyEntityInfo(entity);
	return !row;
}

const nameByStk = async(stkTT)=>{
	let name = await userModel.nameByStkTT(stkTT);
	return name;
}


module.exports = router;