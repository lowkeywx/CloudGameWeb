const { Form } = require("@alifd/next");

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

  // 信令服务器地址
  this.ws = new WebSocket('ws://114.116.131.15:5000'); 
  // this.ws = new WebSocket('ws://10.0.100.11:5000');
  // this.ws = new WebSocket('ws://10.0.19.15:5000');

  this.ws.onopen = function(evt) {  // 绑定连接事件
    // this.start();
    console.log('Connection open ...',evt);
    // ws.send("发送的数据");
    let login = {
      msgType : 'login',
      jobId : jId,
      clientType : 'WEB'
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
  console.log(`[info][client][action:Dispatch][contain:${  message.msgType  }]`);
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

  const iceConfig = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      {
        urls: 'turn:1.119.155.126:3478',
        credential: '123456',
        username: 'turnserver',
        credentialType: 'password'
      }
    ]
  };

  this.pc = new RTCPeerConnection(iceConfig);
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

function textToArrayBuffer(s) {
  const i = s.length;
  let n = 0;
  const ba = [];
  for (let j = 0; j < i;) {
    const c = s.codePointAt(j);
    if (c < 128) {
      ba[n++] = c;
      j++;
    }
    else if ((c > 127) && (c < 2048)) {
      ba[n++] = (c >> 6) | 192;
      ba[n++] = (c & 63) | 128;
      j++;
    }
    else if ((c > 2047) && (c < 65536)) {
      ba[n++] = (c >> 12) | 224;
      ba[n++] = ((c >> 6) & 63) | 128;
      ba[n++] = (c & 63) | 128;
      j++;
    }
    else {
      ba[n++] = (c >> 18) | 240;
      ba[n++] = ((c >> 12) & 63) | 128;
      ba[n++] = ((c >> 6) & 63) | 128;
      ba[n++] = (c & 63) | 128;
      j+=2;
    }
  }
  return new Uint8Array(ba).buffer;
}

WebsocketClient.prototype.gotRemoteStream = function(e) {
  const imeButton = document.getElementById('IME');
  imeButton.onclick = ()=>{
    const strArr = textToArrayBuffer('想输入啥就输入啥');
    const dataBuff = new ArrayBuffer(256);
    const typeF32 = new Float32Array(dataBuff,0,1);
    typeF32.fill(23);
    const strLenF32 = new Float32Array(dataBuff,4,1);
    strLenF32.fill(strArr.byteLength);
    const dataU8 = new Uint8Array(dataBuff,8);
    dataU8.set(new Uint8Array(strArr));

    this.receiveChannel.send(new Float32Array(dataBuff));
  }

  const remoteVideo = document.getElementById('remoteVideo');
  const ice = document.getElementById('ice-container');
  ice.style.display = 'none';
  const videoContainer = document.getElementById('videoContainer');
  videoContainer.style.display = 'block';
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

  let fpsTime = (new Date()).getTime();
  const calculateMousePos = function(mouseEvent){
    // const hoffset = window.screen.height - window.screen.availHeight;
    // const hoffset = window.outerHeight - window.innerHeight;
    const rect = remoteVideo.getBoundingClientRect();
    let mouseX = mouseEvent.clientX-rect.left;
    let mouseY = mouseEvent.clientY-rect.top;
    mouseX /=remoteVideo.clientWidth;
    mouseY /=remoteVideo.clientHeight;
    // console.info(`remoteVideo.offsetTop=${remoteVideo.offsetTop}, remoteVideo.clientTop=${remoteVideo.clientTop}, remoteVideo.scrollTop=${remoteVideo.scrollTop}`);
    // console.info(`remoteVideo.rect.left=${rect.left}, remoteVideo.rect.top=${rect.top}, remoteVideo.rect.right=${rect.right}, remoteVideo.rect.bottom =${rect.bottom }`);
    // console.info(`remoteVideo.offsetLeft=${remoteVideo.offsetLeft}, remoteVideo.offsetWidth=${remoteVideo.offsetWidth}`);
    // console.info(`remoteVideo.clientHeight=${remoteVideo.clientHeight}, remoteVideo.offsetHeight=${remoteVideo.offsetHeight}, remoteVideo.scrollHeight=${remoteVideo.scrollHeight}`);
    return{x: mouseX,y: mouseY}
  }


  videoContainer.addEventListener('mousemove',function (ev) {
    if (((new Date()).getTime() - fpsTime) < 30)
      return;
    fpsTime = (new Date()).getTime();
    const mousePos = calculateMousePos(ev);
    // const mousePos = {x: ev.movementX, y: ev.offsetY};
    this.receiveChannel.send(new Float32Array([ioEvent.mousemove,0,mousePos.x,mousePos.y]));
    // console.log(`mousedown, x = ${  mousePos.x  }y = ${  mousePos.y}`);
  }.bind(this),false);
  videoContainer.addEventListener('mousedown',function (ev) {
    const mousePos = calculateMousePos(ev);
    this.receiveChannel.send(new Float32Array([ioEvent.mousedown,ev.button,mousePos.x,mousePos.y]));
    console.log(`mousedown, x = ${  mousePos.x  }y = ${  mousePos.y}`);
    console.log(`window左边距=${window.offsetLeft},window顶边距=${window.offsetTop}.remoteVideo左边距=${remoteVideo.offsetLeft},remoteVideo顶边距=${remoteVideo.offsetTop}`);
  }.bind(this),false);
  videoContainer.addEventListener('mouseup',function (ev) {
    const mousePos = calculateMousePos(ev);
    this.receiveChannel.send(new Float32Array([ioEvent.mouseup,ev.button,mousePos.x,mousePos.y]));
    console.log(`mouseup, x = ${  mousePos.x  }y = ${  mousePos.y}`);
  }.bind(this),false);
  window.addEventListener('keydown',function (ev) {
    this.receiveChannel.send(new Float32Array([ioEvent.keydown,ev.keyCode]));
  }.bind(this),false);
  window.addEventListener('keyup',function (ev) {
    this.receiveChannel.send(new Float32Array([ioEvent.keyup,ev.keyCode]));
  }.bind(this),false);


}

WebsocketClient.prototype.onReceiveMessageCallback = function(event) {
  const message = event.data;
  console.log(message);
}

WebsocketClient.prototype.onReceiveChannelClosed = function() {
  console.log('Receive channel is closed');
}
