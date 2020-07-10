const db = require('../utils/db');

const tableName = 'history_partner_bank';

module.exports = {
	all: _=> db.load(`select * from ${tableName}`),
	add: entity=> db.add(entity, tableName),
	listByBank: (entity)=>{
		const sql = `select * from ${tableName} where id_ngan_hang_doi_tac = ${entity.id_ngan_hang} and type = ${entity.type}`;
		return db.load(sql);
	}
}