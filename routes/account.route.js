const express = require('express');
const momentTz = require('moment-timezone');

const accountModel = require('../models/account.model');

const config = require('../config/default.json');

const router = express.Router();

router.get('/admin', async (req, res)=>{
	const list = await accountModel.allAdmin();

	res.json({
		list
	});
});

router.post('/admin', async (req, res)=>{
	// body = {
		// "ten": "Dương Khang",
		// "ngay_sinh": "1998-01-23",
		// "dia_chi": "Ninh Thuận",
		// "cmnd": "264478911"
	// }

	let entity = req.body;

	const tai_khoan = await generateAccount(2);
	console.log('tai_khoan: ', tai_khoan);

	entity.tai_khoan = tai_khoan;
	entity.mat_khau = '123456';
	let ngay_tao = momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
	entity.ngay_tao = ngay_tao;
	entity.role = 1;

	await accountModel.add(entity);

	res.json({
		status: 1,
		msg: 'create admin account success'
	});
});


const generateAccount = async type=> { //1 la employee, 2 la admin
	const startNum = config.user.startStkGen[type];
	const endNum = config.user.endStkGen[type];

	let stk = '';
	let flag  = false;
	let entity = '';
	while(flag === false){
		stk = Math.floor(Math.random()*(endNum-startNum) + startNum).toString(10);
		entity = ({
			tai_khoan: stk,
			role: type - 1
		});
		flag = await accountModel.verifyAccount(entity); 
	}
	return stk;
}
module.exports = router;