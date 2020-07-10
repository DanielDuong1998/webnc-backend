const express = require('express');
const momentTz = require('moment-timezone');

const history_partner_bankModel = require('../models/history_partner_bank.model');

const router = express.Router();

router.get('/all', async (req, res)=>{
	const list = await history_partner_bankModel.all();
	list.forEach(e=>{
		e.thoi_gian = momentTz(e.thoi_gian).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
	})
	res.json({
		list
	});
});

router.post('/list-by-bank', async(req, res)=>{
	//type: 0 ngan hang local chuyen tien cho ngan hang khac, 1 ngan hang khac chuyen cho ngan hang local
	// body = {
		// "id_ngan_hang" : "1",
		// "type" : "1",
	// }

	const id_ngan_hang = req.body.id_ngan_hang;
	const type = req.body.type;
	const entity = ({
		id_ngan_hang,
		type
	});

	const list = await history_partner_bankModel.listByBank(entity);
	let totalMoney = 0;
	list.forEach(e=>{
		totalMoney = totalMoney + Number(e.so_tien);
	});
	console.log('sotien: ', totalMoney);

	res.json({
		status: 1,
		totalMoney,
		list
	})
});

module.exports = router;