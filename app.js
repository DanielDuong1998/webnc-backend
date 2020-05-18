const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const createError = require('http-errors');
require('express-async-errors');

const NodeRSA = require('node-rsa'); // test rsa
const moment = require('moment'); // test time
const bcrypt = require('bcrypt'); //test  bcrypt

const mdwFunc = require('./middlewares/auth.mdw');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

//test time
function mdw(req, res, next){ 
	let currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
	let nextTime = moment(currentTime).add(60, 'minutes').format('YYYY-MM-DD HH:mm:ss');

	let rsTime = moment(nextTime).diff(moment(currentTime), 'seconds');

	console.log('currentTime: ', currentTime);
	console.log('nextTime: ', nextTime);
	console.log('rsTime: ', typeof rsTime);
	next();
}

//test bcrypt
function verify(req, res, next){
	let str = `'${req.headers['x-partner-code']}' + '${req.body}' + 1`;
	if(bcrypt.compareSync(str, req.headers['x-sign'])){
		console.log('ok');
	}
	else {
		console.log('failed!');
	}
	next();
}

app.get('/', (req, res)=>{
	res.json({
		msg: 'This is api Internet Banking - nodejs'
	});
});

app.use('/api/user', mdwFunc.verifyJWT, require('./routes/user.route'));
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
app.listen(PORT, _=>{
	console.log(`API is running at http://localhost:${PORT}`);
})