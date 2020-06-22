const db = require('../utils/db');

module.exports = {
	add: entity=> db.add(entity, 'history_add_money_by_employee')
}