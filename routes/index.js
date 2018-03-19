var express = require('express');
var router = express.Router();
var DeviceDbTools = require('../models/deviceDbTools.js');
var ListDbTools = require('../models/listDbTools.js');
var UnitDbTools = require('../models/unitDbTools.js');
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/test.json';
var unitPath = './public/data/unit.json';
var selectPath = './public/data/select.json';
var hour = 60*60*1000;
var type = 'gps';
var async  = require('async');
var mongoMap = require('../models/mongoMap.js');

function findUnitsAndShowSetting(req,res,isUpdate){
	UnitDbTools.findAllUnits(function(err,units){
		var successMessae,errorMessae;
		var macTypeMap = {};

		if(err){
			errorMessae = err;
		}else{
			if(+units.length>0){
				successMessae = '查詢到'+units.length+'筆資料';
			}
		}
		req.session.units = units;

		console.log( "successMessae:"+successMessae );
		res.render('setting', { title: 'Setting',
			units:req.session.units,
			user:req.session.user,
			success: successMessae,
			error: errorMessae
		});
	});
}

module.exports = function(app) {
  app.get('/', function (req, res) {
  	    var now = new Date().getTime();
		var selectObj = JsonFileTools.getJsonFromFile(selectPath);
	
		var finalList = JsonFileTools.getJsonFromFile(path);
		var unitObj = JsonFileTools.getJsonFromFile(unitPath);

		//console.log('finalList :'+JSON.stringify(finalList));
		if(finalList){
			var keys = Object.keys(finalList);
			console.log('Index finalList :'+keys.length);
			for(var i=0;i<keys.length ;i++){
				//console.log( i + ') mac : ' + keys[i] +'=>' + JSON.stringify(finalList[keys[i]]));
				//console.log(i+' result : '+ ((now - finalList[keys[i]].timestamp)/hour));
				finalList[keys[i]].overtime = true;
				if( ((now - finalList[keys[i]].timestamp)/hour) < 2 )  {
					finalList[keys[i]].overtime = false;
				}
				finalList[keys[i]].name = '';
				//console.log(i+' keys[i] : '+ keys[i]);
				//console.log(i+' unitObj[keys[i]] : '+ unitObj[keys[i]]);
				if( unitObj[keys[i]] )  {
					finalList[keys[i]].name = unitObj[keys[i]];
				}
			}
		}else{
			finalList = null;
		}

		res.render('index', { title: 'Index',
			success: null,
			error: null,
			finalList:finalList,
			type:type,
			isNeedTypeSwitch:settings.isNeedTypeSwitch,
			co:settings.co,
			select:selectObj
		});
  });

  app.get('/devices', function (req, res) {
	var mac = req.query.mac;
	var finalList = JsonFileTools.getJsonFromFile(path);
	var obj = finalList[mac];
	var type = obj.extra.fport+'';
	var date = req.query.date;
	var option = req.query.option;
	req.session.type = type;
	var json = {'deviceType': type};
	async.waterfall([
		function(next){
			mongoMap.find(json).then(function(data) {
				// on fulfillment(已實現時)
				console.log(JSON.stringify(data));
				next(null, data[0]);
			}, function(reason) {
				// on rejection(已拒絕時)
				next(reason, null);
			});
		}
	], function(err, rest){
		var fields = [];
		if(err) {
			fields = null;
		} else {
		  var fieldObj = rest.fieldName;
		  var keys = Object.keys(fieldObj);
		  for (var i=0;i<keys.length;i++) {
			fields.push(fieldObj[keys[i]]);
		  }
		}
		
		res.render('devices', { title: 'Device',
			fields: fields,
			type:req.session.type,
			mac:mac,
			date:date,
			option:option,
			isNeedTypeSwitch:settings.isNeedTypeSwitch
		}); 	    
	});
	
  });

  app.get('/setting', function (req, res) {
		console.log('render to setting.ejs');
		findUnitsAndShowSetting(req,res,true);
  });

  app.post('/setting', function (req, res) {
		var	post_mac = req.body.mac;
		var post_name = req.body.name;
		var post_type = req.body.type_option;
		var post_mode = req.body.mode;
		var typeString = req.body.typeString;
		console.log('mode : '+post_mode);
		if(post_mode == 'new'){
			if(	post_mac && post_name && post_mac.length==8 && post_name.length>=1){
				console.log('post_mac:'+post_mac);
				console.log('post_name:'+post_name);
				UnitDbTools.saveUnit(post_mac,post_name,post_type,typeString,function(err,result){
					if(err){
						req.flash('error', err);
						return res.redirect('/setting');
					}
					findUnitsAndShowSetting(req,res,true);
				});
				var unitObj = JsonFileTools.getJsonFromFile(unitPath);
				unitObj[post_mac] = post_name;
				JsonFileTools.saveJsonToFile(unitPath,unitObj);
				return res.redirect('/setting');
			}
		}else if(post_mode == 'del'){//Delete mode
			post_mac = req.body.postMac;
			UnitDbTools.removeUnitByMac(post_mac,function(err,result){
				if(err){
					req.flash('error', err);
					console.log('removeUnitByMac :'+post_mac + err);
					return res.redirect('/setting');
				}else{
					req.flash('error', err);
					console.log('removeUnitByMac :'+post_mac + 'success');
				}
				findUnitsAndShowSetting(req,res,false);
			});
			var unitObj = JsonFileTools.getJsonFromFile(unitPath);
			if(unitObj[post_mac]){
				delete unitObj[post_mac];
			}
			
			JsonFileTools.saveJsonToFile(unitPath,unitObj);

		}else{//Edit mode
			post_mac = req.body.postMac;
			UnitDbTools.updateUnit(post_type,post_mac,post_name,null,typeString,function(err,result){
				if(err){
					req.flash('error', err);
					console.log('edit  :'+post_mac + err);
					return res.redirect('/setting');
				}else{
					console.log('edit :'+post_mac + 'success');
				}
				findUnitsAndShowSetting(req,res,false);
			});
     		var unitObj = JsonFileTools.getJsonFromFile(unitPath);
			unitObj[post_mac] = post_name;
			JsonFileTools.saveJsonToFile(unitPath,unitObj);
		}
  	});
};