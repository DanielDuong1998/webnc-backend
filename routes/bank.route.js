const express = require('express');

const bankModel = require('../models/bank.model');

const router = express.Router();

router.get('/', async(req, res)=>{
	const list = await bankModel.all();
	res.json({
		status: 1,
		msg: 'success get list bank foreign',
		list: list
	})
});

module.exports = router;