'use strict';
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'gcamon',
  password : 'gcamon',
  database : 'webrtcsurveillaneDB',
  multipleStatements: true
});



connection.connect(function(err){
	if(!err) {
	    console.log("Database is connected ... nn");    
	} else {
		console.log(err)
	    console.log("Error connecting database ... nn"); 
	}
});


module.exports = connection;












