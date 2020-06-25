const notificationModel = require('./models/notification.model');

const checkNotification = async stkTT=>{
	const notification = await notificationModel.notificationByStkTT(stkTT);
	notification.forEach(e =>{
		console.log('type: ', typeof e.noi_dung);
		e.noi_dung = JSON.parse(e.noi_dung);
	});
	return notification;
}

module.exports = (io, listSocket) =>{
	io.on('connection', socket =>{
		console.log('co nguoi connect');

		//client gui stkTT len
		socket.on('stkTT', async stk =>{
			console.log('data: ', stk);
			const entity = ({
				id: socket.id,
				stk: stk
			});

			// neu elm = undefined => elm la ket noi moi
			const elm = listSocket.find(e => e.id === socket.id);
			if(elm === undefined) {
				//check notification
				const data = await checkNotification(entity.stk);

				if(data.length !== 0){ // khong co thong bao
					socket.emit('notification', data);
					await notificationModel.doneNotificationByStkTT(entity.stk);
				}
				listSocket.push(entity);
			}
		});
		

		//disconnect
		socket.on('disconnect', _=>{
			console.log('id: ', socket.id, ' disconnect');
			listSocket.forEach((e, i)=>{
				if(e.id === socket.id){
					listSocket.splice(i, 1);
				}
			});

			console.log('listSocket: ' ,listSocket);
		});
	});
};