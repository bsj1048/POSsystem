var dummyCont,
    mapCont;
var descCont;

$(document).ready(function() {

    
    var userId = localStorage.getItem("userid");
    var socket = io.connect('http://1.245.47.107:8093/');
    var lookedForAp = "",
        lookedForZone = "",
        lookedForLon = 0,
        lookedForLat = 0;
    var apId = '',
        zoneId = '',
        zoneNum = 0;
    var isdrawDescMap = false;
    var firstapId='',
        firstzoneId = '',
        isFirstAp = true;
    var removeNavi = false;
    var showAdvCount = 0;
    var dummyMapCanvas = document.getElementById('dummyzoneMap');
    var smMapCanvas = document.getElementById('smMap');
    var descCanvas = document.getElementById('desc');    
    
    var mapImg = new Image();
    var image = new Image();      
    var anotherzone = false;

    dummyCont = dummyMapCanvas.getContext('2d');
    mapCont = smMapCanvas.getContext('2d');
    descCont = descCanvas.getContext('2d');

    var setAndDrawAP = function(response) {

        var result = JSON.parse(response);
        var getApList = result.accessPointList.accessPoint;
        var zoneId_str = result.accessPointList.zoneId;

        for (var i in getApList) {
            if (getApList[i].accessPointId === apId) {
                dummyCont.fillStyle = 'rgba( 255, 0, 0, 0.6 )';
            }
            else {
                dummyCont.fillStyle = 'rgba( 0, 97, 255, 0.5 )';
            }

            drawCircle(zoneId_str,getApList[i].locationInfo.latitude, getApList[i].locationInfo.longitude); 
        }

        if( lookedForAp && !removeNavi ) {

            if (lookedForZone === zoneId) {
    
                var img = new Image();
                img.onload = function() {
                    dummyCont.drawImage(img, lookedForLat-55 , lookedForLon-53); 
                }
                img.src = '/image/aim.png';
            }
            else {
                var lookedforZonenum = parseInt(lookedForZone.substring(4,6));
                if(lookedforZonenum < zoneNum){
                    var img = new Image();
                    img.onload = function() {
                        dummyCont.drawImage(img,10, 140); 
                    }
                    img.src = '/image/left-arrow.png';
                }
                else{
                    var img = new Image();
                    img.onload = function() {
                        dummyCont.drawImage(img,150, 10); 
                    }
                    img.src = '/image/up-arrow.png';
                }
            }
        }
    }

    var getApList = function(zoneId) {
        return $.ajax({
            url:'/getAPList',
            data:{ "zoneId":zoneId }
        })  
    }

    var drawZoneMap = function (zoneId) {
        $("#dummyzoneMap").empty();
       
        image.setAttribute('width', screen.width);
        image.setAttribute('height', screen.height-300);
        image.onload = function() {
            dummyMapCanvas.width = image.width;
            dummyMapCanvas.height = image.height; 
            dummyCont.drawImage(this, 0, 0, this.width, this.height);  
            
        };
        image.src = '/image/' + zoneId + '.png';
        getApList(zoneId)
        .done(setAndDrawAP)
        .fail(function() {
            alert('fail to get ap list');
        });
    }

    var drawSmallMap = function(zoneNum) {
        //전체 지도
        mapImg.setAttribute('width', screen.width-90);
        mapImg.setAttribute('height', screen.height-430);
        mapImg.onload = function() {
            smMapCanvas.style.marginTop = '340px';
            
            smMapCanvas.width = mapImg.width;
            smMapCanvas.height = mapImg.height;    
            mapCont.drawImage(this,0, 0, this.width, this.height);
           
            //drawRect(zoneNum);
        };
        mapImg.src = '/image/minimap'+zoneNum+".png"
        //mapImg.src = '/image/divMap2.jpg';
    }

    var userEnter = function(zoneId, userId,apId ){
        $.ajax({
            url:'/updateUser',
            type:'post',
            data:{ "userId":userId,"accessPointId":apId }
        })
        .done(function(response) {
            if(response.rowCount) {
                console.log("success update user")
            }
        })

        $.ajax({
            url:"/userEnter",
            type:"post",
            data:{ "zoneId":zoneId,"userId":userId,"accessPointId":apId }
        })
        .done(function(){
            console.log("userEnter 완료...")

        })
    }
    var handleExit = function() {
        console.log("exit처리")
        // $.ajax({
        //     url:'/deleteUser',
        //     data:{ "id":userId }
        // })
        // .done(function() {
        $.ajax({
            url:'/userExit',
            method:'post',
            data:{ "id":userId }
        })
        .done(function() {
            localStorage.clear();
            location.href="/"
        })
    }

    $("#logout").click(function() {
        localStorage.clear();
        location.href="/"
    })

    var handleGetAccessPointByIP = function(response) {
        if (response === "400") {
            handleExit();
        }
        else {
            var result = JSON.parse(response);
            if ( isFirstAp ) {
                firstzoneId = result.accessPointInfo.zoneId.toLowerCase();
            }
            zoneId = result.accessPointInfo.zoneId.toLowerCase();
            apId = result.accessPointInfo.accessPointId;
            zoneNum = parseInt(zoneId.substring(4,6));
            drawSmallMap(zoneNum);
            drawZoneMap(zoneId);
            if( !isdrawDescMap ) {
                setDesc();
            }
            userEnter(zoneId, userId, apId);
            isdrawDescMap= true; 
        }      
    }

    var getAccessPointByIP = function(getApId) {
        return $.ajax({
            url:'/getAccessPointByIP',
            type:"post",
            data:{ "apid":getApId }
        })
    }
    var showAdvByGender = function(gender){
        var isman = 0;
        anotherzone = true;
        if(gender == "male") {
            isman = 1;
        }
        else {
            isman = 0;
        }
        $.ajax({
            url:'/getAdvByGender',
            data:{"isman":isman}
        })
        .done(handleAdvList)
    }
    var handleAdvList = function(response) {
        var advList = response.rows;

        if( !advList.length ) {
            
            $.ajax({
                url:'/getUserInfo',
                data:{"userid":userId}
            })
            .done(function(response){
                var gender = response.rows[0].gender;
                showAdvByGender(gender);

            })

        }
        else {
            $(".advModal").removeClass('fade').modal('hide');
            $(".advModal").remove();

            //for (var i = 0; i < advList.length; i++) {
            for (var i in advList) {
                var advImageSrc = "../image/" + advList[i].image;
                var advDesc = advList[i].description;
                var zoneid = advList[i].zoneid;
                var apid = advList[i].apid;
                $(".container").append(
                    '<div class="modal fade advModal" role="dialog">'+
                        '<div class="modal-dialog modal-center modal-sm">'+
                            '<div class="modal-content">'+
                                '<div class="modal-body">'+                
                                    '<h4 class=" text-center">'+
                                    '<span class="glyphicon glyphicon glyphicon-gift"> </span> '+
                                    zoneid+' 혜택 알림</h4>'+
                                    '<div class="text-center">'+
                                        '<img class="advImage" width="230" src='+advImageSrc+'>'+
                                        '<p class="productDesc">'+advDesc+'</p>'+
                                    '</div>'+                             
                                '</div>'+
                                '<div class="modal-footer">'+                     
                                    '<button type="button" class="closeModal btn btn-sm btn-default" data-dismiss="modal">닫기</button>'+
                                '</div>'+
                            '</div>'+    
                        '</div>'+
                    '</div>'
                );
                if( anotherzone ){

                    alertAdvZone(apid);
                }
            }
            $(".advModal").modal('show');         
       }

    }

    var getAdvByZone = function(zoneId) {
        return $.ajax({
            url : '/getAdvByZone',
            data : { "zoneid":zoneId }
        })
    }

    var getAdvByAP = function(apId) {
        return $.ajax({
            url : '/getAdvByAp',
            data : { "apid":apId }
        })
    }
    var getZoneByLookedForAp = function(lookedForAp){
        return $.ajax({
            url:"/getZoneByAP",
            data:{"apid":lookedForAp}
        })
    }

    $("#stopNavigation").on("click",function(){
        if (removeNavi) {
            removeNavi = false;
            alert("길 안내가 시작됩니다..")
            $("#stopNavigation").find('button').text("길 안내 중지")
        }
        else {
            removeNavi = true;
            alert("길 안내가 중지됩니다..");
            $("#stopNavigation").find('button').text("길 안내 시작")
        }
        
    })

    var setApId = function(response) {
        
        lookedForAp = response.lookedForApId; 
        if (lookedForAp) {
            console.log(lookedForAp)
            getZoneByLookedForAp(lookedForAp)
            .done(function(response){
                lookedForZone = response.rows[0].zoneid;
                lookedForLat = parseInt(response.rows[0].latitude);
                lookedForLon = parseInt(response.rows[0].longitude);
            })
            $("#stopNavigation").css("display","");
        }
        apId = response.apId;
    }

    var setFirstPosition = function(getApId,getZoneId) {
        firstapId = getApId;
        firstzoneId = getZoneId;
    }
    var getApId = function(testIp) {
       
        $.ajax({
            url:'/getInitApId',
            data:{ "test":testIp }
        })
        .done(setApId)
        .done(function() {
            if ( isFirstAp ) {
                firstapId = apId;
            }     
        })
        .done(function() {
            getAccessPointByIP(apId)
            .done(handleGetAccessPointByIP)
            .done(function() {

                if (firstapId === apId) {
                    //이동을 안했다..
                    if (!showAdvCount) {
                        getAdvByZone(firstzoneId)
                        .done(handleAdvList)
                    }
                    showAdvCount = 1;
                }
                else {
                    //이동을 했다..(ap가 달라졌다..!)
                    showAdvCount = 0; 
                    if( zoneId === firstzoneId) {
                        //같은 존 내에서 ap만 바뀐거다....
                        getAdvByAP(apId)
                        .done(handleAdvList)
                    }
                    else {
                        //다른 존으로 아예 이동을 했다..
                        $(".advModal").removeClass('fade').modal('hide');
                        $(".advModal").remove();
                        if ( !showAdvCount) {
                            getAdvByZone(zoneId)
                            .done(handleAdvList)
                        }
                        showAdvCount = 1;
                    }
                    setFirstPosition(apId,zoneId)
                }
                isFirstAp = false;
            });
        })
        .fail(function() {
            alert("fail to get ApId");
        })
    }
    var count=0;    
    var testIp="127.0.0.1";
    getApId(testIp);
    // setTimeout(function() {
    //     console.log('setTimeout')
    //     testIp = "192.168.1.105"
    // },8000)
    // setTimeout(function() {
    //     console.log('setTimeout')
    //     testIp = "127.0.0.2"
    // },8000)
    var getApIdTimer = setInterval(function() {
        
        if (count != 50) {
            getApId(testIp);  
            count++;
        }
        else {
            console.log("clear")
            clearInterval(getApIdTimer);
        }
    },2000)

});  


