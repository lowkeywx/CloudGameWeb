let localStream;

const ioEvent = {
  mousemove : 11,
  mousedown : 12,
  mouseup : 13,
  keyup : 21,
  keydown : 22
}

module.exports = function(jobId) {
  return new WebsocketClient(jobId);
};

function WebsocketClient(jId){
  this.receiveChannel = {};
  this.pc = {};
  this.pc1 = {};
  this.jobId = jId;
  this.ws = new WebSocket('ws://10.0.19.15:5000');

  this.ws.onopen = function(evt) {  // 绑定连接事件
    // this.start();
    console.log('Connection open ...',evt);
    // ws.send("发送的数据");
    let login = {
      msgType : 'login',
      jobId : jId
    };
    login = JSON.stringify(login);
    this.ws.send(login);
  }.bind(this);
  this.ws.onmessage = function(evt) {// 绑定收到消息事件
    this.HandleMessage(evt.data);
  }.bind(this);
  this.ws.onclose = function(evt) { // 绑定关闭或断开连接事件
    console.log('Connection closed.',evt);
  };
}

WebsocketClient.prototype.gotStream = function (stream) {
  console.log('Received local stream');
  localStream = stream;
}

WebsocketClient.prototype.start = function() {
  console.log('Requesting local stream');
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true
    })
    .then(this.gotStream)
    .catch(e => alert(`getUserMedia() error: ${e.name}`));
}

WebsocketClient.prototype.HandleMessage = function(message) {
  const packeg = JSON.parse(message);
  this.Dispatch(packeg);
}


WebsocketClient.prototype.Dispatch = function(message) {
  console.log('[info][client][action:Dispatch][contain:' + message.msgType + ']');
  switch (message.msgType) {
    case 'logged':
      this.HandleLogged(message);
      break;
    case 'sdp':
      this.HandleSDP(message);
      break;
    case 'candidate':
      this.HandleCondidate(message);
      break;
    default:
      break;
  }
}

WebsocketClient.prototype.SendMessage = function(message){
  this.ws.send(message);
}

window.moz = !!navigator.mozGetUserMedia;
var chromeVersion = !!navigator.mozGetUserMedia ? 0 : parseInt(navigator.userAgent.match( /Chrom(e|ium)\/([0-9]+)\./ )[2]);

WebsocketClient.prototype.onIceCandidate = function(pc, event) {
  // 发送给对方event.candidate
  const msg = {
    msgType:'candidate',
    candidate: event.candidate
  };
  console.log('[info][client][action:condidate][contain:send condidate]');
  this.SendMessage(JSON.stringify(msg));
}

WebsocketClient.prototype.HandleLogged = function(msg) {

  let iceServers = [];
  if (moz) {
    iceServers.push({
      url: 'stun:23.21.150.121'
    });

    iceServers.push({
      url: 'stun:stun.services.mozilla.com'
    });
  }

  if (!moz) {
    iceServers.push({
      url: 'stun:stun.l.google.com:19302'
    });

    iceServers.push({
      url: 'stun:stun.anyfirewall.com:3478'
    });
  }

  if (!moz && chromeVersion < 28) {
    iceServers.push({
      url: 'turn:homeo@turn.bistri.com:80',
      credential: 'homeo'
    });
  }

  if (!moz && chromeVersion >= 28) {
    iceServers.push({
      url: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
    });

    iceServers.push({
      url: 'turn:turn.anyfirewall.com:443?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
    });
  }

  iceServers = {
    iceServers: iceServers
  };

  this.pc = new RTCPeerConnection(iceServers);
  this.pc.addEventListener('icecandidate', function(e){
    this.onIceCandidate(this.pc, e);
  }.bind(this));
  // this.pc.addEventListener('icecandidate', (e) => {this.onIceCandidate(this.pc, e)}.bind(this));
  this.pc.addEventListener('track', this.gotRemoteStream.bind(this));
  this.pc.addEventListener('datachannel', this.receiveChannelCallback.bind(this));
}

WebsocketClient.prototype.HandleSDP = function(message) {
  this.pc.setRemoteDescription(new RTCSessionDescription(message['sdp'])).then(()=>{
    console.log('[info][client][action:sdp][contain:set remote sdp.]');
    this.pc.createAnswer().then((desc)=>{
      console.log('[info][client][action:sdp][contain:create answer.]');
      this.pc.setLocalDescription(desc).then(()=>{
        console.log('[info][client][action:sdp][contain:set local sdp.]');
        // 发送给对方sdp
        const msg = {
          msgType: 'sdp',
          sdp : desc
        };
        this.SendMessage(JSON.stringify(msg))
      });
    })
  });

}

