const express = require('express');

const userModel = require('../models/user.model');
const config = require('../config/default.json');

const router = express.Router();

router.post('/', async(req, res)=>{
	res.json({
		status: 1,
		msg: 'money router!'
	});
});


//người dùng gửi tiền cho người dùng khác
router.post('/send-money-user', async(req, res)=>{
	// body = {
		// "stk_nguoi_gui": "123456789",
		// "stk_nguoi_nhan": "450516872",
		// "so_tien_gui": "300000",
		// "noi_dung": "tra luong thang 6",
		// "phi" : "0"
	// }
	const stk_nguoi_gui = req.body.stk_nguoi_gui;
	const stk_nguoi_nhan = req.body.stk_nguoi_nhan;
	const so_tien_gui = req.body.so_tien_gui;
	const noi_dung = req.body.noi_dung;
	const phi = req.body.phi;
	let phi_money = 0;
	let thuc_nhan = +so_tien_gui;
	//xac thuc thong tin nguoi nhan	
	const verify = await verifyInfoStk(stk_nguoi_nhan);
	if(verify === false){
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



	res.json({
		status: 1,
		msg: 'recharge success'
	});
});

//nhân viên nạp tiền cho người dùng,
router.post('/send-money-employee', async(req, res)=>{
	// body = {
	// 	"stk_nguoi_nhan": "123456789",
	// 	"so_tien_gui": "30000"
	// }

	const stk_nguoi_nhan = req.body.stk_nguoi_nhan;
	const so_tien_gui = +req.body.so_tien_gui;

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
module.exports = router;