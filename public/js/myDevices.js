console.log("Message admin device information");
      var connected = false;
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
                  },dom: 'Blrtip',
                    buttons: [
                        'copyHtml5',
                        'excelHtml5',
                        'csvHtml5',
                        'pdfHtml5'
                    ]
           };
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
        var wsUri="wss://"+window.location.hostname+":"+window.location.port+"/ws/devices";
      } else {
        var wsUri="ws://"+window.location.hostname+":"+window.location.port+"/ws/devices";
      }
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
                console.log("addData type : "+ typeof(data)+" : "+data);
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
            }, 1000);
      }

      function back(){
          //alert('back');
          location.href=document.referrer;
      }


      $(document).ready(function(){
          showDialog();


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