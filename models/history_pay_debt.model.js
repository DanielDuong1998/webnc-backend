const db = require('../utils/db');

module.exports = {
	add: entity=> db.add(entity, 'history_pay_debt'),
	hisPayReceive: entity =>{
		let field = 'stk_nguon';
		if(entity.type === 1){
			field = 'stk_dich';
		}

		console.log('field: ', field);
		const sql = `select * from history_pay_debt where ${field} = ${entity.stkTT}`;
		return db.load(sql);
	}
}