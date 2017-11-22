"use strict";

module.exports = function(io, streams) {    
 io.on('connection', function(client) {
 	 //client refers to the user socket which just connected. in this case it cound be cammera from the sites or the control center itself
    console.log('-- ' + client.id + ' joined --');
    client.emit('id', client.id);

    client.on('message', function (details) {
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
        delete details.to;
        details.from = client.id;
        otherClient.emit('message', details);
    });
      
    /*client.on('readyToStream', function(options) {
      console.log('-- ' + client.id + ' is ready to stream --');      
      streams.addStream(client.id, options.name); 
    });*/

    // gets te control to join a room
    client.on("control join",function(control,cb){
    	console.log("checking----------")
    	console.log(control)
    	client.join(control.control);//control.joins a roo
    	cb(control);
    })

    client.on('readyToStream', function(options,cb) {
      console.log('-- ' + client.id + ' is ready to stream --');
      //search database to see which control this client belong to.
      streams.addStream(client.id, options.name, options.controlId);
      client.join(options.controlId); //create a room for common sites using one control.
      //io.sockets.to(options.controlId).emit("new stream added",{message:"new stream",controlId:options.controlId});
      cb({controlId:options.controlId})
    });

    client.on("init reload",function(data){
    	console.log("reloadiiiiiiiiiiiiiiiiii")
    	console.log(data)
    	console.log(data.message)
    	io.sockets.to(data.controlId).emit("reload streams",{status:true})
    })
    
    client.on('update', function(options) {
      streams.update(client.id, options.name);
    });

    function leave() {
      console.log('-- ' + client.id + ' left --');
      streams.removeStream(client.id);
    }

    client.on('disconnect', leave);
    client.on('leave', leave);
  });
}

  /*socket.on('join', function (data) {
    	user.isPresent = true; //use to check presence of user without hitting the database.
    	console.log(data)
      socket.join(data.userId);      
      console.log("room created");
    });

    socket.on("init chat",function(data,cb){

  			var chatId = data.userId + "/" + data.partnerId; //creates chat id for the user and a partner to be saved in the database.

	      model.chats.findOne({chat_id:chatId},function(err,chat){
	      	if(err) throw err;
	      	if(!chat){
	      		var date= + new Date();    		
	      		var newChat = new model.chats({
	      			date_created: date,
	      			chat_id: chatId,
	      			type:"chat",
	      		});
	      		newChat.save(function(err,info){
	      		});
	      	} else {
	      		cb(chat.messages);
	      	}
	      });
  		})

	    socket.on("send message",function(data,cb){
	      cb(data);
	      //if(Object.keys(socket.rooms).indexOf(data.to) !== -1)
	       model.user.findOne({user_id: data.to},{set_presence:1},function(err,Obj){
	       	if(err) throw err;

	       	var checkBlocked = Obj.set_presence.particular.indexOf(data.from);	       	
	       	if(checkBlocked === -1){	       		
	       		if(Obj.set_presence.general === true) {		       			          			
	       			io.sockets.to(data.to).emit('new_msg',data);
	       		}
	       	}
	       	
	       });
	    })
 	});*/