var moment = require('moment');
var ParseBlaziong =  require('./parseBlaziong.js');
var ParseDefine =  require('./parseDefine.js');
var JsonFileTools =  require('./jsonFileTools.js');
var listDbTools =  require('./listDbTools.js');
var mData,mMac,mRecv,mDate,mTimestamp,mType,mExtra ;
var obj;
var path = './public/data/finalList.json';
var finalList = {};
var macGwIdMapList={"1c:49:7b:5f:d7:e2":["00001c497b5eeeff","00001c497b5eeefc"],
                    "1c:49:7b:49:8d:58":["00001c497b48dbc8","00001c497b48dbcb"],
                    "1c:49:7b:43:22:9c":["00001c497b4320bc","00001c497b43202a"],
                    "1c:49:7b:43:22:d4":["00001c497b43211b","00001c497b43211a"],
                    "1c:49:7b:43:23:32":["00001c497b431f0d","00001c497b431ff4"],
                    "1c:49:7b:43:21:78":["00001c497b431ee6","00001c497b431ee2"],
                    "1c:49:7b:43:21:f8":["00001c497b431f1a","00001c497b431fdf"],
                    "1c:49:7b:88:cb:98":["00001c497b88cf67","00001c497b88cf63"],
                    "1c:49:7b:88:cd:10":["00001c497b88cefa","00001c497b88cef9"],
                    "1c:49:7b:88:cd:70":["00001c497b88cee8","00001c497b88cee3"]};
var gwIdMacMapList={};
var overtime = 24;
var hour = 60*60*1000;
var mac_tag_map = {};
var type_tag_map = {};
var type_time_map = {};

function init(){
    //finalList = JsonFileTools.getJsonFromFile(path);
    listDbTools.findByName('finalist',function(err,lists){
        if(err)
            return;
        finalList = lists[0].list;
    });
    /*listDbTools.findByName('macGwIdMapList',function(err,lists){
        if(err)
            return;
        macGwIdMapList = lists[0].list;
    });*/
    gwIdMacMapList = getMapList(macGwIdMapList);
}

function getMapList(list){
    var keys = Object.keys(list);
    var json = {};
    for(key in list){
       json[list[key][0]]=key ;
       json[list[key][1]]=key ;
    }
    return json;
}

init();

exports.parseMsg = function (msg) {
    console.log('MQTT message :\n'+JSON.stringify(msg));
    if(getType(msg) === 'array'){
        obj = msg[0];
        console.log('msg array[0] :'+JSON.stringify(obj));
    }else if(getType(msg) != 'object'){
        try {
			obj = JSON.parse(msg.toString());
		}
		catch (e) {
			console.log('msgTools parse json error message #### drop :'+e.toString());
			return null;
		}
    }else{
        obj = msg;
    }
    //Get data attributes
    mData = obj.data;
    mMac  = obj.macAddr;
    mDate = moment(mRecv).format('YYYY/MM/DD HH:mm:ss');
    mExtra = obj.extra;
    if(obj.recv){
        mRecv = obj.recv;
    }else
    {
        mRecv = obj.time;
    }
    mTimestamp = new Date(mRecv).getTime();


    //Parse data
    if(mExtra.fport>0 ){
        mInfo = parseBlazingMessage(mData,mExtra.fport);
    }else{
        if(isSameTagCheck(mType,mMac,msg.recv))
            return null;
        if(mType.indexOf('aa')!=-1)
            mInfo = parseDefineMessage(mData,mType);
    }

    var msg = {mac:mMac,data:mData,recv:mRecv,date:mDate,extra:mExtra,timestamp:mTimestamp};
    if(mExtra.fport>0 ){
        saveBlazingList(mExtra.fport,mMac,msg)
    }else{
        finalList[mMac]=msg;
    }

    if(mInfo){
        console.log('**** '+msg.date +' mac:'+msg.mac+' => data:'+msg.data+'\ninfo:'+JSON.stringify(mInfo));
        msg.information=mInfo;
    }

    return msg;
}

exports.setFinalList = function (list) {
    finalList = list;
}

exports.getFinalList = function () {
    return finalList;
}

exports.saveFinalListToFile = function () {
    /*var json = JSON.stringify(finalList);
    fs.writeFile(path, json, 'utf8');*/
    JsonFileTools.saveJsonToFile(path,finalList);
}

exports.getDevicesData = function (type,devices) {
    var array = [];
    if(devices){
        for (var i=0;i<devices.length;i++)
        {
            //if(i==53){
              //console.log( '#### '+devices[i].mac + ': ' + JSON.stringify(devices[i]) ); 
            //}
            array.push(getDevicesArray(devices[i],i,type));
        }
    }

    var dataString = JSON.stringify(array);
    if(array.length===0){
        dataString = null;
    }
    return dataString;
};

