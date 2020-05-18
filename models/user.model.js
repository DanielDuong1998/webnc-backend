const moment = require('moment');
const db = require('../utils/db');

module.exports = {
	all: _=> db.load('SELECT * FROM user'),
	singleByStkTT: stkTT => db.load(`select * from user where stk_thanh_toan = '${stkTT}'`),
	updateRefreshToken: async (userId, token) =>{
		await db.del({Id: userId}, 'user_refresh_token');

		const entity = {
			Id: userId,
			refresh_token: token,
			rdt: moment().format('YYYY-MM-DD HH:mm:ss')
		}

		return db.add(entity, 'user_refresh_token');
	},
	verifyRefreshToken: async(userId, token)=>{ // xac thuc refreshToken 
		const sql = `select * from user_refresh_token where Id = ${userId} and refresh_token = '${token}'`;
		const rows = await db.load(sql);
		if(rows.length > 0) 
			return true;
		
		return false;
	},
	refreshTokenById: async(userId) =>{ // tra ve refreshToken theo id
		const sql = `select refresh_token from user_refresh_token where Id = ${userId}`;
		const rows = await db.load(sql);
		return rows[0];
	}
}