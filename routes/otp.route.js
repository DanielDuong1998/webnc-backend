const express = require('express');
const moment = require('moment');
const momentTz = require('moment-timezone');
const nodemailer = require('nodemailer');

const otpModel = require('../models/otp.model');
const userModel = require('../models/user.model');


const router = express.Router();

const config = require('../config/default.json');

const transporter = nodemailer.createTransport('smtps://smartbankinghk%40gmail.com:Smartbankinghk123456@smtp.gmail.com');


router.post('/', async(req, res)=>{
	// body = {
	// 	"stk_thanh_toan" : "123456"
	// }

	let stk_thanh_toan = req.body.stk_thanh_toan;
	let entity = ({
		stk_thanh_toan
	});


	let idtkEmail = await userModel.idtkEmailNameByStkTT(stk_thanh_toan);
	if(idtkEmail.length === 0){
		return res.json({
			status: -1,
			msg: 'stk_thanh_toan is incorrect'
		});
	}

	//kiem tra tai khoan da tung co ma otp hay chua
	verify = await otpModel.verifyEntityInfo(entity);
	let thoi_gian_otp = moment().format('YYYY-MM-DD HH:mm:ss');
	thoi_gian_otp = momentTz(thoi_gian_otp).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
	let ma_otp = generateOtp();
	entity.thoi_gian_otp = thoi_gian_otp;
	entity.ma_otp = ma_otp;

	let email = idtkEmail[0].email;
	let ten = idtkEmail[0].ten;
	console.log('ten: ', ten);
	sendOtpEmail(email, ma_otp, ten);
	if(verify === false){ //da tung co ma otp trong tai khoan nay
		console.log('otp da tung co');
		await otpModel.ud(entity);
		return res.json({
			status: 1,
			msg: 'Send otp success'
		});
	}

	console.log('otp chua tung co');
	let id_tai_khoan = idtkEmail[0].id_tai_khoan;
	entity.id_tai_khoan = id_tai_khoan;
	await otpModel.add(entity);

	res.json({
		status: 1,
		msg: 'Send otp success'
	});
});

router.post('/verify', async(req, res)=>{
	// body = {
	// 	"stk_thanh_toan": "123456789",
	// 	"ma_otp": "452125"
	// }
	const stk_thanh_toan = req.body.stk_thanh_toan;
	const ma_otp = req.body.ma_otp;
	let entity = ({
		stk_thanh_toan
	});


	let idtkEmail = await userModel.idtkEmailNameByStkTT(stk_thanh_toan);
	if(idtkEmail.length === 0){
		return res.json({
			status: -1,
			msg: 'stk_thanh_toan is incorrect'
		});
	}

	const row = await otpModel.otpByStkTT(stk_thanh_toan);
	if(row.length === 0){
		return res.json({
			status: -2,
			msg: 'stk_thanh_toan do not otp code'
		});
	}

	//xac thuc thoi gian otp
	const timeStart = moment(row[0].thoi_gian_otp);
	const timeOtp = moment();
	const timeDelay = moment(timeOtp).diff(moment(timeStart));
	const duration = config.otp.duration;
	if(timeDelay > duration){
		return res.json({
			status: -3,
			msg: 'The time was expired!'
		});
	}	

	const otpSrc = row[0].ma_otp;
	const otpRecive = String(ma_otp);
	if(otpSrc !== otpRecive){
		return res.json({
			status: -4,
			msg: 'Otp code not match'
		});
	}

	res.json({
		status: 1,
		msg: 'Success verify otp'
	});

	
});

const sendOtpEmail = (email, ma_otp, ten)=>{
	const mailOption = {
		from: 'Ngân Hàng Smartbank',
		to: email,
		subject: `${ma_otp} là mã khôi phục tài khoản SmartBanking của bạn`,
		text: `You receive massage from smartbankhk.com. Your otp : ${ma_otp}`,
		html: `<b>Xin chào ${ten},</b><br>
		<b>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu SmartBanking của bạn.</b><br>
		<b>Mã chỉ có tác dụng trong vòng 5 phút. Nếu mã hết hạn, vui lòng tạo yêu cầu cấp mã mới </b><br>
		<b>Nhập mã đặt lại mật khẩu sau đây:</b>
		<b><h3>${ma_otp}</h3></b>
		<b>Tuyệt đối không cung cấp mã này cho bất kì ai</b><br>
		<b>Nếu bạn không yêu cầu mật khẩu mới, hãy bỏ qua email này</b>`
	};
	transporter.sendMail(mailOption, function(error, info){
		if(error) return console.log(error);
		console.log('Message send: ', info.response);
	});
}

const generateOtp = _=>{
	let otp = stk = Math.floor(Math.random()*(999999-100000) + 100000).toString(10);
	return otp;
}


module.exports = router;