function getDevicesArray(obj,item,type){

    var arr = [];
    
    arr.push(item);
    arr.push(obj.date);
    arr.push(obj.data);
    if(obj.info != undefined){
        if(type === 'pir'){
            if(obj.info.trigger != undefined && obj.info.trigger != 9  ){
                arr.push(obj.info.trigger);
            }else{
                arr.push('X');
            }
        }else if(type === 'gps'){

            if(obj.info.GPS_N  != undefined && obj.info.GPS_N != 9  ){
                arr.push(obj.info.GPS_N);
            }else{
                arr.push('X');
            }
            if(obj.info.GPS_E  != undefined && obj.info.GPS_E != 9  ){
                arr.push(obj.info.GPS_E);
            }else{
               arr.push('X');
            }

        }else if(type === 'pm25'){

            if(obj.info.value  != undefined && obj.info.value != 9  ){
                arr.push(obj.info.value);
            }else{
                arr.push('X');
            }
            if(obj.info.BATL  != undefined && obj.info.BATL != 9  ){
                arr.push(obj.info.BATL);
            }else{
                arr.push('X');
            }

        }else if(type === 'flood'){

            if(obj.info.trigger  != undefined && obj.info.trigger != 9  ){
                arr.push(obj.info.trigger);
            }else{
                arr.push('X');
            }
            if(obj.info.BATL  != undefined && obj.info.BATL != 9  ){
                arr.push(obj.info.BATL);
            }else{
                arr.push('X');
            }

        }
    }else{
        if(type == 'pir'){
            arr.push('X');
        } else {
            arr.push('X');
            arr.push('X');
        }
    }

    arr.push(obj.extra.rssi);
    arr.push(obj.extra.snr);
    arr.push(obj.extra.sf);
    arr.push(obj.extra.channel);
    arr.push(obj.extra.gwid);
    var gwMac =  gwIdMacMapList[obj.extra.gwid];
    if(gwMac!= undefined){
        arr.push(gwMac);
    }else{
        arr.push('');
    }
    arr.push(obj.extra.frameCnt);

    return arr;
}


exports.getFinalData = function (finalist) {
    var mItem = 1;
    var array = [];
    if(finalist){

        //console.log( 'Last Device Information \n '+JSON.stringify( mObj));

        for (var mac in finalist)
        {
            //console.log( '#### '+mac + ': ' + JSON.stringify(finalist[mac]) );

            array.push(getArray(finalist[mac],mItem));
            mItem++;
        }
    }

    var dataString = JSON.stringify(array);
    if(array.length===0){
        dataString = null;
    }
    return dataString;
};

function getArray(obj,item){

    var arr = [];
    var connection_ok = "<img src='/icons/connection_ok.png' width='30' height='30' name='status'>";
    var connection_fail = "<img src='/icons/connection_fail.png' width='30' height='30' name='status'>";
    /*if(item<10){
        arr.push('0'+item);
    }else{
        arr.push(item.toString());
    }*/
    arr.push(item);

    arr.push(obj.mac);
    arr.push(obj.date);
    arr.push(obj.extra.rssi);
    arr.push(obj.extra.snr);
    console.log('obj.overtime :'+obj.overtime);


    if( obj.overtime){
        arr.push(connection_fail);
        //console.log('overtime = true');
    }else{
        arr.push(connection_ok);
        //console.log('overtime = false');
    }
    //console.log('arr = '+JSON.stringify(arr));
    return arr;
}

function saveBlazingList(fport,mac,msg){
    var key = "gps";

    //for blazing
    if(fport === 3 || fport === 1){//GPS
        key = "gps";
    }else if(fport === 19){//PIR
        key = "pir";
    }else if(fport === 11){//PM2.5
        key = "pm25";
    }else if(fport === 21){//Flood
       key = "flood";
    }
    if(finalList[key] === undefined){
        finalList[key] = {};
    }
    //console.log('finalList1 :'+JSON.stringify(finalList));
    finalList[key][mac] = msg;
    //console.log('finalList2 :'+JSON.stringify(finalList));
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

function parseDefineMessage(data){
   var mInfo = ParseDefine.getInformation(data);
   return mInfo;
}

function parseBlazingMessage(data,fport){
    var mInfo = {};

    //for blazing
    if(fport === 3 || fport === 1){//GPS
        mInfo = ParseBlaziong.getTracker(data);
    }else if(fport === 19){//PIR
        mInfo = ParseBlaziong.getPIR(data);
    }else if(fport === 11){//PM2.5
        mInfo = ParseBlaziong.getPM25(data);
    }else if(fport === 21){//Flood
        mInfo = ParseBlaziong.getFlood(data);
    }
    return mInfo;
}

//type_tag_map is local JSON object
function isSameTagCheck(type,mac,recv){
	var time =  moment(recv).format('mm');

	//Get number of tag
	var tmp = mData.substring(4,6);
	var mTag = parseInt(tmp,16)*100;//流水號:百位
        mTag = mTag + parseInt(time,10);//分鐘:10位及個位
	var key = mac.concat(type);
	var tag = type_tag_map[key];

	if(tag === undefined){
		tag = 0;
	}

	/* Fix 時間進位問題
		example : time 由59分進到00分時絕對值差為59
	*/
	if (Math.abs(tag - mTag)<2 || Math.abs(tag - mTag)==59){
		console.log('mTag=' +mTag+'(key:' +key + '):tag='+tag+' #### drop');
		return true;
	}else{
		type_tag_map[key] = mTag;
		console.log('**** mTag=' +mTag+'(key:' +key + '):tag='+tag +'=>'+mTag+' @@@@ save' );
		return false;
	}
}

