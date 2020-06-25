module.exports = (io, listSocket) =>{
	io.on('connection', socket =>{
		console.log('co nguoi connect');
		
		socket.on('stkTT', stk =>{
			console.log('data: ', stk);
			const entity = ({
				id: socket.id,
				stk: stk
			});
			const elm = listSocket.find(e => e.id === socket.id);
			if(elm === undefined)
				listSocket.push(entity);
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