console.log("Message admin device information");
var connected = false;
var now = new Date();
var date = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
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

if(location.protocol=="https:"){
  var wsUri="wss://"+window.location.hostname+":"+window.location.port+"/ws/gateway";
} else {
  var wsUri="ws://"+window.location.hostname+":"+window.location.port+"/ws/gateway";
}
var ws=null;

function wsConn() {
  ws = new WebSocket(wsUri);
  ws.onmessage = function(m) {
    //console.log('< from-node-red:',m.data);
    if (typeof(m.data) === "string" && m. data !== null){
      var msg =JSON.parse(m.data);
      console.log("from-node-red : id:"+msg.id);
      if(msg.id === 'change_table'){
          //Remove init button active
          console.log("initBtnStr:"+initBtnStr+"remove active");
          //$(initBtnStr).siblings().removeClass("active");
          $(initBtnStr).addClass().siblings().removeClass("active");
          //Reload table data
          console.log("v type:"+typeof(msg.v));

            table.fnClearTable();
            var data = JSON.parse(msg.v);
            if(data){
                  //console.log("addData type : "+ typeof(data)+" : "+data);
                  table.fnAddData(data);
                  table.$('tr').click(function() {
                  var row=table.fnGetData(this);
                  toSecondTable(row[1]);
              });
            }
      }else if(msg.id === 'init_btn'){
          //Set init button active
          console.log("type:"+typeof(msg.v)+" = "+ msg.v);
          type = msg.v;
          initBtnStr  ='#'+msg.v;
          highlight(type);
      }
    }
  }
  ws.onopen = function() {
    /*var mac = document.getElementById("mac").value;
    var type = document.getElementById("type").value;
    var date = document.getElementById("date").value;
    var option= document.getElementById("option").value;*/
    var host = window.location.hostname;
    var port = window.location.port;
    //var json = {mac:mac,type:type,date:date,option:option,host:host,port:port};
    var json = {host:host,port:port};
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

function highlight(id) {
  var arr = ["pir","gps","pm25","flood","others","gateway"];
  for(var i = 0;i<arr.length;i++){
    if(arr[i] === id){
      document.getElementById(arr[i]).style.background = "#89AAC0";
    }else{
      document.getElementById(arr[i]).style.background = "#42566A";
    }
  }
}

function toSecondTable(mac){
    //alert("mac : "+mac);
    //document.location.href="/device?mac="+mac;
}

function myFunction(id){  // update device
  console.log('myFunction :'+id);
  window.location.href='/?type='+id;
}

function showDialog(){
    //waitingDialog.show('Custom message', {dialogSize: 'sm', progressType: 'warning'});
    waitingDialog.show();
    setTimeout(function () {
      waitingDialog.hide();
      }, 1000);
}

function back(){
    //alert('back');
    location.href=document.referrer;
}


$(document).ready(function(){
    highlight('gateway');
    //showDialog();
    if(document.getElementById("date").value === ''){
      document.getElementById("date").value = date;
    }

    table.$('tr').click(function() {
        var row=table.fnGetData(this);
        toSecondTable(row[1]);

    });


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