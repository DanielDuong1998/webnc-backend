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
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.json());

//cmt
app.get('/', async (req, res)=>{
	//start request 


	const jwtDecode = require('jwt-decode');
	let tk = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTU5NDA1MzQ1MCwiZXhwIjoxNTk0MDU0MDUwfQ.hKQmXMyFX8KiXLWH-3FLuvWRZSN12godLxuQiRf6Nf4';
	let payload = jwtDecode(tk);
	console.log('pl: ', payload); //{ userId: 1, iat: 1594053450, exp: 1594054050 }
	

	res.json('a');
	
});

app.use('/api/user', require('./routes/user.route'));
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/otp', require('./routes/otp.route'));
app.use('/api/saving-account', require('./routes/saving_account.route'));
app.use('/api/recipient-list', require('./routes/recipient_list.route'));
app.use('/api/money', require('./routes/money.route'));
app.use('/api/bank', require('./routes/bank.route'));
app.use('/api/history-money', require('./routes/history_money.route'));
app.use('/api/debt-reminder', require('./routes/debt_reminder_list.route'));
app.use('/api/account', require('./routes/account.route'));
app.use('/api/money-partner-group2', require('./routes/money_partner_group2.route'));
app.use('/api/history-admin', require('./routes/history_partner_bank.route'));

//test smartbanking
app.use('/api/smartbanking', require('./routes/smartbanking/smartbanking.route'));


app.use('/api/foreign-bank', mdwFunc.verifyGetInfoForeign, require('./routes/foreignBank.route'));



/* nếu gọi các đường dẫn không được khai báo sẽ nhảy vào đây */
app.use((req, res, next)=>{
	res.status(404).send('NOT FOUND');	
})

app.use(function(err, req, res, next){
	console.log(err.stack);
	const statusCode = err.status || 500;
	res.status(statusCode).send('View error log on console');
});

const PORT = 3000;
server.listen(process.env.PORT || PORT, _=>{
	if(process.env.PORT){
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