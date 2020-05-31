const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const createError = require('http-errors');
const moment = require('moment');
const nodemailer = require('nodemailer');
const bodyparser = require('body-parser');
require('express-async-errors');

const mdwFunc = require('./middlewares/auth.mdw');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(bodyparser.json());
app.user(bodyparser.urlencoded({extended: true}));
app.use(express.json());

const transporter = nodemailer.createTransport('smtps://smartbankinghk%40gmail.com:Smartbankinghk123456@smtp.gmail.com');

const mailOption = {
	from: 'Ngân Hàng Smartbank',
	to: 'dvkhangnt@gmail.com',
	subject: 'Test Nodemailer',
	text: 'You receive massage from smartbankhk.com. Your otp : 356425',
	html: '<b> Hello, this is auto mail. Your otp: 356425 </b>'
};


const nodemailerTest = _=>{
	transporter.sendMail(mailOption, function(error, info){
		if(error) return console.log(error);
		console.log('Message send: ', info.response);
	});
}

app.get('/', (req, res)=>{

	nodemailerTest();
	res.json({
		msg: 'This is api of Smart Banking - nodejs'
	});
});

app.use('/api/user', require('./routes/user.route'));
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/otp', require('./routes/otp.route'));

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