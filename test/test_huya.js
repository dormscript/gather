/**
 * Creator: Tang Xiaoji
 * Time: 2018-05-07
 */

const Huya = require('../danmu/Huya');
let huya = new Huya('http://www.huya.com/131499');

huya.on('connect', () => {
  console.log('connect');
});

huya.on('data', (data) => {
	console.log("========:"+ data[0].cmd);
	if(data[0].cmd == 'getGameInfo') {
		console.log(JSON.stringify(data));
	}
	if(data[0].cmd == 'getRemainBeanNum') {
		console.log(data);
	}
  //console.log(data[0].cmd)
});

huya.on('error', (err) => {
  console.log('err: ', err);
});

huya.on('initerror', (err) => {
  console.log('initerr: ', err);
});

huya.on('close', (err) => {
  console.log('close: ', err);
});

huya.on('destroy', (err) => {
  console.log('destroy: ', err);
});
