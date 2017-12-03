(function(){
	var app = angular.module('rtcSurveillance', ["ngRoute"],
		function($locationProvider){$locationProvider.html5Mode(true);}
    );
	var client = new PeerManager(name);
	client.allsources = [];
	var mediaConfig = {
        audio:true,
        video: {
			mandatory: {},
			optional: []
        }
    };

	var videoElement = document.querySelector('video');
	var audioSelect = document.querySelector('select#audioSource');
	var videoSelect = document.querySelector('select#videoSource');

	  
		
    
		//var audioSelect = document.getElementById("audioselect");
		
  

	  


    /*navigator.mediaDevices.getUserMedia(mediaConfig)
    .then(function(stream){
    	console.log(stream.getTracks())
    })
    .catch(function(err) {
    		console.log(err)
    })*/

    app.factory("localManager",["$window",function($window){
		  return {
		    setValue: function(key, value) {
		      $window.localStorage.setItem(key, JSON.stringify(value));
		    },
		    getValue: function(key) {       
		      return JSON.parse($window.localStorage.getItem(key)); 
		    },
		    removeItem: function(key) {
		      $window.localStorage.removeItem(key);
		    }
		  };
		}]);

    app.factory('camera', ['$rootScope', '$window', function($rootScope, $window){
    	var camera = {};
    	camera.preview = $window.document.getElementById('localVideo');
    	//Get the camera stream and attach to be passed onto a web element
    	camera.start = function(constraints){
				return requestUserMedia(constraints)
				.then(function(stream){					
					console.log(stream.getTracks());			
					attachMediaStream(camera.preview, stream);
					client.setLocalStream(stream);
					camera.stream = stream;
					$rootScope.$broadcast('cameraIsOn',true);
				})
				.catch(Error('Failed to get access to local media.'));
		  };
    	camera.stop = function(){
    		return new Promise(function(resolve, reject){			
				try {
					//camera.stream.stop() no longer works
					
					var track =  camera.stream.getTracks();
          for( var i = 0; i < track.length; i++ ){
	          track[i].stop();
	        }
					camera.preview.src = '';
					resolve();
				} catch(error) {
					reject(error);
				}
    		})
    		.then(function(result){
    			$rootScope.$broadcast('cameraIsOn',false);
    		});	
		};
		return camera;
    }]);

	   app.config(function($routeProvider){
			  $routeProvider

			  .when("/",{
			  	templateUrl: "/assets/pages/site.html"
			  })

			  .when("/cam/:id",{
			  	templateUrl: "/assets/pages/site.html",
			  })

			  .when("/cam/:id/local-streams",{
			  	templateUrl: "/assets/pages/local-remote.html",
			  	//controller: "siteRemoteStreamsController"
			  })
		 });

    app.controller("siteRemoteStreamsController",["$scope","camera","$location","$http","$window",function($scope,camera,$location,$http,$window){
    	var rtc = this;
		rtc.remoteStreams = [];
		var path = $location.path();
		var toArr = path.split("/");
		console.log(toArr)
		var controlId = toArr[toArr.length - 2]; //user to get control id which is second to the last in the array
		

		function getStreamById(id) {
		    for(var i=0; i<rtc.remoteStreams.length;i++) {
		    	if (rtc.remoteStreams[i].id === id) {return rtc.remoteStreams[i];}
		    }
		}

		rtc.loadData = function () {
			// get list of streams from the server;		
			var url = "/site/streams.json/" + controlId;
			$http.get(url).success(function(data){
			
				// filter own stream
			var streams = data.filter(function(stream) {
		      return stream.id != client.getId();
		    });
		    // get former state
		    for(var i=0; i<streams.length;i++) {
		    	var stream = getStreamById(streams[i].id);
		    	streams[i].isPlaying = (!!stream) ? stream.isPLaying : false;
		    	console.log(streams)
		    	/*if(!stream) {
		    		streams.splice(i,1);
		    	}*/
		    }
		    // save new streams
		    console.log(streams);
		    rtc.remoteStreams = streams;
			});
		};

		rtc.view = function(stream){
			client.peerInit(stream.id,stream.name);
			stream.isPlaying = !stream.isPlaying;
		};

		rtc.call = function(stream){
			/* If json isn't loaded yet, construct a new stream 
			 * This happens when you load <serverUrl>/<socketId> : 
			 * it calls socketId immediatly.
			**/
			if(!stream.id){
				stream = {id: stream, isPlaying: false};
				rtc.remoteStreams.push(stream);
			}
			if(camera.isOn){
				client.toggleLocalStream(stream.id);
				if(stream.isPlaying){
					client.peerRenegociate(stream.id);
				} else {
					client.peerInit(stream.id);
				}
				stream.isPlaying = !stream.isPlaying;
			} else {
				camera.start()
				.then(function(result) {
					client.toggleLocalStream(stream.id);
					if(stream.isPlaying){
						client.peerRenegociate(stream.id);
					} else {
						client.peerInit(stream.id);
					}
					stream.isPlaying = !stream.isPlaying;
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};

		//initial load
		rtc.loadData();
    	if($location.url() != '/'){
      		rtc.call($location.url().slice(1));
    	};

    

    var controllerSocket = client.getSocketForController();

    controllerSocket.on("reload streams",function(data){
    	alert("reloading")
    	rtc.loadData();
    })
  }]);

	app.controller('RemoteStreamsController', ["$scope",'camera', '$location', '$http','$window', function($scope,camera, $location, $http, $window){
		var rtc = this;
		rtc.remoteStreams = [];
		console.log("got devices connected to laptop");
		console.log(client.allsources);
		rtc.allDevices = client.allsources;
		function getStreamById(id) {
		    for(var i=0; i<rtc.remoteStreams.length;i++) {
		    	if (rtc.remoteStreams[i].id === id) {return rtc.remoteStreams[i];}
		    }
		}
		var control = {}

		rtc.siteLink = function(controlId){
			console.log(controlId)
			control.controlId = controlId;
				//join a room
    	client.controlJoin(controlId);
			return $window.location.host + "/cam/" + controlId;
		}

		rtc.loadData = function () {
			// get list of streams from the server
		

			$http.get('/streams.json').success(function(data){
				// filter own stream
				var streams = data.filter(function(stream) {
			      	return stream.id != client.getId();
			    });
			    // get former state
			    for(var i=0; i<streams.length;i++) {
			    	var stream = getStreamById(streams[i].id);
			    	streams[i].isPlaying = (!!stream) ? stream.isPLaying : false;
			    }
			    // save new streams
			    console.log(streams)
			    rtc.remoteStreams = streams;
			});
		};

		rtc.view = function(stream){
			client.peerInit(stream.id,stream.name);
			stream.isPlaying = !stream.isPlaying;
		};
		rtc.call = function(stream){
			/* If json isn't loaded yet, construct a new stream 
			 * This happens when you load <serverUrl>/<socketId> : 
			 * it calls socketId immediatly.
			**/
			if(!stream.id){
				stream = {id: stream, isPlaying: false};
				rtc.remoteStreams.push(stream);
			}
			if(camera.isOn){
				client.toggleLocalStream(stream.id);
				if(stream.isPlaying){
					client.peerRenegociate(stream.id);
				} else {
					client.peerInit(stream.id);
				}
				stream.isPlaying = !stream.isPlaying;
			} else {
				camera.start()
				.then(function(result) {
					client.toggleLocalStream(stream.id);
					if(stream.isPlaying){
						client.peerRenegociate(stream.id);
					} else {
						client.peerInit(stream.id);
					}
					stream.isPlaying = !stream.isPlaying;
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};

		//initial load
		rtc.loadData();
    	if($location.url() != '/'){
      		rtc.call($location.url().slice(1));
    	};


    /*client.reloadFn(function () {
    	rtc.loadData(); //automaticall call the refresh
    });*/
		var controllerSocket = client.getSocketForController();

    controllerSocket.on("reload streams",function(data){
    	alert("reloading")
    	rtc.loadData();
    })
	}]);

	app.controller('LocalStreamController',['camera', '$scope', 'localManager','$window','$location', function(camera, $scope, localManager,$window, $location){
		var localStream = this;
		localStream.name = localManager.getValue("username") || 'Guest';
		localStream.link = '';
		localStream.cameraIsOn = false;

		var saveControlId = {};
		var path = $location.path();
		var newPath = path + "/local-streams";
		$scope.allLocalStreams = function() {
			$location.path(newPath);
		}

		$scope.$on('cameraIsOn', function(event,data) {
  		$scope.$apply(function() {
	    	localStream.cameraIsOn = data;
	    });
		});
		////////////////////
		navigator.mediaDevices.enumerateDevices()
  	.then(gotDevices).then(getStream).catch(handleError);

  	function gotDevices(deviceInfos) {
  		console.log("ibiakwaaaaaa");
  		console.log(deviceInfos);
		 for (var i = 0; i < deviceInfos.length; ++i) {
				var deviceInfo = deviceInfos[i];
				var option = {};
				option.value = deviceInfo.deviceId;
				/*if (deviceInfo.kind === 'audioinput') {
				option.text = deviceInfo.label ||
				'microphone ' + i;
				
				} else */if (deviceInfo.kind === 'videoinput') {
				option.text = deviceInfo.label || 'camera ' + i;
				client.allsources.push(option)
				getStream({value:option.value});
				
				} else {
				console.log('Found one other kind of source/device: ', deviceInfo);
				}
				
		 }
  	}
		$scope.$watch("localStream.device",function(newVal,oldVal){
			alert(newVal)
			if(newVal)
			 getStream({value:newVal});
		})

		localStream.getControlId = function(id){
			console.log(id)
			saveControlId.id = id;		
		}



			console.log("got devices connected to laptop");
			console.log(client.allsources);
			localStream.allDevices = client.allsources;

		localStream.toggleCam = function(constraints){
			if(localStream.cameraIsOn){
				localManager.removeItem("username");
				camera.stop()
				.then(function(result){
					client.send('leave');
	    			client.setLocalStream(null);
				})
				.catch(function(err) {
					console.log(err);
				});
			} else {
				camera.start(constraints)
				.then(function(result) {
					localStream.link = $window.location.host + '/' + client.getId();
					if(localManager.getValue("username") !== "Guest" || localManager.getValue("username") !== ""){
						localManager.setValue("username",localStream.name);
					}				
					client.send('readyToStream', { name: localStream.name,controlId: saveControlId.id });
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};




	  function getStream(cam) {
  		if (window.stream) {
				window.stream.getTracks().forEach(function(track) {
				track.stop();
				});
			}
			if(cam) {
				console.log("deviuce in use is ...");
				console.log(cam);
			var constraints = {
				audio: true,
				video: {
					deviceId: {exact: cam.value}
				}
			};
			//localStream.toggleCam(constraints);
  		navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
			}
  	}

  	function gotStream(stream) {
			console.log("all available streams");
			console.log(stream)
			window.stream = stream; // make stream available to console
			//var videoElement.srcObject = stream;
			var container = document.getElementById("localV");
			var videoElem = document.createElement('video')
			videoElem.srcObject = stream;
			container.appendChild(videoElem);
		}

		function handleError(error) {
			console.log('Error: ', error);
		}

	}]);
})();

