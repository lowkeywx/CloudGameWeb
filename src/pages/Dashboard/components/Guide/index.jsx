import React, { useState } from 'react';
import { Button, Message, Select, Loading } from '@alifd/next';
import styles from './index.module.scss';
import websocketclient from './client'

const pomelo = window.pomelo;
pomelo.on('jobMsg',OnMessage);
pomelo.on('showInClient',OnMessage);
const serverHost = '10.0.19.51';

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
  let nofyfyMsg = '未知错误';
  switch(data.code){
    case 0:
      nofyfyMsg = data.data || '';
      Message.notice({title: `${returnMsg[codeMsg[0]]},${nofyfyMsg}`, duration: 2000});
      break;
    case 1:
      nofyfyMsg = data.data || '';
      Message.notice({ title: `${returnMsg[codeMsg[1]]},${nofyfyMsg}`, duration: 2000 });
      break;
    case 2:
      nofyfyMsg = data.data || '';
      Message.notice({ title: `${returnMsg[codeMsg[2]]},${nofyfyMsg}`, duration: 2000 });
      window.rtcClient = websocketclient(data.msg);
      break;
    case 3:
      nofyfyMsg = data.data || '';
      Message.notice({ title: `${returnMsg[codeMsg[3]]},${nofyfyMsg}`, duration: 2000 });
      break;
    case 4:
      nofyfyMsg = data.data || '';
      Message.notice({ title: `${returnMsg[codeMsg[4]]},${nofyfyMsg}`, duration: 2000 });
      break;
    case 5:
      nofyfyMsg = data.data || '';
      Message.notice({ title: `${returnMsg[codeMsg[5]]},${nofyfyMsg}`, duration: 2000 });
      break;
    case 6:
      nofyfyMsg = data.data || '';
      Message.notice({ title: `${returnMsg[codeMsg[6]]},${nofyfyMsg}`, duration: 2000 });
      break;
    case 7:
      nofyfyMsg = data.data || '';
      Message.notice({ title: `${returnMsg[codeMsg[7]]},${nofyfyMsg}`, duration: 2000 });
      break;
    default:
      Message.notice({ title: `${nofyfyMsg},${data.data}`, duration: 2000 });
      break;
  }
}

const Guide = () => {
  const[randomExp,SetRandomExp] = useState(false);
  const[startBtdisabled,SetBtDisable] = useState(false);
  const[startBtName,SetStartBtName] = useState('获取实验');
  const[seletExperimentId,SetExperimentId] = useState('');
  const[dataSource,setDataSource] = useState([]);
  const[loadingVisisble,SetLoadingVisible] = useState(false);
  const[selectDisable,SetSelectDisable] = useState(true);
  const[selectDivVisible,SetSelectDivVisible] = useState('hidden');
  function isStartExp(){
    SetRandomExp(false);
    if(startBtName === '获取实验') return false;
    if(startBtName === '启动实验') return true;
  }
  
  function startRandomExp(data){
    const rd = Math.floor(Math.random()*10)%data.length;
    SetExperimentId(data[rd]);
    console.log(`获取的随机数=${rd}, 返回的列表长度=${data.lenght}, experimentId=${seletExperimentId}`);
    onStartExperimentClick();
  }

  function handleChange(value) {
    SetExperimentId(value.value);
    console.log(value);
  }

  function entry(host, port, callback) {
    if(host === '127.0.0.1') {
      // eslint-disable-next-line no-param-reassign
      host = serverHost;
    }
    const timeStamp = new Date().getTime();
    pomelo.init({'host': host, 'port': port, log: true}, function() {
      pomelo.request('connector.entryHandler.entry', {userName: timeStamp.toString(),password: '123456',schoolId: 0}, function(data) {
        if(!data){
          // eslint-disable-next-line no-alert
          alert('获取实验列表为空!');
        }
        if (callback) { callback(data.code); }
        console.log('获取实验列表成功。');
        pomelo.on('close',function(){ location.reload(); });
        if(randomExp){
          startRandomExp(data);
        }else{
          const expArray = [];
          for(let i = 0; i < data.length; i++){
            expArray.push(data[i]);
          }
          SetLoadingVisible(false);
          setDataSource(expArray);
          SetStartBtName('启动实验');
          SetBtDisable(false);
          SetSelectDisable(false);
          SetSelectDivVisible('visible');
        }
      });
    });
  }

  function queryEntry(uid, callback) {
    pomelo.init({host: serverHost, port: '3040', log: true}, function() {
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
    SetBtDisable(true);
    SetLoadingVisible(true);
    if(isStartExp()){
      console.log('点击了启动实验按钮');
      if(!seletExperimentId) {
        Message.notice({title: '您还没有选择实验.', duration: 2000});
        SetBtDisable(false);
        SetLoadingVisible(false);
        return;
      }
      setTimeout(() => { SetLoadingVisible(false); }, 1000 * 6);
      SetSelectDivVisible('hidden');
      pomelo.request('jobDispatch.jobDispatchHandler.doJob',{jobType: 0,experimentId: seletExperimentId},function(data1) {
        console.log(`jobDispatch.jobDispatchHandler.doJob is callback. return value is ${  data1}`);
      });
    }else{
      console.log('点击了获取实验按钮');
      authEntry('userName',(data)=>{
        console.log(data);
      });
    }
  }

  return(
    <div className={styles.container}>
      <h2 className={styles.title}>云平台3.0</h2>
      <p className={styles.description}>这是一个测试版本, 测试过程中有任何问题请反馈一下,谢谢。</p>
      <p className={styles.description1}>排队过程中无需刷新页面, 待有可用服务器会自动进入实验</p>
      <div style={{visibility: selectDivVisible}}>
        <Select useDetailValue onChange={handleChange} dataSource={dataSource} size="large" disabled={selectDisable}/>
      </div>
      <div className={styles.action} >
        <Loading tip="...启动中..." size="large" visible={loadingVisisble} fullScreen>
          <Button type="primary" size="large" disabled={startBtdisabled} onClick={onStartExperimentClick}>
            {startBtName}
          </Button>
        </Loading>
      </div>
    </div>
  );
};

export default Guide;
