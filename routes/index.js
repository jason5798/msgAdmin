var express = require('express');
var router = express.Router();
var DeviceDbTools = require('../models/deviceDbTools.js');
var ListDbTools = require('../models/listDbTools.js');
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/test.json';
var hour = 60*60*1000;
var type = 'gps';

module.exports = function(app) {
  app.get('/', function (req, res) {
  	    var now = new Date().getTime();
		ListDbTools.findByName('finalist',function(err,lists){
			if(err){
				res.render('index', { title: '首頁',
					success: '',
					error: err.toString(),
					finalList:null,
					type:type
				});
			}else{
				var typeObj = JsonFileTools.getJsonFromFile(path2);
				if(typeObj)
					type = typeObj.type;
				else{
					var json = {"type":'pir'};
					JsonFileTools.saveJsonToFile(path2,json);
				}

				req.session.type = type;
				var finalList = lists[0]['list'][type];
				//console.log('finalList :'+JSON.stringify(finalList));
				if(finalList){
					var keys = Object.keys(finalList);
					console.log('Index finalList :'+keys.length);
					for(var i=0;i<keys.length ;i++){
						//console.log(i+' timestamp : '+ finalList[keys[i]].timestamp);
						//console.log(i+' result : '+ ((now - finalList[keys[i]].timestamp)/hour));
						finalList[keys[i]].overtime = true;
						if( ((now - finalList[keys[i]].timestamp)/hour) < 1 )  {
							finalList[keys[i]].overtime = false;
						}
					}
				}else{
					finalList = null;
				}

				res.render('index', { title: '首頁',
					success: null,
					error: null,
					finalList:finalList,
					type:type
				});
			}
		});
  });

  app.get('/devices', function (req, res) {
	var mac = req.query.mac;
	var type = req.query.type;
	var date = req.query.date;
	var option = '1';
	DeviceDbTools.findDevicesByDate(date,mac,Number(option),'desc',function(err,devices){
		if(err){
			console.log('find name:'+find_mac);
			return;
		}

		devices.forEach(function(device) {
			console.log('mac:'+device.date + ', data :' +device.data);
		});

		res.render('devices', { title: '裝置',
			devices: devices,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			type:type,
			mac:mac
		});
	});
  });
  
  app.get('/find', function (req, res) {
	var testObj = JsonFileTools.getJsonFromFile(path2);
	test = testObj.test;
	console.log('render to post.ejs');
	var find_mac = req.flash('mac').toString();
	var successMessae,errorMessae;
	console.log('mac:'+find_mac);

	if(find_mac.length>0){
		console.log('find_mac.length>0');
		DeviceModel.find({ macAddr: find_mac }, function(err,devices){
			if(err){
				console.log('find name:'+find_mac);
				req.flash('error', err);
				return res.redirect('/find');
			}
			/*console.log("find all of mac "+find_mac+" : "+devices);
			devices.forEach(function(device) {
				console.log('mac:'+device.macAddr + ', data :' +device.data);
			});*/

			if (devices.length>0) {
				console.log('find '+devices.length+' records');
				successMessae = '找到'+devices.length+'筆資料';
				res.render('find', { title: '查詢',
					devices: devices,
					success: successMessae,
					error: errorMessae,
					test:test
				});
			}else{
				console.log('找不到資料!');
				errorMessae = '找不到資料!';
				req.flash('error', err);
      			return res.redirect('/find');
	  		}

    	});
	}else{
		console.log('find_name.length=0');
		res.render('find', { title: '查詢',
			devices: null,
			success: successMessae,
			error: errorMessae,
			test:test
	  });
	}


  });
  app.post('/find', function (req, res) {
	var	 post_mac = req.body.mac;

	console.log('find mac:'+post_mac);
	req.flash('mac', post_mac);
	return res.redirect('/find');
  });
};