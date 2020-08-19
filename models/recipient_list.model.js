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
		console.log("param", param);
		const sql = `select recipient_list.stk_nguoi_nhan, recipient_list.ten_goi_nho, recipient_list.id_ngan_hang, recipient_list.status, bank.ten from recipient_list, bank where stk_nguoi_gui = '${param.stk_nguoi_gui}' and recipient_list.id_ngan_hang = bank.id and ten_goi_nho like '%${param.ten_goi_nho}%' and stk_nguoi_nhan like '%${param.stk_nguoi_nhan}%'`;
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
	},
	checkInList: async(stkng, stknn)=>{
		const sql = `select id from recipient_list where stk_nguoi_gui = '${stkng}' and stk_nguoi_nhan = '${stknn}'`;
		const rows = await db.load(sql);
		return rows.length > 0;
	}
}