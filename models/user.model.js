const moment = require('moment');
const momentTz = require('moment-timezone');
const bcrypt = require('bcryptjs');
const db = require('../utils/db');

module.exports = {
	all: _=> db.load('SELECT * FROM user'),
	add: entity =>{
		const hash = bcrypt.hashSync(entity.ma_pin, 8);
		entity.ma_pin = hash;
		console.log('hash: ', hash);
		return db.add(entity, 'user');
	},
	singleByStkTT: stkTT => db.load(`select * from user where stk_thanh_toan = '${stkTT}'`),
	singleForeignByStkTT: stkTT => db.load(`select ten from user where stk_thanh_toan = ${stkTT}`),
	idByStkTT: stkTT => db.load(`select id_tai_khoan from user where stk_thanh_toan = '${stkTT}'`),
	idtkEmailNameByStkTT: async (stkTT)=>{
		return db.load(`select id_tai_khoan, email, ten from user where stk_thanh_toan = '${stkTT}'`);
	},
	moneyByStkTT: async stkTT => {
		const sql = `select so_du_hien_tai from user where stk_thanh_toan = '${stkTT}'`;
		const row = await db.load(sql);
		return Number(row[0].so_du_hien_tai);
	},
	updateRefreshToken: async (userId, token) =>{
		await db.del({Id: userId}, 'user_refresh_token');
		let rdt = moment().format('YYYY-MM-DD HH:mm:ss');
		rdt = momentTz(rdt).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
		const entity = {
			Id: userId,
			refresh_token: token,
			rdt: rdt
		}

		return db.add(entity, 'user_refresh_token');
	},
	verifyRefreshToken: async(userId, token)=>{ // xac thuc refreshToken 
		const sql = `select * from user_refresh_token where Id = ${userId} and refresh_token = '${token}'`;
		const rows = await db.load(sql);
		if(rows.length > 0) 
			return true;
		
		return false;
	},
	verifyEntityInfo: async(entity) =>{ // nếu đã tồn tại thông tin của entity, trả về false, nếu thông tin chưa tồn tại trả về true
		const rows = await db.getRow('id_tai_khoan', 'user', entity);
		if(rows.length > 0){
			return false
		}
		return true;
	},
	refreshTokenById: async (userId) =>{ // tra ve refreshToken theo id
		const sql = `select refresh_token from user_refresh_token where Id = ${userId}`;
		const rows = await db.load(sql);
		return rows[0];
	},
	addMoney: async(stkTT, soTien)=>{
		const sql = `update user set so_du_hien_tai = so_du_hien_tai + ${soTien} where stk_thanh_toan = ${stkTT}`;
		const row = await db.load(sql);
		return row;
	},
	subMoney: async(stkTT, soTien)=>{
		const sql = `update user set so_du_hien_tai = so_du_hien_tai - ${soTien} where stk_thanh_toan = ${stkTT}`;
		const row = await db.load(sql);
		return row;
	},
	changePw: async(ma_pin, stk_thanh_toan) => {
		const sql = `update user set ma_pin = '${ma_pin}' where stk_thanh_toan = '${stk_thanh_toan}'`;
		const row = await db.load(sql);
		return row;
	}
}