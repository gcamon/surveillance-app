"use strict";
var express = require('express'),      
  db = require('./model'),
  config = require('./config'),    
  route = require('./route'),
  signupRoute = require('./signup'),
  loginRoute = require('./login'),  
  app = express(),
  http = require('http').Server(app),
  io = require('socket.io')(http),
  model = db(),
 
  mySocket = require("./socket"),
  port = process.env.PORT || 3000;

http.listen(port,function(){
    console.log('listening on *:' + port);
});


config.configuration(app,model);
//signupRoute(model);
//loginRoute(model);
route(model); 
route(model); 
mySocket(model,io);