function setDesc() {

    var descArr = { "r":255, "g":0, "b":0, "a":0.6, "x":36, "y":20, "w":0, "h":0 };
    var textArr = { "text":"현재 AP", "x":15, "y":55 };
    drawDesc(descArr, textArr);
        
    descArr.r = 0, descArr.g = 97,
    descArr.b = 255, descArr.a = 0.6,
    descArr.x = 39, descArr.y = 100;
    textArr.text = "주변 AP", textArr.x = 15, textArr.y = 132;
    drawDesc(descArr, textArr);

    // descArr.r = 103, descArr.g = 160,
    // descArr.b = 252, descArr.a = 0.6,
    // descArr.x = 15, descArr.y = 110,
    // descArr.w = 23, descArr.h = 15;
    // textArr.text = "현재 위치", textArr.x = 0, textArr.y = 145;
    // drawDesc(descArr, textArr);
    
    // descArr.r = 255, descArr.g = 255,
    // descArr.b = 0, descArr.a = 0.6,
    // descArr.x = 15, descArr.y = 160,
    // descArr.w = 23, descArr.h = 15;
    // textArr.text = "광고 위치", textArr.x = 0, textArr.y = 195;
    // drawDesc(descArr, textArr);

}

function drawDesc(descArr, textArr) {
    var circle =  new Path2D();

    descCont.fillStyle = `rgba( ${descArr.r}, ${descArr.g}, ${descArr.b}, ${descArr.a} )`;
    if(descArr.w){
        descCont.fillRect(descArr.x, descArr.y, descArr.w, descArr.h);
    }
    else {
        circle.arc(descArr.x, descArr.y, 15, 0, 2 * Math.PI);
        descCont.fill(circle);
        descCont.stroke(circle);
    }

    descCont.font = '12px arial';
    descCont.fillStyle = 'black';
    descCont.fillText(textArr.text, textArr.x, textArr.y);
}

