import * as React from 'react';
import { Button, Message, Select } from '@alifd/next';
import styles from './index.module.scss';
import websocketclient from './client';


const pomelo = window.pomelo;
pomelo.on('jobMsg',OnMessage);
pomelo.on('showInClient',OnMessage);

let seletExperimentId = 'tanks';
const dataSource = [
  {value: 'tanks', label: 'tanks'},
  {value: 'ball', label: 'ball'},
  {value: 'BanHeZhan', label: 'BanHeZhan'},
];

function handleChange(value) {
  seletExperimentId = value.value;
  console.log(value);
}

const returnMsg = {
  authFail: '验证失败',
  jobFail: '任务处理失败',
  jobDispatched: '任务已经派发',
  jobInit: '已生成任务数据',
  invalidArgs_jobType: '无效的参数jobType',
  invalidArgs_expId: '无效的参数expId',
  maxJob: '超过实验最大请求数',
  noIdleServer: '无可用服务器',
}
const codeMsg = ['authFail', 'jobFail', 'jobDispatched','jobInit','invalidArgs_jobType','invalidArgs_expId','maxJob','noIdleServer','end']
function OnMessage(data){
  switch(data.code){
    case 0:
      data.data = data.data || '';
      // alert(returnMsg[codeMsg[0]]);
      Message.notice({
        title: `${returnMsg[codeMsg[0]]},${data.data}`,
        duration: 2000
      });
      break;
    case 1:
      // alert(returnMsg[codeMsg[1]]);
      data.data = data.data || '';
      Message.notice({
        title: `${returnMsg[codeMsg[1]]},${data.data}`,
        duration: 2000
      });
      break;
    case 2:
      // alert(returnMsg[codeMsg[2]]);
      data.data = data.data || '';
      Message.notice({
        title: `${returnMsg[codeMsg[2]]},${data.data}`,
        duration: 2000
      });
      pomelo.rtcClient = websocketclient(data.msg);
      break;
    case 3:
      // alert(returnMsg[codeMsg[3]]);
      data.data = data.data || '';
      Message.notice({
        title: `${returnMsg[codeMsg[3]]},${data.data}`,
        duration: 2000
      });
      break;
    case 4:
      // alert(returnMsg[codeMsg[4]]);
      data.data = data.data || '';
      Message.notice({
        title: `${returnMsg[codeMsg[4]]},${data.data}`,
        duration: 2000
      });
      break;
    case 5:
      // alert(returnMsg[codeMsg[5]]);
      data.data = data.data || '';
      Message.notice({
        title: `${returnMsg[codeMsg[5]]},${data.data}`,
        duration: 2000
      });
      break;
    case 6:
      // alert(returnMsg[codeMsg[6]]);
      data.data = data.data || '';
      Message.notice({
        title: `${returnMsg[codeMsg[6]]},${data.data}`,
        duration: 2000
      });
      break;
    case 7:
      // alert(returnMsg[codeMsg[7]]);
      data.data = data.data || '';
      Message.notice({
        title: `${returnMsg[codeMsg[7]]},${data.data}`,
        duration: 2000
      });
      break;
    default:
      break;
  }
}

function entry(host, port, callback) {
  // init socketClient
  // TODO for development
  if(host === '127.0.0.1') {
    // eslint-disable-next-line no-param-reassign
    host = '10.0.100.11';
  }
  const timeStamp = new Date().getTime();
  pomelo.init({'host': host, 'port': port, log: true}, function() {
    pomelo.request('connector.entryHandler.entry', {userName: timeStamp.toString(),password: '123456',schoolId: 0}, function(data) {
      if(!data){
        alert('获取实验列表为空!');
      }
      if (callback) {
        callback(data.code);
      }
      console.log('获取实验列表成功，将启动实验。');
      console.log(`data keys is : ${Object.keys(data)}`);
      console.log(`data values is  : ${Object.values(data)}`);
      pomelo.on('close',function(){
        location.reload();
      });
      const rd = Math.floor(Math.random()*10)%data.length;
      const info = seletExperimentId;
      // const info = data[rd];
      console.log(`获取的随机数=${rd}, 返回的列表长度=${data.lenght}, experimentId=${info.experimentId}, 绝对路径=${info.AbsolutePath}`);
      pomelo.request('jobDispatch.jobDispatchHandler.doJob',{jobType: 0,experimentId: info},function(data1) {
        console.log(`jobDispatch.jobDispatchHandler.doJob is callback. return value is ${  data1}`);
      });

    });
  });
}

function queryEntry(uid, callback) {
  pomelo.init({host: '10.0.100.11', port: '3040', log: true}, function() {
    pomelo.request('gate.gateHandler.queryEntry', { 'uid': uid}, function(data) {
      pomelo.disconnect();

      if(data.code === 2001) {
        // eslint-disable-next-line no-alert
        alert('Servers error!');
        return;
      }
      callback(data.clientHost, data.clientPort);
    });
  });
}

function authEntry(uid, callback) {
  queryEntry(uid, function(host, port) {
    console.log(`host : ${  host  }, port : ${  port}`);
    entry(host, port, callback);
  });
}

function onStartExperimentClick(){
  console.log('点击了启动实验按钮');
  authEntry('userName',(data)=>{
    console.log(data);
  });
}



const Guide = () => (

  <div className={styles.container}>
    <h2 className={styles.title}>云平台3.0</h2>

    <p className={styles.description}>这是一个测试版本, 不要多次点击"启动实验"按钮</p>
    <div id="videoContainer">
      <video id="remoteVideo" playsinline autoPlay muted><track  /></video>
    </div>
    <div>
      <Select useDetailValue defaultValue={{value: 'tanks', label: 'tanks'}} onChange={handleChange} dataSource={dataSource} style={{width: 150}}/>
    </div>
    <div className={styles.action}>
      <Button id="startbt" type="primary" size="large" onClick={onStartExperimentClick}>
        启动实验
      </Button>
    </div>
  </div>
);

export default Guide;
