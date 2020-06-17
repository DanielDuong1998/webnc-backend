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
}