const express = require('express');
const moment = require('moment'); // test time
const momentTz = require('moment-timezone');
const bcrypt = require('bcryptjs');

const userModel = require('../models/user.model');
const authModel = require('../models/auth.model');

const router = express.Router();

router.get('/', async (req, res)=> {
	const ret = await userModel.all();
	res.json(ret);
});


//tạo tài khoản
router.post('/', async(req, res)=>{
    let verify = await verifyInfoSignUp(req);
    console.log('verify: ', verify);
    if(verify.status < 1){
    	return res.json(verify);
    }

    let stk_thanh_toan = await generateStkTT();
    req.body.stk_thanh_toan = stk_thanh_toan;

    let ngay_tao = moment().format('YYYY-MM-DD');
	ngay_tao = momentTz(ngay_tao).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
	req.body.ngay_tao = ngay_tao;

    let result = await userModel.add(req.body);



    let ret = ({
    	status: 1,
    	id_tai_khoan: result.insertId,
    	...req.body
    });

    delete ret.ma_pin;

    res.json(ret);
    
});


//đổi mât khẩu
router.put('/password', async(req, res)=>{
	// body = ({
	// 	stk_thanh_toan: "123456789",
	// 	ma_pin: "123456",
	// 	ma_pin_moi: "654321"
	// })
	let stk_thanh_toan = req.body.stk_thanh_toan;
	let ma_pin = req.body.ma_pin;
	let ma_pin_moi = req.body.ma_pin_moi;

	let entity = ({
		stk_thanh_toan,
		ma_pin
	});
	let row = await authModel.login(entity);
	if(row === null){
		return res.json({
			status: -1,
			msg: 'the password is incorrect'
		});
	}
	const hash = bcrypt.hashSync(ma_pin_moi, 8);
	ma_pin_moi = hash;
	let r = await userModel.changePw(ma_pin_moi, stk_thanh_toan);

	res.json({
		status: 1,
		msg: 'The password change success!'
	});
});

router.put('/forget-password', async (req, res)=>{
	// body = ({
	// 	"stk_thanh_toan": "123456789",
	// 	"ma_pin_moi": "654321"
	// })

	let stk_thanh_toan = req.body.stk_thanh_toan;
	let ma_pin = req.body.ma_pin_moi;
	let entity = ({
		stk_thanh_toan
	});

	const verify = await userModel.verifyEntityInfo(entity);
	if(verify === true){
		return res.json({
			status: -1,
			msg: 'stk_thanh_toan is incorrect!'
		});
	}

	console.log('stk: ', stk_thanh_toan, ' ma_pin_moi: ', ma_pin);
	const hash = bcrypt.hashSync(ma_pin, 8);
	ma_pin = hash;
	await userModel.changePw(ma_pin, stk_thanh_toan);

	res.json({
		status: 1,
		msg: 'The password change success!'
	})
});


const generateStkTT = async _=> {
	let stk = '';
	let flag  = false;
	let entity = '';
	while(flag === false){
		stk = Math.floor(Math.random()*(999999999-100000000) + 100000000).toString(10);
		entity = ({
			stk_thanh_toan: stk
		});
		flag = await userModel.verifyEntityInfo(entity); 
	}
	return stk;
}

const verifyInfoSignUp = async (req) =>{
	let cmnd = req.body.cmnd;
	let so_dien_thoai = req.body.so_dien_thoai;
	let email = req.body.email;
	let ret = ({
		status: -1,
		msg: ''
	});

	if(cmnd === undefined){
		ret.msg = 'do not find cmnd';
		return ret;
	}

	if(so_dien_thoai === undefined){
		ret.msg = 'do not find so_dien_thoai';
		return ret;
	}

	if(email === undefined){
		ret.msg = 'do not find email';
		return ret;
	}

	let entity = ({
		cmnd
	});
	let verify = await userModel.verifyEntityInfo(entity);
	if(verify === false){
		ret.status = -2;
		ret.msg = 'cmnd has already existed';
		return ret;
	}

	entity = ({
		so_dien_thoai
	});
	verify = await userModel.verifyEntityInfo(entity);
	if(verify === false){
		ret.status = -3;
		ret.msg = 'so_dien_thoai has already existed';
		return ret;
	}

	entity = ({
		email
	});
	verify = await userModel.verifyEntityInfo(entity);
	if(verify === false){
		ret.status = -4;
		ret.msg = 'email has already existed';
		return ret;
	}

	ret.status = 1;
	ret.msg = 'success verify infomation sign up.';
	return ret;
}

module.exports = router;