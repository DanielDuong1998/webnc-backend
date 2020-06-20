const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const createError = require('http-errors');
const moment = require('moment');
const bodyparser = require('body-parser');
require('express-async-errors');

const mdwFunc = require('./middlewares/auth.mdw');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.json());

//cmt
app.get('/', (req, res)=>{
	res.json({
		msg: 'This is api of Smart Banking - nodejs'
	});
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
app.listen(process.env.PORT || PORT, _=>{
	if(process.env.PORT){
		console.log(`API is running at https://smartbankinghk.herokuapp.com`);
	}
	else console.log(`API is running at http://localhost:${PORT}`);
})