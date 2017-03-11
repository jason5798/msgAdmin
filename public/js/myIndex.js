console.log("message manager");
var now = new Date();
var date = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
var type = "pir";
var connected = false;
var initBtnStr ="#pir";
var opt={"oLanguage":{"sProcessing":"處理中...",
      "sLengthMenu":"顯示 _MENU_ 項結果",
      "sZeroRecords":"沒有匹配結果",
      "sInfo":"顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
      "sInfoEmpty":"顯示第 0 至 0 項結果，共 0 項",
      "sInfoFiltered":"(從 _MAX_ 項結果過濾)",
      "sSearch":"搜索:",
      "oPaginate":{"sFirst":"首頁",
                   "sPrevious":"上頁",
                   "sNext":"下頁",
                   "sLast":"尾頁"}
      }
};
var opt2={
     "order": [[ 2, "desc" ]],
     "iDisplayLength": 25
 };

//table = $("#table1").dataTable(opt); //中文化
var table = $("#table1").dataTable(opt2);
if(location.protocol=="https:"){
  var wsUri="wss://"+window.location.hostname+":"+window.location.port+"/ws/";
} else {
  var wsUri="ws://"+window.location.hostname+":"+window.location.port+"/ws/";
}
console.log("wsUri:"+wsUri);
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

    connected = true;
    var obj = {"id":"init","v":document.cookie};
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

function myFunction(id){  // update device
  highlight(id);
  console.log(id);
  if(ws){
      console.log("ws.onopen OK ");
  }
  console.log("id type : "+ typeof(id)+" : "+id);
  type = id;
  initBtnStr = "#"+id;
  var obj = {"id":"change_type","v":id};
  var objString = JSON.stringify(obj);
  console.log("getRequest type : "+ typeof(objString)+" : "+objString);
  console.log("ws.onopen : "+ objString);
  ws.send(objString);     // Request ui status from NR
  console.log("sent change_type requeset");

}

function highlight(id) {
    var arr = ["pir","gps","pm25","flood"];
    for(var i = 0;i<arr.length;i++){
      if(arr[i] === id){
        document.getElementById(arr[i]).style.background = "#89AAC0";
      }else{
        document.getElementById(arr[i]).style.background = "#42566A";
      }
    }
  }

function toSecondTable(mac){
    //alert("mac :"+mac);
    var date =document.getElementById("date").value;
    //alert("date :"+date);
    document.location.href="/devices?mac="+mac+"&type="+type+"&date="+date;
}


$(document).ready(function(){

    table.$('tr').click(function() {
        var row=table.fnGetData(this);
        toSecondTable(row[1]);

    });
    new Calendar({
        inputField: "date",
        dateFormat: "%Y/%m/%d",
        trigger: "BTN",
        bottomBar: true,
        weekNumbers: true,
        showTime: 24,
        onSelect: function() {this.hide();}
    });

    document.getElementById("date").value = date;
      //table = $("#table1").dataTable(opt2);

          table.$('tr').click(function() {
              var row=table.fnGetData(this);
              toSecondTable(row[1]);

          });
          new Calendar({
              inputField: "date",
              dateFormat: "%Y/%m/%d",
              trigger: "BTN",
              bottomBar: true,
              weekNumbers: true,
              showTime: 24,
              onSelect: function() {this.hide();}
          });

          document.getElementById("date").value = date;
     /*$("#table1").on({
          mouseenter: function(){
           //stuff to do on mouse enter

           $(this).css({'color':'blue'});
           },
           mouseleave: function () {
           //stuff to do on mouse leave
           $(this).css({'color':'black'});
      }},'tr');*/

});