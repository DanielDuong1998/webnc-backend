const express = require('express');

const saving_accountModel = require('../models/saving_account.model');
const userModel = require('../models/user.model');

const router = express.Router();

router.post('/list', async(req, res)=>{
	// body = {
	// 	"stk_thanh_toan": "123456789"
	// }

	const stk_thanh_toan = req.body.stk_thanh_toan;

	const id_tai_khoan = await userModel.idByStkTT(stk_thanh_toan);
	if(id_tai_khoan.length === 0){
		return res.json({
			status: -1,
			msg: 'stk_thanh_toan is inccorect!'
		});
	}

	const list = await saving_accountModel.listByIdtk(id_tai_khoan[0].id_tai_khoan);

	res.json({
		status: 1,
		msg: 'get list saving account success!',
		list: list
	});
})

module.exports = router;