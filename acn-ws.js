var http = require('http');
var ws = require('nodejs-websocket');
var fs = require('fs');

// Load the object that handles communication to the device
var AcnPort = require('./acn-port');

// Load the object that handles communication to the device
var map = require('./lib/Map');

// command-line options will be available in the args variable
var args = require('minimist')(process.argv.slice(2));

// Module which manages the serial port
var serialPortFactory = require('serialport');


// Configuration defaults
var config = require('./config');


var SOCKET_PORT = 8081
var HTTP_PORT = 8080

// use environment variable for port name if specified
config.port.name = args.port || process.env.MODBUS_PORT || config.port.name;

// override slave id if necessary
config.master.defaultUnit = args.slave || process.env.MODBUS_SLAVE || config.master.defaultUnit;


var port = new AcnPort( config.port.name, config );




/**
 * Clean up and exit the application.
 *
 * @param  {[type]} code [description]
 * @return {[type]}      [description]
 */
function exit(code) {
  try {
    port.destroy();
  }
  catch(e) {
  }
  process.exit(code);
}

function handleMsg(parse, connection){
  switch(parse.action){

    case "reportSlaveId":
      port.getSlaveId()
        .then(function(output) { connection.sendText(output.toString()); })
        .catch( function(e) { connection.sendText(e.toString()); } );
      break;

    case "command":
        port.command( 'scan', new Buffer([1, 9]))
          .then(function(output) { connection.sendText(output.toString()); })
          .catch( function(e) { connection.sendText(e.toString()); } );
      break;

    case "write":
        port.write( map[parse.item], parse.value )
          .then(function(output) { connection.sendText(JSON.stringify(output).format()); })
          .catch( function(e) { connection.sendText(e.toString()); } );
      break;

    case "read":
        port.read( map[parse.item] )
          .then(function(output) { connection.sendText( JSON.stringify(output.format())); })
          .catch( function(e) { connection.sendText(e.toString()); } );
      break;

    case "scan":
        port.scan( parse.type, parse.duration )
          .then(function(output) { connection.sendText( JSON.stringify(output)); })
          .catch( function(e) { connection.sendText(e.toString()); } );
      break;

    case 'reset':
      port.reset()
        .then(function() { var e = new Error( 'MyError'); connection.sendText( JSON.stringify(e));})
        .catch( function(e) { connection.sendText(e.toString()); } );
      break;

    default:
      connection.sendText( '{"error": "Invalid Action" }' );
      break;
  }
}


// Serve up a sample page to use the socket
http.createServer(function (req, res) {
  fs.createReadStream("index.html").pipe(res)
}).listen(HTTP_PORT)


// Start the socket server
var server = ws.createServer(function (connection) {

  if( connection && connection.headers && connection.headers.origin ) {
    connection.nickname = connection.headers.origin;
  }
  else {
    connection.nickname = 'Unknown';
  }

  console.log( 'Connect: ', connection.nickname );

  connection.on("text", function (str) {
    try{
      var parse = JSON.parse(str);
      console.log(parse)
      handleMsg(parse, connection)
    }
    catch(e){
      console.log(e);
    }
  })

  connection.on("close", function () {

    console.log( 'Disconnect: ', connection.nickname );

  })
});

server.once('listening', function() {
  console.log( 'Socket server listening on port ' + SOCKET_PORT );
})

// The socket server listens on this port
server.listen(SOCKET_PORT);

// Attach event handler for the port opening
  port.once( 'connected', function () {

    console.log('MODBUS port Open');
});

// Open the modbus port
port.open(function(err) {
  if( err ) {
    console.log(err);
    exit(1);
  }
});


