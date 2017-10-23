'use strict';
var path = require('path');
var route = require('./config');
var router = route.router;
var fs = require("fs");
var EventEmmiter = require("events");
var emitter = new EventEmmiter();

//var token = require("./twilio");
//var randomUserName = require("./randos");

var basicRoute = function (model) {

  router.get("/",function(req,res){
  	console.log("yessssssssssssssssss")
    res.render('index');
  });

  router.get("/user/centeral-control",function(req,res){
  	res.render("centeral");
  });

  router.get("/site/:id",function(rea,res){
  	res.render("site");
  })
}

module.exports = basicRoute;
