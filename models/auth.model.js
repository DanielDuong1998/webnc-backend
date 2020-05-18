const bcrypt = require('bcryptjs');
const userModel = require('./user.model');

const db = require('../utils/db');

module.exports = {
	login: async entity => {
		// req.body = {
		// 	"stk_thanh_toan": "123456789",
		// 	"ma_pin": "123456"
		// }

		const row = await userModel.singleByStkTT(entity.stk_thanh_toan);

		//không tìm thấy stk_thanh_toan => null
		if(row.length === 0){
			return null;
		}

		//có stk_thanh_toan và ma_pin đúng => row 
		const maPinHash = row[0].ma_pin;
		if(bcrypt.compareSync(entity.ma_pin, maPinHash)){
			return row[0];
		}

		//ma_pin sai => null
		return null;
	}
}