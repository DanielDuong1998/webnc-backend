const express = require('express');
const request = require('request');
const momentTz = require('moment-timezone'); 
const sha256 = require('sha256');
const NodeRSA = require('node-rsa');

const router = express.Router();

const x_partner_code = '7APW008iv5sSF1EWskRdYlyXCFbGJzG0Zseh0Tpj3Fm1AZ6ZMiRFmleIGhf6i7xTkXNDK9b1XgXdnkgA';
const secretSign  = 'secretSign';
const host1 = 'https://smartbankinghk.herokuapp.com';
const host2 = 'http://localhost:3000';
const urlInfo = '/api/foreign-bank/info';
const urlMoney = '/api/foreign-bank/add-money'

const privateKeyStr = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`;

const publicKeyStr = `-----BEGIN PUBLIC KEY-----
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

	const url = host2 + urlMoney;

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

		let publicKey = new NodeRSA(publicKeyStr);
		let verify = publicKey.verify(ts, rsaSignRes, 'utf8', 'base64');
		if(verify === true){
			// xac thuc thanh cong => chuyen tien thanh cong 
			return res.json(body);
		}
		else {
			// xac thuc that bai => response co the khong tin cay
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