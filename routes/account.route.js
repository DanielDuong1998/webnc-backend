const express = require('express');
const momentTz = require('moment-timezone');

const accountModel = require('../models/account.model');

const config = require('../config/default.json');

const mdwFunc = require('../middlewares/auth.mdw');

const router = express.Router();

router.get('/admin', async (req, res)=>{
	const list = await accountModel.allAdmin();

	res.json({
		list
	});
});

//chức năng để code easy
router.post('/admin', async (req, res)=>{
	// body = {
	// 	"ten": "Dương Khang",
	// 	"ngay_sinh": "1998-01-23",
	// 	"dia_chi": "Ninh Thuận",
	// 	"cmnd": "264478911"
	// }

	let entity = req.body;

	const tai_khoan = await generateAccount(2);
	console.log('tai_khoan: ', tai_khoan);

	entity.tai_khoan = tai_khoan;
	entity.mat_khau = '123456';
	const ngay_tao = momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
	entity.ngay_tao = ngay_tao;
	entity.role = 1;
	entity.trang_thai = 1;

	await accountModel.add(entity);

	res.json({
		status: 1,
		msg: 'create admin account success',
		tai_khoan,
		mat_khau: '123456'
	});
});

router.post('/employee', async (req, res)=>{
	// body = {
		// "ten": "Dương Khang",
		// "ngay_sinh": "1998-01-23",
		// "dia_chi": "Ninh Thuận",
		// "cmnd": "264478911"
	// }

	let entity = req.body;

	const tai_khoan = await generateAccount(1);
	console.log('tai_khoan: ', tai_khoan);

	entity.tai_khoan = tai_khoan;
	entity.mat_khau = '123456';
	const ngay_tao = momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
	entity.ngay_tao = ngay_tao;
	entity.role = 0;
	entity.trang_thai = 1;
	entity.cap_bac = 1;
	entity.he_so_luong = 6.0;

	await accountModel.add(entity);

	res.json({
		status: 1,
		msg: 'create employee account success',
		tai_khoan,
		mat_khau: '123456'
	});
});


router.get('/employee', mdwFunc.verifyJWTAd, async (req, res)=>{
	// headers = {
	// 	x-access-token: 'asdfge21a32d1ga23e1asdf'
	// }

	const list = await accountModel.allEmployee();
	list.forEach(e=>{
		delete e.refresh_token;
		delete e.mat_khau;
		delete e.trang_thai;
		delete e.rdt;
		delete e.role;
	});
	res.json({
		status: 1,
		list
	});
});

//xóa account employee
router.put('/delete-employee', mdwFunc.verifyJWTAd, async(req, res)=>{
	// body = {
	// 	tai_khoan: 1
	// }

	const tai_khoan = req.body.tai_khoan;
	// kiem tra id co ton tai hay khong
	const row = await accountModel.singleEmployeeByTk(tai_khoan);
	if(row.length === 0){
		return res.json({
			status: -1,
			msg: 'tai_khoan was not exist or not an employee'
		});
	}

	const id = row[0].id;
	await accountModel.deleteEmployee(id);
	res.json({
		status: 1,
		msg: `delete account ${tai_khoan} success`
	});

});

router.put('/info', async(req, res)=>{
	// body = {
		// "tai_khoan": "579476719233",
		// "dia_chi": "Lạng Sơn",
		// "ten": "Dương Khang 1"
	// }

	let entity = {};
	const tai_khoan = req.body.tai_khoan;
	const dia_chi = req.body.dia_chi;
	const ten = req.body.ten;
	if(dia_chi !== undefined && dia_chi.length !== 0){
		entity.dia_chi = dia_chi;
	}

	if(ten !== undefined && ten.length !== 0){
		entity.ten = ten;
	}

	if(entity.ten === undefined & entity.dia_chi === undefined){
		return res.json({
			status: -1,
			msg: 'ten and dia_chi not valid'
		});
	}

	await accountModel.udNameAdressByEntity(entity, tai_khoan);

	res.json({
		status: 1,
		msg: 'update info success'
	});
});

//update rank for employee
router.put('/rank', mdwFunc.verifyJWTAd, async(req, res)=>{
	// body = {
	// 	"tai_khoan": "520872967493",
	// 	"so_bac": "2" //
	// }
	const tai_khoan = req.body.tai_khoan;
	const so_bac = +req.body.so_bac;

	if(tai_khoan.length !== 12){ // reject luon khi tai_khoan khong du 12, khoi query db
		return res.json({
			status: -1,
			msg: 'tai_khoan is not exist!'
		});
	}
	if(so_bac < -10 || so_bac > 10){
		return res.json({
			status: -2,
			msg: 'so_bac is not valid'
		});
	}

	const entity = ({
		tai_khoan,
		role: 0
	});
	const rows = await accountModel.singleRowAccount(entity);
	if(rows.length === 0){
		return res.json({
			status: -1,
			msg: 'tai_khoan is not exist!'
		});
	}

	let rankAfter = so_bac + rows[0].cap_bac;
	console.log('rankAfter: ', rankAfter);
	if(rankAfter < 1) rankAfter = 1;
	else if (rankAfter > 17) rankAfter = 17;

	const he_so_luong = rankAfter + 6;

	const entity2 = ({
		tai_khoan,
		rankAfter,
		he_so_luong
	});	
	await accountModel.updateRank(entity2);

	res.json({
		status: 1,
		msg: `completed up rank for ${tai_khoan}`
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