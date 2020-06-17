const mysql = require('mysql');
const {promisify} = require('util');
const config = require('../config/default.json');

const pool = mysql.createPool(config.mysql);

const pool_query = promisify(pool.query).bind(pool);

pool.getConnection(function(err, connection){
	if (err) {
  		console.log('failure connect database!');
  		throw err;
  	} // not connected!
  	else console.log('connected database!');
})

module.exports = {
	load: sql => pool_query(sql),
	add: (entity, tableName) => pool_query(`insert into ${tableName} set ? `, entity),
	del: (condition, tableName) => pool_query(`delete from ${tableName} where ?`, condition),
	getRow: (field, tableName, entity) => pool_query(`select ${field} from ${tableName} where ?`, entity),
	ud: (tableName, entity, id) => pool_query(`update ${tableName} set ? where id = ${id}`, entity)
}