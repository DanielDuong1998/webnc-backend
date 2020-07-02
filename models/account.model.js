const bcrypt = require('bcryptjs');
const momentTz = require('moment-timezone');
const db = require('../utils/db');

module.exports = {
	allAdmin: _=> db.load('select * from account where role = 1 and trang_thai = 1'),
	allEmployee: _=> db.load('select * from account where role = 0 and trang_thai = 1'),
	add: entity => {
		const hash = bcrypt.hashSync(entity.mat_khau, 8);
		entity.mat_khau = hash;
		console.log('hash account pw: ', entity.mat_khau);
		return db.add(entity, 'account')
	},
	singleEmployeeById: id=> db.load(`select * from account where id = '${id}' and role = 0 and trang_thai = 1`),
	singleRowAccount: entity =>{
		const sql = `select * from account where tai_khoan = '${entity.tai_khoan}' and role = ${entity.role} and trang_thai = 1`;
		return db.load(sql);
	},
	verifyAccount: async entity=>{
		const sql = `select id from account where role = ${entity.role} and tai_khoan = '${entity.tai_khoan}' and trang_thai = 1`;
		const rows = await db.load(sql);
		if(rows.length === 0){
			return true
		}
		else return false;
	},
	refreshTokenById: async (id) =>{ // tra ve refreshToken theo id
		const sql = `select refresh_token from account where Id = ${id} and trang_thai = 1`;
		const rows = await db.load(sql);
		return rows[0];
	},
	updateRefreshToken: (id, token) =>{
		const rdt = momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
		const sql = `update account set refresh_token = '${token}', rdt = '${rdt}' where id = ${id} and trang_thai = 1`;
		return db.load(sql);
	},
	deleteEmployee: id=>{
		const sql = `update account set trang_thai = 0 where id = ${id} and role = 0 and trang_thai = 1`;
		return db.load(sql);
	},
	updateRank: entity=>{
		const sql = `update account set cap_bac = ${entity.rankAfter}, he_so_luong = ${entity.he_so_luong} where tai_khoan = ${entity.tai_khoan}`;
		return db.load(sql);
	}
}