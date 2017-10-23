"use strict";
var uuid = require('node-uuid');

module.exports = function(model,io) {    
  io.sockets.on('connection', function(socket){
  	var currentRoom, id;

  	socket.on('init', function (data, fn) {
      currentRoom = (data || {}).room || uuid.v4();
      var room = rooms[currentRoom];
      if (!data) {
        rooms[currentRoom] = [socket];
        id = userIds[currentRoom] = 0;
        fn(currentRoom, id);
        console.log('Room created, with #', currentRoom);
      } else {
        if (!room) {
          return;
        }
        userIds[currentRoom] += 1;
        id = userIds[currentRoom];
        fn(currentRoom, id);
        room.forEach(function (s) {
          s.emit('peer.connected', { id: id });
        });
        room[id] = socket;
        console.log('Peer connected to room', currentRoom, 'with #', id);
      }
    });

  })  	   
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