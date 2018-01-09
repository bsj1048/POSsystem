var rest = require('./restServer.js');

// REST API 서버 활성화
var restPort = 8089;
rest.startRestServer(restPort);
// 서버 활성화 여부 확인을 위한 console 출력 
console.log('[REST SERVER] - Started on ' + restPort + ' port....');
