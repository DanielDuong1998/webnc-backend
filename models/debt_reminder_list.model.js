const db = require('../utils/db');

module.exports = {
	add: entity=> db.add(entity, 'debt_reminder_list'),
	statusById: async id=>{
		const sql = `select trang_thai from debt_reminder_list where id = ${id}`;
		const rows = await db.load(sql);
		return rows;
	},
	ud: (entity, id)=> db.ud('debt_reminder_list', entity, id),
	singleRowById: id=> db.load(`select * from debt_reminder_list where id = ${id}`),
	hisPayReceive: entity => {
		let field = '';
		if(entity.type === 0){
			field = 'stk_nguon';
		}
		else field = 'stk_dich';

		const sql = `select * from history_pay_debt where ${field} = '${entity.stkTT}`;
		return db.load(sql);
	},
	listSendReceive: entity=>{
		let field = 'stk_nguoi_gui';
		if(entity.type === 1){
			field = 'stk_nguoi_nhan';
		}

		const sql = `select debt_reminder_list.*, user.ten from debt_reminder_list, user where trang_thai <> 1 and ${field} = '${entity.stkTT}' and debt_reminder_list.${field} = user.stk_thanh_toan`;
		return db.load(sql);
	}
}