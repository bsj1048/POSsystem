var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var url = require('url');
var path = require('path');
var ejs = require('ejs');
var mysql = require('mysql')

// pos라는 DB 비밀번호 1234로 mysql 연결
var connection = mysql.createConnection({
	host:'localhost',
	port:3306,
	user:'root',
	password:'1234',
	database:'pos',
	dateStrings: 'date' 
})

// mysql 연결 도중 에러 출력
connection.connect(function(err){
	if( err ){
		console.log("mysql connection error")
		console.log(err)
		throw err;
	}
})

var consolemsg = "[REST SERVER] - ";
var request = require('request');

var zoneId = "";
var apId = "";

var lookedForApByUser  = "";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false }));

// DB에 상품 등록하는 함수 
// insert 질의문 사용
app.get('/insertProduct', function(request, response){	
	var idproduct = 0;
	var pname = request.query.pname;
	var pprice = request.query.pprice;

	var insertQuery = `insert into pos.product ( name, price) values ( '${pname}', '${pprice}')`;
	
	connection.query( insertQuery, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{
			// 완료시 던질 메시지
			response.send("success")
		}
	});
})

// 결제 내역 추가 - 1
// 이 테이블은 기간, 테이블 번호, 결제방법, 카드번호를 가짐
app.get('/insertPayment', function(request, response){	

	var paydate = request.query.paydate;
	var idtable = request.query.idtable;
	var paymentoption = request.query.paymentoption;
	var cardnum = request.query.cardnum;
	
	if(cardnum === ""){
		cardnum = "0";
	}
	var insertQuery1 = `insert into pos.payment ( paydate, idtable, paymentoption,cardnum) values ( '${paydate}', '${idtable}','${paymentoption}','${cardnum}')`;
	
	connection.query( insertQuery1, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{
			response.send("success")
		}
	});
})

// 결제 내역 추가 - 2
// 이 테이블은 상품명 수량 상품수량에 따른 가격을 가짐 1과 JOIN해서 사용
app.get('/insertPaymentProduct', function(request, response){	

	var product = request.query.product;
	var total = request.query.total;
	var count = request.query.count;
	
	var selectQuery = `SELECT id FROM pos.payment order by id desc limit 1 `;
	
	connection.query( selectQuery, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{

			var tempId = row[0].id;
			var insertQuery2 = `insert into pos.paymentproduct ( paymentid, product, productcount, producttotal) values ( '${tempId}', '${product}','${count}','${total}')`;

			connection.query ( insertQuery2, function( err, row, fields ){
				if( err ) {
					done();
					return console.error( 'error running query', err);
				}
				else{
					response.send("success");
				}
			});
		}
	});
})

// 테이블 번호에 따른 주문 내역 등록
app.get('/insertOrderbyTable', function(request, response){	
	var idtable = request.query.tableid;
	var name = request.query.pname;
	var count = request.query.pcount;
	var price = request.query.pprice;

	console.log(idtable + " " + name + " " + count + " " + price);
	var insertQuery = `insert into pos.order (idtable, pname, pcount, pprice) values ( '${idtable}', '${name}', '${count}', '${price}')`;
	
	connection.query( insertQuery, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{

			response.send("success")
		}
	});
})

// 상품 내역 가져오는 함수
// select 질의문 사용
app.get('/getProduct', function(request, response){	
	var selectQuery = `select * from pos.product`;
	connection.query( selectQuery, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{
			response.json(row)
		}
	});
})

// 위에서 언급한 결제 내역 1,2를 JOIN하여 던져주는 함수
app.get('/getPaymentDetail', function(request, response){	
	var selectQuery = `SELECT payment.*,group_concat(paymentproduct.product) as product ,sum(paymentproduct.producttotal) as total FROM pos.payment,pos.paymentproduct where payment.id = paymentproduct.paymentid group by payment.id ;`;
	connection.query( selectQuery, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{
			response.json(row)
		}
	});
})

// 매출 관리에서 사용하는 함수
app.get('/getSalesInfo', function(request, response){	
	var selectQuery1 = `SELECT pos.paymentproduct.product, sum(productcount) as totalcount, sum(producttotal) as totalprice FROM pos.paymentproduct group by product;`;
	connection.query( selectQuery1, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{
			response.json(row)
		}
	});
})

// 테이블 번호에 따른 주문 내역을 가져오는 함수
app.get('/getOrderbyTable', function(request, response){
	var idtable = request.query.tableid;
	var selectQuery = `select * from pos.order where idtable = '${idtable}'`;
	connection.query( selectQuery, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{
			response.json(row)
		}
	});
})

// 테이블 번호에 따른 주문 내용을 DB에서 제거하는 함수
app.get('/deleteOrderbyTable', function(request, response){
	var idtable = request.query.tableid;
	var selectQuery = `delete from pos.order where idtable = '${idtable}'`;
	console.log(idtable)
	connection.query( selectQuery, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{
			response.send("success");
		}
	});
})

// 결제 내역 1,2를 받아오는 결제 내역 ID에 따라 제거하는 함수
app.get('/deletePaymentAll', function(request, response){
	var paymentid = request.query.paymentid;
	var deleteQuery = `DELETE pos.payment, pos.paymentproduct FROM pos.payment inner join pos.paymentproduct on payment.id = paymentproduct.paymentid WHERE payment.id = ${paymentid}`;
	console.log(deleteQuery)
	connection.query( deleteQuery, function( err, row, fields ) {		 
		if ( err ) {
			done();
			return console.error( 'error running query', err );
		}	
		else{
			response.send("success");
		}
	});
})


// .ejs 사용가능하도록 반영
app.set('view engine','ejs');
app.set('views','./views')

// .ejs를 사용해 불러올 화면들에 대한 함수
app.get('/', function(request, response) {	
	response.render('main')
});

app.get('/main', function(request, response) {	
	response.render('main')
});

app.get('/business', function(request, response) {	
	response.render('business')
});

app.get('/order', function(request, response) {
	response.render('order',{idtable:request.query.tableid})
});


app.get('/paymentDetails', function(request, response) {	
	response.render('paymentDetails')
});

app.get('/productsManagement', function(request, response) {	
	response.render('productsManagement')
});

app.get('/salesManagement', function(request, response) {	
	response.render('salesManagement')
});


//경로 추가
app.use('/image', express.static(__dirname + '/image'));
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/fonts'));
app.use('/css', express.static(__dirname+ '/css'));
app.use('/js', express.static(__dirname+ '/js'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); 
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); 
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); 
app.use('/sweetalert', express.static(__dirname + '/node_modules/sweetalert/dist')); 

// 에러처리 
app.use(function(req, res, next) {
    throw new Error(req.url + ' not found'); // 404 에러
});
app.use(function (err, req, res, next){
    console.log(err);
    res.send(err.message);
});

process.on('uncaughtException', function (err) {
	//예상치 못한 예외 처리
	console.log('uncaughtException 발생 : ' + err);
});


function startRestServer(port) {
	app.listen(port);
	
}




/*
MODUTECH TEST===========================================================================================================================
*/
exports.startRestServer = startRestServer;
