const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const createError = require('http-errors');
const moment = require('moment');
const bodyparser = require('body-parser');
require('express-async-errors');

//test request
const request = require('request');
const momentTz = require('moment-timezone');
const sha256 = require('sha256');
const jwt = require('jsonwebtoken');
const key = require('./config/RSAKey');
const openpgp = require('openpgp');
const jwtDecode = require('jwt-decode');
const randToken = require('rand-token');



const mdwFunc = require('./middlewares/auth.mdw');

const app = express();
var listSocket = [];

app.use(cors());

//socketio
const server = require('http').Server(app);

var io = require('socket.io')(server);
require('./socketio.js')(io, listSocket);


app.set('listSocket', listSocket);
app.set('io', io);

app.use(morgan('dev'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.json());



//cmt
app.get('/', async (req, res) => {
	//start request 

	refresh_token = randToken.generate(80);
	console.log('token: ', refresh_token);

	res.json(refresh_token);

});

app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/user', require('./routes/user.route'));

app.use('/api/otp', mdwFunc.verifyJWT, require('./routes/otp.route'));
app.use('/api/saving-account', mdwFunc.verifyJWT, require('./routes/saving_account.route'));
app.use('/api/recipient-list', mdwFunc.verifyJWT, require('./routes/recipient_list.route'));
app.use('/api/bank', mdwFunc.verifyJWT, require('./routes/bank.route'));
app.use('/api/debt-reminder', mdwFunc.verifyJWT, require('./routes/debt_reminder_list.route'));
app.use('/api/money-partner-group2', mdwFunc.verifyJWT, require('./routes/money_partner_group2.route'));
app.use('/api/money-partner-group15', mdwFunc.verifyJWT, require('./routes/money_partner_group15.route'));

app.use('/api/history-admin', mdwFunc.verifyJWTAd, require('./routes/history_partner_bank.route'));

app.use('/api/money', require('./routes/money.route'));
app.use('/api/history-money', require('./routes/history_money.route'));
app.use('/api/account', require('./routes/account.route'));

//test smartbanking
app.use('/api/smartbanking', require('./routes/smartbanking/smartbanking.route'));


app.use('/api/foreign-bank', mdwFunc.verifyGetInfoForeign, require('./routes/foreignBank.route'));



/* nếu gọi các đường dẫn không được khai báo sẽ nhảy vào đây */
app.use((req, res, next) => {
	res.status(404).send('NOT FOUND');
})

app.use(function (err, req, res, next) {
	console.log(err.stack);
	const statusCode = err.status || 500;
	res.status(statusCode).send('View error log on console');
});

const PORT = 3000;
server.listen(process.env.PORT || PORT, _ => {
	if (process.env.PORT) {
		console.log(`APP io is running at https://smartbankinghk.herokuapp.com`);
	}
	else console.log(`APP io is running at http://localhost:${PORT}`);
});
// app.listen(process.env.PORT || PORT, _=>{
// 	if(process.env.PORT){
// 		console.log(`API is running at https://smartbankinghk.herokuapp.com`);
// 	}
// 	else console.log(`API is running at http://localhost:${PORT}`);
// })