WebsocketClient.prototype.HandleCondidate = function(msg) {
  console.log('[info][client][action:condidate][contain:set remote condidate.]');
  const value = msg['candidate'];
  const candidate = {
    candidate: value['candidate'],
    sdpMid:value['sdpMid'],
    sdpMLineIndex:value['sdpMLineIndex']
  };
  this.pc.addIceCandidate(new RTCIceCandidate(candidate));
}

WebsocketClient.prototype.gotRemoteStream = function(e) {
  const remoteVideo = document.getElementById('remoteVideo');
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    console.log('[info][client][action:stream][contain:set remote stream.]');
  }
}

WebsocketClient.prototype.receiveChannelCallback = function(event) {
  const videoContainer = document.getElementById('videoContainer');

  const remoteVideo = document.getElementById('remoteVideo');
  console.log('Receive Channel Callback');
  this.receiveChannel = event.channel;
  this.receiveChannel.binaryType = 'arraybuffer';
  this.receiveChannel.addEventListener('close', this.onReceiveChannelClosed.bind(this));
  this.receiveChannel.addEventListener('message', this.onReceiveMessageCallback.bind(this));

  const rect = remoteVideo.getBoundingClientRect();
  const fpsTime = (new Date()).getTime();
  // const hoffset = window.screen.height - window.screen.availHeight;
  const hoffset = 50;
  videoContainer.addEventListener('mousemove',function (ev) {
    if (((new Date()).getTime() - fpsTime) < 30)
      return;
    let mouseX = ev.clientX-remoteVideo.offsetLeft;
    let mouseY = ev.clientY-remoteVideo.offsetTop - hoffset;
    mouseX = mouseX/1280*1920;
    mouseY = mouseY/720*1080;
    this.receiveChannel.send(new Uint32Array([ioEvent.mousemove,0,mouseX,mouseY]));
  }.bind(this),false);
  videoContainer.addEventListener('mousedown',function (ev) {
    let mouseX = ev.clientX-remoteVideo.offsetLeft;
    let mouseY = ev.clientY-remoteVideo.offsetTop - hoffset;
    mouseX = mouseX/1280*1920;
    mouseY = mouseY/720*1080;
    console.log(`x坐标=${ev.clientX},y坐标=${ev.clientY}. x边距=${rect.x}, y边距=${rect.y}. videoContainer左边距=${videoContainer.offsetLeft},videoContainer顶边距=${videoContainer.offsetTop}`);
    this.receiveChannel.send(new Uint32Array([ioEvent.mousedown,ev.button,mouseX,mouseY]));
    console.log(`mousedown, x = ${  mouseX  }y = ${  mouseY}`);
    console.log(`window左边距=${window.offsetLeft},window顶边距=${window.offsetTop}.remoteVideo左边距=${remoteVideo.offsetLeft},remoteVideo顶边距=${remoteVideo.offsetTop}`);
  }.bind(this),false);
  videoContainer.addEventListener('mouseup',function (ev) {
    let mouseX = ev.clientX-remoteVideo.offsetLeft;
    let mouseY = ev.clientY-remoteVideo.offsetTop - hoffset;
    mouseX = mouseX/1280*1920;
    mouseY = mouseY/720*1080;
    this.receiveChannel.send(new Uint32Array([ioEvent.mouseup,ev.button,mouseX,mouseY]));
    console.log(`mouseup, x = ${  mouseX  }y = ${  mouseY}`);
  }.bind(this),false);
  window.addEventListener('keydown',function (ev) {
    this.receiveChannel.send(new Uint32Array([ioEvent.keydown,ev.keyCode]));
  }.bind(this),false);
  window.addEventListener('keyup',function (ev) {
    this.receiveChannel.send(new Uint32Array([ioEvent.keyup,ev.keyCode]));
  }.bind(this),false);
}

WebsocketClient.prototype.onReceiveMessageCallback = function(event) {
  const message = event.data;
  console.log(message);
}

WebsocketClient.prototype.onReceiveChannelClosed = function() {
  console.log('Receive channel is closed');
}
