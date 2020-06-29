const express = require('express');
const request = require('request');
const momentTz = require('moment-timezone');
const sha256 = require('sha256');
const jwt = require('jsonwebtoken');
const openpgp = require('openpgp');

const key = require('../config/RSAKey');
const config = require('../config/default.json');

const router = express.Router();

router.get('', (req, res)=>{
	res.json({
		msg: 'route money partner group 2'
	});
});

router.post('/info', async(req, res)=>{
	// body = {
	// 	"stk_thanh_toan": "1111000000001" 
	// }

	const { secretString, desBankCode, urlInfo } = config.foreignBank.group2;
	const desAccountNumber = req.body.stk_thanh_toan;

	const payload = {
		desAccountNumber,
		desBankCode,
		iat: getIssuedAtNow()
	}

	const x_hashed_data = await jwt.sign
		
	res.json({
		msg: 'post method route money partner group 2' 
	});
});



const getIssuedAtNow = _=>{
	return momentTz.tz('Asia/Bangkok').unix();
}


//lấy thông tin

module.exports = router;