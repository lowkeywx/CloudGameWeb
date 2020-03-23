import * as React from 'react';
import { Button } from '@alifd/next';
import styles from './index.module.scss';

let pomelo = window.pomelo;
function entry(host, port, callback) {
      // init socketClient
      // TODO for development
      if(host === '127.0.0.1') {
        host = '10.0.19.29';
      }
      pomelo.init({host: host, port: port, log: true}, function() {
        pomelo.request('connector.entryHandler.entry', {userName: 'userName',password: '123456'}, function(data) {

          if (callback) {
            callback(data.code);
          }

          pomelo.request('jobDispatch.jobDispatchHandler.doJob',{jobType: 'experiment',experimentId: data[0]});

        });
      });
    }

    function queryEntry(uid, callback) {
      pomelo.init({host: '10.0.19.29', port: '3040', log: true}, function() {
        pomelo.request('gate.gateHandler.queryEntry', { uid: uid}, function(data) {
          pomelo.disconnect();

          if(data.code === 2001) {
            alert('Servers error!');
            return;
          }
          callback(data.host, data.port);
        });
      });
    }

function authEntry(uid, callback) {
      queryEntry(uid, function(host, port) {
        entry(host, port, callback);
      });
    }

function onStartExperimentClick(){
  console.log("点击了启动实验按钮");
  entry('10.0.19.29',3010);
  // authEntry('userName',(data)=>{
  // console.log(data.code);
  // });
}

const Guide = () => (
  <div className={styles.container}>
    <h2 className={styles.title}>Welcome to icejs!</h2>

    <p className={styles.description}>This is a awesome project, enjoy it!</p>

    <div className={styles.action}>
      <Button type="primary" size="large" onClick={onStartExperimentClick}>
        启动实验
      </Button>
    </div>
  </div>
);

export default Guide;
