/* Credits: tuloski */

var https = require('https');
var Remote = require('ripple-lib').Remote;
var Amount = require('ripple-lib').Amount;

var remote = new Remote({
  // see the API Reference for available options
  servers: ['wss://s-west.ripple.com:443', 'wss://s1.ripple.com:443'],
  max_fee: 12000,
  fee_cushion: 1.2
});

var BITSTAMP = 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B';



var bitstamp_orderbook;
var ripple_orderbooks = [2];      //bid and ask
var counter_ripple = 0;
var counter_print = 0;
var limit_offers_orderbook = 10;

remote.connect(function() {
	console.log('Connected to Ripple');
    loop();
});

function loop(){
	get_orderbook();
	//get_ticker();
	counter_ripple++;
	counter_print++;
	if (counter_ripple >= 2){     
		counter_ripple = 0;
		read_orderbook('BTC', BITSTAMP, 'USD', BITSTAMP);
	}
	if (counter_print >= 6){
		counter_print = 0;
		console.log("Ripple BID: " + 1/parseFloat(ripple_orderbooks[1].offers[0].quality) + " ASK: " + parseFloat(ripple_orderbooks[0].offers[0].quality) + " - Bitstamp BID: " + bitstamp_orderbook.bids[0][0] + " ASK: " + bitstamp_orderbook.asks[0][0]);
	}
    setTimeout(loop, 2000);
}




/*------------BITSTAMP FUNCTIONS----------*/

function get_ticker(){
	https.get('https://www.bitstamp.net/api/ticker/', function(res) {
		//console.log("statusCode: ", res.statusCode);
		//console.log("headers: ", res.headers);
		var body = "";

		res.on('data', function(d) {
			body += d;
			//process.stdout.write(d);
		});
		res.on('end', function() {
			console.log("Ticker: ", body);
		});

	}).on('error', function(e) {
		//console.error(e);
	});
}


function get_orderbook(){
	https.get('https://www.bitstamp.net/api/order_book/', function(res) {
		//console.log("statusCode: ", res.statusCode);
		//console.log("headers: ", res.headers);
		var body = "";

		res.on('data', function(d) {
			body += d;
			//process.stdout.write(d);
		});
		res.on('end', function() {
			bitstamp_orderbook = JSON.parse(body);
		});

	}).on('error', function(e) {
		//console.error(e);
	});
}

function get_transactions(){
	https.get('https://www.bitstamp.net/api/transactions/', function(res) {
		//console.log("statusCode: ", res.statusCode);
		//console.log("headers: ", res.headers);
		var body = "";

		res.on('data', function(d) {
			body += d;
			//process.stdout.write(d);
		});
		res.on('end', function() {
			console.log("Transactions: ", body);
		});

	}).on('error', function(e) {
		console.error(e);
	});
}

/*---------------RIPPLE FUNCTIONS------------*/

function read_orderbook(currency2sell, issuer2sell, currency2buy, issuer2buy){
    if (issuer2sell == 'XRP'){
        issuer2sell = '';      //XRP doesn't need issuer
    }
    if (issuer2buy == 'XRP'){
        issuer2buy = '';    //XRP doesn't need issuer
    }
    var book_request = remote.request('book_offers',{          //request first part of book
		taker_gets: {
			'currency': currency2sell,
			'issuer' : issuer2sell
    	},
		taker_pays: {
			'currency' : currency2buy,
			'issuer' : issuer2buy
    	},
		limit: limit_offers_orderbook
    });

    book_request.request(function(err, book) {
		if (err){
		    console.log('Error in requesting book offers' + JSON.stringify(err))
		}
		else{
		    ripple_orderbooks[0] = book;
		}
    });

	var book_request = remote.request('book_offers',{   //request second part of book
		taker_gets: {
			'currency': currency2buy,
			'issuer' : issuer2buy
		},
		taker_pays: {
			'currency' : currency2sell,
			'issuer' : issuer2sell
		},
		limit: limit_offers_orderbook
    });

    book_request.request(function(err, book) {
		if (err){
		    console.log('Error in requesting book offers' + JSON.stringify(err))
		}
    	else{
        	ripple_orderbooks[1] = book;
    	}
    });
}
