const bcrypt = require('bcryptjs');
const userModel = require('./user.model');
const accountModel = require('./account.model');
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
	},
	loginAccount: async entity =>{
		// body = {
		// 	"tai_khoan": "11401664142",
		// 	"mat_khau": "123456",
		//  "role": 1
		// }

		const row = await accountModel.singleRowAccount(entity);
		if(row.length === 0){
			return  null;
		}

		console.log('row: ', row);

		const mat_khau_hash = row[0].mat_khau;
		if(bcrypt.compareSync(entity.mat_khau, mat_khau_hash)){
			return row[0];
		}
		return null;
	}
}