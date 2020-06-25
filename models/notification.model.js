const db = require('../utils/db');

module.exports = {
	add: entity => db.add(entity, 'notification'),
	notificationByStkTT: stkTT =>{
		const sql = `select * from notification where stk_thanh_toan = '${stkTT}' and trang_thai = 0`;
		return db.load(sql);
	},
	doneNotificationByStkTT: stkTT =>{
		const sql = `update notification set trang_thai = 1 where stk_thanh_toan = '${stkTT}'`;
		return db.load(sql);
	}
}