function drawCircle(getZoneid,lat, lon) {
    var circle =  new Path2D();
    if(getZoneid == "zone03"){
    
        circle.arc(lat, lon, 30, 0, 2 * Math.PI);
    }
    else {
        circle.arc(lat, lon, 34, 0, 2 * Math.PI);

    }
    dummyCont.fill(circle);
    dummyCont.stroke(circle);
}

function alertAdvZone (getAdvAp) {
    var zone_1 = [ "192.168.0.1","192.168.0.2","192.168.0.3" ];
    var zone_2 = [ "192.168.0.4","192.168.0.5","192.168.0.6","192.168.0.7" ];
    var zone_3 = [ "192.168.0.8","192.168.0.9","192.168.0.10","192.168.0.11" ];
    var rect_zone_1 = { x:1, y:158, width:93, height:100 };
    var rect_zone_2 = { x:94, y:158, width:97, height:226 };
    var rect_zone_3 = { x:94, y:58, width:97, height:100 };
    var rect = "";
    
    if ( zone_1.includes(getAdvAp)) {
        rect = rect_zone_1;
    }
    else if (zone_2.includes(getAdvAp)) {
        rect = rect_zone_2;
    }
    else{
        rect = rect_zone_3;
    }

    mapCont.fillStyle = 'rgba( 255, 255, 0, 0.3 )';
    mapCont.fillRect(rect.x, rect.y, rect.width, rect.height);

}

function drawRect(getzoneNum) {
    var rect_1 = { x:1, y:158, width:93, height:100 };
    var rect_2 = { x:94, y:158, width:97, height:226 };
    var rect_3 = { x:94, y:58, width:97, height:100 };
    var rect = eval('rect_' + getzoneNum);

    mapCont.fillStyle = 'rgba( 103, 160, 252, 0.3 )';
    mapCont.fillRect(rect.x, rect.y, rect.width, rect.height);
}
