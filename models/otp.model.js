const db = require('../utils/db');

module.exports = {
	add: entity => db.add(entity, 'otp'),
	ud: async entity =>{
		const sql = `update otp set ma_otp = '${entity.ma_otp}', thoi_gian_otp = '${entity.thoi_gian_otp}' where stk_thanh_toan = '${entity.stk_thanh_toan}'`;
		const row = await db.load(sql);
		return row;
	},
	verifyEntityInfo: async(entity)=>{
		const row = await db.getRow('id_tai_khoan', 'otp', entity);
		if(row.length > 0){
			return false;
		}
		return true;
	}
}