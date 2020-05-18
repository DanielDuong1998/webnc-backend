const express = require('express');
const user = require('../models/user.model');

const router = express.Router();

router.get('/', async (req, res)=> {
	const ret = await user.all();
	res.json(ret);
});

router.post('/auth', async(req, res)=>{
	res.json({
		msg: 'authentication account'
	})
})

module.exports = router;