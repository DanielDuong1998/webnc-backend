const db = require('../utils/db');

module.exports = {
	add: entity=> db.add(entity, 'history_pay_debt')
}