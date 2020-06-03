const db = require('../utils/db');

module.exports = {
	add: entity => db.add(entity, 'recipient_list'),
	udName: (stkTT, stkNN, name) =>{
		const sql = `update recipient_list set ten_goi_nho = '${name}' where stk_nguoi_gui = '${stkTT}' and stk_nguoi_nhan = '${stkNN}'`;
		return db.load(sql);
	},
	listByStkTT: async stkTT =>{
		const sql = `select stk_nguoi_nhan, ten_goi_nho, id_ngan_hang from recipient_list where stk_nguoi_gui = '${stkTT}'`;
		const row = await db.load(sql);
		return row;
	},
	verifyExist: async(stkTT, stkNN) =>{ // nếu đã tồn tại thông tin true, nếu thông tin chưa tồn tại trả về false
		const sql = `select id from recipient_list where stk_nguoi_gui = '${stkTT}' and stk_nguoi_nhan = '${stkNN}'`;
		const row = await db.load(sql);
		if(row.length === 0){
			return true;
		}
		return false;
	}
}