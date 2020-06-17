const db = require('../utils/db');

module.exports = {
	add: entity=> db.add(entity, 'debt_reminder_list')
}