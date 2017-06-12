console.log("Message admin device information");
var connected = false;
var host = window.location.hostname;
var port = window.location.port;
var opt2={
    //"order": [[ 2, "desc" ]],
    "iDisplayLength": 100,
    dom: 'Blrtip',
    buttons: [
        'copyHtml5',
        //'excelHtml5',
        'csvHtml5',
        //'pdfHtml5'
    ]
};
var table = $('#table1').dataTable(opt2);

var plot1;
var options1 ={
                title: "PH",
                axes:
                {
                    xaxis: {
                        numberTicks: 24,
                        renderer:$.jqplot.DateAxisRenderer,
                        tickOptions:{formatString:'%H:%M'}
                    },
                    yaxis: {
                        numberTicks: 10
                    }
                }
            };

if(location.protocol=="https:"){
  var wsUri="wss://"+host+":"+port+"/ws/devices";
} else {
  var wsUri="ws://"+host+":"+port+"/ws/devices";
}
console.log(wsUri);
var ws=null;

function wsConn() {
  ws = new WebSocket(wsUri);
  ws.onmessage = function(m) {
    //console.log('< from-node-red:',m.data);
    if (typeof(m.data) === "string" && m. data !== null){
      var msg =JSON.parse(m.data);
      console.log("from-node-red : id:"+msg.id);
      if(msg.id === 'init_table'){
          //Remove init button active
          console.log("v : "+msg.v);

          //Reload table data
          //console.log("v type:"+typeof(msg.v));

          table.fnClearTable();
          var data = JSON.parse(msg.v);
          //console.log("addData type : "+ typeof(data)+" : "+data);
          showChart(data);
          if(data){
              table.fnAddData(data);
          }
          waitingDialog.hide();
      }
    }
  }
  ws.onopen = function() {
    var mac = document.getElementById("mac").value;
    var type = document.getElementById("type").value;
    var date = document.getElementById("date").value;
    var option= document.getElementById("option").value;
    var host = window.location.hostname;
    var port = window.location.port;
    var json = {mac:mac,type:type,date:date,option:option,host:host,port:port};
    //alert('date :'+ date);
    connected = true;
    var obj = {"id":"init","v":json};
    var getRequest = JSON.stringify(obj);
    console.log("getRequest type : "+ typeof(getRequest)+" : "+getRequest);
    console.log("ws.onopen : "+ getRequest);
    ws.send(getRequest);      // Request ui status from NR
    console.log(getRequest);

  }
  ws.onclose   = function()  {
    console.log('Node-RED connection closed: '+new Date().toUTCString());
    connected = false;
    ws = null;
  }
  ws.onerror  = function(){
    console.log("connection error");
  }
}
wsConn();           // connect to Node-RED server

function setButton(_id,_v){ // update slider
  myselect = $("#"+_id);
   myselect.val(_v);
   myselect.slider('refresh');
}

function toSecondTable(mac){
    //alert("mac : "+mac);
    //document.location.href="/device?mac="+mac;
}

function showDialog(){
    //waitingDialog.show('Custom message', {dialogSize: 'sm', progressType: 'warning'});
    waitingDialog.show();
    setTimeout(function () {
      waitingDialog.hide();
      }, 5000);
}

function back(){
    //alert('back');
    location.href=document.referrer;
}

function showChart(data){
    var tempList = [],humList=[];
    //alert('data.length : '+data.length);
    for(i=0;i<data.length;i++){
        //alert('i : '+i);
        if(i > (data.length-1) ){
            break;
        }else{
            tempList.push([new Date(data[i][1]).getTime(),data[i][3] ]);
            if(i<2){
              alert('tempList :'+JSON.stringify(tempList));
            }
        }
    }


    tatalTime = Math.ceil((tempList[tempList.length-1][0]-tempList[0][0])/(1000*60*60))+1;
    //alert( tatalTime );
    if(tatalTime<12){
        x_number = tatalTime;
        formatStr = '%H:%M';
    }else if(tatalTime<26){
        x_number = tatalTime/2;
        formatStr = '%H:%M';
    }else if(tatalTime<24*7){
        x_number = Math.ceil(tatalTime/24);
        formatStr = '%m/%d';
    }else if(tatalTime<24*31){
        x_number = Math.ceil(tatalTime/(2*24));
        formatStr = '%m/%d';
    }else if(tatalTime<24*31*3){
        x_number = Math.ceil(tatalTime/(7*24));
        formatStr = '%m/%d';
    }


    if(plot1){
        plot1.destroy();
    }
    /*if(plot2){
        plot2.destroy();
    }*/


    options1.axes.xaxis.numberTicks = x_number;
    //options2.axes.xaxis.numberTicks = x_number;
    options1.axes.xaxis.tickOptions.formatString = formatStr;
    //options2.axes.xaxis.tickOptions.formatString = formatStr;
    plot1 = $.jqplot ('chartTmp', [tempList],options1);
    //plot2 = $.jqplot ('chartHum', [humList],options2);
}


$(document).ready(function(){
    showDialog();


    /*table.$('tr').click(function() {
        var row=table.fnGetData(this);
        toSecondTable(row[1]);

    });*/


    //$("#table1").dataTable(opt); //中文化


    /*table.$('tr').click(function() {
        var row=table.fnGetData(this);
        toSecondTable(row[1]);

    });

     $("#table1").on({
          mouseenter: function(){
           //stuff to do on mouse enter

           $(this).css({'color':'blue'});
           },
           mouseleave: function () {
           //stuff to do on mouse leave
           $(this).css({'color':'black'});
      }},'tr');*/

});