const db = require('../utils/db.js');

module.exports = {
	all: _=> db.load(`select * from history_send_receive`),
	add: entity=>{
		return db.add(entity, 'history_send_receive');
	},
	hisSendReceive: async entity=>{
		let field = 'stk_dich';
		if(entity.type === 0){
			field = 'stk_nguon';
		}
		const sql = `select * from history_send_receive where ${field} = '${entity.stkTT}'`;
		const rows = await db.load(sql);
		return rows;
	}
}