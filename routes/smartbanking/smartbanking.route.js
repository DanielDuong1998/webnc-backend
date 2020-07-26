const express = require('express');
const request = require('request');
const momentTz = require('moment-timezone'); 
const sha256 = require('sha256');
const NodeRSA = require('node-rsa');

const router = express.Router();

const x_partner_code = 'b3fn3Tove4Cwhmwiin36sypyhuWsjdmjYygJlHdowK9TclmQV0Fl6MNmfTvaoEi4Y1Mx78AmwOca9Ksr';
const secretSign  = 'secretSign';
const host1 = 'https://smartbankinghk.herokuapp.com';
const host2 = 'http://localhost:3000';
const urlInfo = '/api/foreign-bank/info';
const urlMoney = '/api/foreign-bank/add-money'

const privateKeyStr = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`;

const publicKeyStr = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAp9uFUIw1oPunfsD2J8TN
CNixDVOp2Mo0HKJO+MQd01zbu6d9cjzAOfKToK6pQsU11WSQfmY7uiyv9+V5mAEl
idLJ54e1wROb/ZJnsbPwYxXLNX5XFZm6wpMCuC9KrWB6N5+SbX4kFHnPzso4C4rL
Vsr9mbWeaBJiTawxhmu4tn+a5Y7oU7uS2chW+Td492v3d4/IY28JRCsvJLV64Yaz
fMapwD0M2quHOFyDXo9Jdhdv49Vd+tYNT9zDYMNKSu/90AGxtJb1GfD5Hvpq8WcY
TwAS6w1LxHdvGGD/lHglHj+2w4Fq9opeOTdXznOfFZXDFXiZ1YfhJdqLVsH+Vns+
84Jso6h9wy9/jGVAIMFC06LXO1VetjwVWzFGrCO5xelz5Tbj+dYdvhwS0gbRvrgb
rfzooE8vQ8cFlpgQtnWzXrgjrLXDpgfPugNFAsVvit6ivYrjve6QkJEg3WjdTk0s
HqCjdrADrBoL030R9oX/iYb3xNRW0g6DZI9pwbnKwH+0gBy59J+mmfmUHl8Wqgbm
Kp58cNC6BvwlnSs///x1znHxs+vTG0NyIEvsUUKkzuF4LmfArfgcdCIGIa7Mp7DW
5tIHt6ORgGcsh00B/YyCt/ke0vvdrDtO6UlFaGHzgqAF30OG9qPNFpzd0CgrQXLx
V7OtkQpPFTXgIHfPo3kQbcsCAwEAAQ==
-----END PUBLIC KEY-----`;

const pubKeyVerifySign = `-----BEGIN PUBLIC KEY-----
MIICITANBgkqhkiG9w0BAQEFAAOCAg4AMIICCQKCAgB5NqBS6gT/H+hEfpRZNKee
VO6AxT/hHtcrMmWG9NuVtT/hQltYYidru7o45y9Xw8fb9xNcF/kKRBBNQyp5g7Wa
jt7nn8SyR8T9/ftOO2VihQwMKh8U1Or3BBSvJmrxfHl6qNpTVN8zicnL8ZccbXAg
vqFiF5e2WyemaXmRMvcCokznfOPqePLDqjpbTEotPSu7UJbmrGyjC0wit78e8Zfj
Xtngl+W6U9/eSRUIc1PBddM6zG8s4jv1FXfL2CC7DJ2g0/J6tyLHykzj/ohEp9CM
JnJugz1Nod8/2KF+1rGiWO6UV4WW/BPaZ6vhJ5daLjQZSmm2iMFUyt/zAeHakYTQ
lkJzFu8MQXfaKRdBAH+NboIKmxvByO+siYeHb2vHQTBDcGGWPvkbgQFJdXy3MyxX
fUjJPPQhm7nCIQSiHBuEbMQN0kj6SUvYkmpdVso1hylrV0+ItE5L8WGpnPbjho+j
5mrMU0l/w2YjPjUz8EKer0Uy/wA31BMBZpjH3+QRTCQtkmnKC0nLUku3yYTEFdjy
iYecRQZ9017OjDB08JwyxnGKdemuI2Eh5yvWEblXzifbCe+NfhDlXY3QLAnUbn+n
HfaC6nn6rvDEktP7KWa8H+WYCMTP2oFmlG+FoQFBXCCQGiL9jBj5OrASBSTUy7d8
VnZ6exs6i2lHKVKvJ+IYwQIDAQAB
-----END PUBLIC KEY-----`;

router.get('', (req, res)=>{
	res.json({
		status: 1,
		msg: 'test route smartbanking'
	})
});


//api lấy thông tin qua stk
router.post('/info', (req, res)=>{
	// body = {
	// 	"stk": "1234567891234"
	// }
	const stk_thanh_toan = req.body.stk;
	const body = {
		stk_thanh_toan
	};
	const headers = getHeaders(body);

	const url = host1 + urlInfo;
	const options = ({
		url: url,
		headers,
		method: 'POST',
		body,
		json: true
	});

	const callback = (err, response, body)=>{
		if(err) throw err;
		console.log('body: ', body);
		res.json(body);
	}

	request(options, callback);
});

//api nạp tiền
router.post('/add-money', (req, res)=>{
	// body = {
		// "stk_nguoi_gui" : "0987654321", //stk người gui tien (thuoc ngan hang cua ban)
		// "stk_nguoi_nhan": "1234567891234", //stk nguoi nhan tien (thuoc ngan hang cua minh)
		// "ten_nguoi_gui": "Trương Hoàng Minh",
		// "so_tien": 1000000,
		// "noi_dung": "tra luong thang 13"
	// }
	const { stk_nguoi_gui, noi_dung } = req.body;
	const stk_thanh_toan = req.body.stk_nguoi_nhan;
	const soTien = req.body.so_tien;
	const ten_nguoi_gui = req.body.ten_nguoi_gui;
	const body = ({
		stk_nguoi_gui,
		stk_thanh_toan,
		ten_nguoi_gui,
		soTien,
		noi_dung
	});

	let headers = getHeaders(body);
	const timestamp = headers['x-timestamp'];
	let privateKey = new NodeRSA(privateKeyStr);
	let signRsa = privateKey.sign(timestamp, 'base64', 'utf8');
	headers['x-rsa-sign'] = signRsa;

	const url = host1 + urlMoney;

	const options = ({
		url: url,
		headers,
		method: 'POST',
		body,
		json: true
	});

	const callback = (err, response, body)=>{
		if(err) throw err;
		const rsaSignRes = body.rsaSign;
		const ts = body.timeStamp;
		if(rsaSignRes === undefined || ts === undefined) return res.json(body);

		let publicKey = new NodeRSA(pubKeyVerifySign);
		let verify = publicKey.verify(ts, rsaSignRes, 'utf8', 'base64');
		if(verify === true){
			// xac thuc thanh cong => chuyen tien thanh cong 
			return res.json(body);
		}
		else {
			// xac thuc that bai => response có thể không đáng tin cậy
			body.msg = 'authentication rsaSign failed';
			return res.json(body);
		}

		res.json(body);
	}

	request(options, callback);

});

const getHeaders = body=>{
	const x_timestamp = momentTz().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
	const str = JSON.stringify(body) + x_timestamp + secretSign + x_partner_code;
	const x_sign = sha256(str);
	let headers = ({
		"x-partner-code": x_partner_code,
		"x-timestamp": x_timestamp,
		"x-sign": x_sign
	});

	return headers;
}

module.exports = router;