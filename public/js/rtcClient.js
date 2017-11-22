var PeerManager = (function (name) {
    this.name = name;
  var localId,
      config = {
        peerConnectionConfig: {
          iceServers: [
            {"url": "stun:23.21.150.121"},
            {"url": "stun:stun.l.google.com:19302"}
          ]
        },
        peerConnectionConstraints: {
          optional: [
            {"DtlsSrtpKeyAgreement": true}
          ]
        }
      },
      peerDatabase = {},
      localStream,
      remoteVideoContainer = document.getElementById('remoteVideosContainer'),
      socket = io();
      
  socket.on('message', handleMessage);
  socket.on('id', function(id) {
    localId = id;
  });
  

  //if peer does not exist yet, this function will create peer below otherwise peer will be retreived fron 'peerDatabase' where existin
  //peer are kept. The remark where this happened in "jj".
  function addPeer(remoteId,name) {
    var peer = new Peer(config.peerConnectionConfig, config.peerConnectionConstraints, name);
    console.log("checking out peer object")
    peer.pc.onicecandidate = function(event) {
      if (event.candidate) {
        send('candidate', remoteId, {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }
    };
    
    peer.pc.onaddstream = function(event) {
      attachMediaStream(peer.remoteVideoEl, event.stream);
      remoteVideosContainer.appendChild(peer.captionElement)
      remoteVideosContainer.appendChild(peer.remoteVideoEl);
    };
    peer.pc.onremovestream = function(event) {
      peer.remoteVideoEl.src = '';
      remoteVideosContainer.removeChild(peer.remoteVideoEl);
    };
    peer.pc.oniceconnectionstatechange = function(event) {
      switch(
      (  event.srcElement // Chrome
      || event.target   ) // Firefox
      .iceConnectionState) {
        case 'disconnected':
          remoteVideosContainer.removeChild(peer.remoteVideoEl);
          break;
      }
    };
    peerDatabase[remoteId] = peer;
        
    return peer;
  }

  function answer(remoteId) {
    var pc = peerDatabase[remoteId].pc;
    pc.createAnswer(
      function(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        send('answer', remoteId, sessionDescription);
      }, 
      error
    );
  }

  function offer(remoteId) {
    var pc = peerDatabase[remoteId].pc;
    pc.createOffer(
      function(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        send('offer', remoteId, sessionDescription);
      }, 
      error
    );
  }

  function handleMessage(message) {
    var type = message.type,
        from = message.from,
        pc = (peerDatabase[from] || addPeer(from)).pc;

    console.log('received ' + type + ' from ' + from);
  
    switch (type) {
      case 'init':
        toggleLocalStream(pc);
        offer(from);
        break;
      case 'offer':
        pc.setRemoteDescription(new RTCSessionDescription(message.payload), function(){}, error);
        answer(from);
        break;
      case 'answer':
        pc.setRemoteDescription(new RTCSessionDescription(message.payload), function(){}, error);
        break;
      case 'candidate':
        if(pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            sdpMid: message.payload.id,
            candidate: message.payload.candidate
          }), function(){}, error);
        }
        break;
    }
  }

  function send(type, to, payload) {
    console.log('sending ' + type + ' to ' + to);

    socket.emit('message', {
      to: to,
      type: type,
      payload: payload
    });
  }

  function toggleLocalStream(pc) {
    if(localStream) {
      (!!pc.getLocalStreams().length) ? pc.removeStream(localStream) : pc.addStream(localStream);
    }
  }

  function error(err){
    console.log(err);
  }

  return {
    name : name,
    getId: function() {
      return localId;
    },
    
    setLocalStream: function(stream) {

      // if local cam has been stopped, remove it from all outgoing streams.
      if(!stream) {
        for(id in peerDatabase) {
          pc = peerDatabase[id].pc;
          if(!!pc.getLocalStreams().length) {
            pc.removeStream(localStream);
            offer(id);
          }
        }
      }
      
      localStream = stream;
    }, 

    toggleLocalStream: function(remoteId) {
      peer = peerDatabase[remoteId] || addPeer(remoteId); //"jj"
      toggleLocalStream(peer.pc);
    },
    
    peerInit: function(remoteId,name) {
      peer = peerDatabase[remoteId] || addPeer(remoteId,name); //'jj'
      send('init', remoteId, null);
    },

    peerRenegociate: function(remoteId) {
      offer(remoteId);
    },

    send: function(type, payload) {
      socket.emit(type, payload,function(data){
        socket.emit("init reload",{controlId:data.controlId,message:"from site init"});
      });
    },

    controlJoin: function(controlId) {
      socket.emit("control join",{control:controlId},function(data){
        console.log(data.control + " created a room!")
      })
    },
   
    getSocketForController: function() {
      return socket;
    }
  };
  
});

var Peer = function (pcConfig, pcConstraints,name) {
  this.name = name //refers to the remote user name
  this.pc = new RTCPeerConnection(pcConfig, pcConstraints);
  this.remoteVideoEl = document.createElement('video');
  this.remoteVideoEl.style.display = "inline-block";
  this.remoteVideoEl.style.width = "350px";
  this.remoteVideoEl.style.height = "280px";
  this.remoteVideoEl.style.padding = "2px 10px"
  this.remoteVideoEl.controls = true;
  this.remoteVideoEl.autoplay = true;
  this.captionElement = document.createElement('h6');
  this.captionElement.style.position = "relative";
  this.captionElement.style.background  = "rgba(0,0,0,0.4)";
  this.captionElement.style.color = "#fff";
  this.captionElement.style.padding = "10px 10px 5px";
  this.captionElement.style.fontSize = "12px";
  this.captionElement.style.margin = "0px -90px 10px 5px"
  this.captionElement.innerHTML += "Live: " + this.name;

}