const db = require('../utils/db');

module.exports = {
	all: _=> db.load(`select * from bank`),
	nameById: id=> db.load(`select ten from bank where id = ${id}`)
}