const db = require('../utils/db');

module.exports = {
	add: entity => db.add(entity, 'recipient_list'),
	udName: (stkTT, stkNN, name) =>{
		const sql = `update recipient_list set ten_goi_nho = '${name}' where stk_nguoi_gui = '${stkTT}' and stk_nguoi_nhan = '${stkNN}'`;
		return db.load(sql);
	},
	del: (stkTT, stkNN) => {
		const sql = `update recipient_list set status = ${0} where stk_nguoi_gui = '${stkTT}' and stk_nguoi_nhan = '${stkNN}'`;
		return db.load(sql);
	},
	listByStkTT: async param =>{
		const sql = `select stk_nguoi_nhan, ten_goi_nho, id_ngan_hang, status from recipient_list where stk_nguoi_gui = '${param.stk_nguoi_gui}' and stk_nguoi_nhan like '%${param.stk_nguoi_nhan}%' and ten_goi_nho like '%${param.ten_goi_nho}%'`;
		const row = await db.load(sql);
		return row;
	},
	verifyExist: async(stkTT, stkNN) =>{ 
		const sql = `select id, status from recipient_list where stk_nguoi_gui = '${stkTT}' and stk_nguoi_nhan = '${stkNN}'`;
		const row = await db.load(sql);
		if(row.length === 0){
			return 0;
		}
		else if(row[0].status === 0){
			return -1;
		}
		else return 1;
	},
	activeRow: (stkTT, stkNN, name)=>{
		const sql = `update recipient_list set ten_goi_nho = '${name}', status = ${1} where stk_nguoi_gui = '${stkTT}' and stk_nguoi_nhan = '${stkNN}'`;
		return db.load(sql);
	}
}