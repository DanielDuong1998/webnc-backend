const db = require('../utils/db');

module.exports = {
	listByIdtk: async idtk=>{
		const sql = `select * from saving_account where id_tai_khoan = '${idtk}'`;
		const rows = await db.load(sql);
		return rows;
	}
}