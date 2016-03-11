'use strict';
/**
 * Implements a web/websocket server interface to an ACN device
 *
 *
 *
 */

// Web server component
var http = require('http');

// File system
var fs = require('fs');

// Utility library
var _ = require('underscore');

// Load the object that handles communication to the device
var AcnPort = require('./acn-port');

// Register map for the ACN device
var map = require('./lib/Map');

// command-line options will be available in the args variable
var args = require('minimist')(process.argv.slice(2));

// Configuration defaults
var config = require('./config');

// Default status (initialization value)
var resetStatus = {
  slaveId: {},
  networkStatus: {},
  scanResult: {},
  connectionTable: {},
  coordStatus: {},
  bank1: {},
  config: {},
};

// Keep track of the most recent device status
var last = resetStatus;

// Whether we should keep polling the device
var polling = false;


// use environment variable for port name if specified
config.port.name = args.port || process.env.MODBUS_PORT || config.port.name;

// override slave id if necessary
config.master.defaultUnit = args.slave ||
  process.env.MODBUS_SLAVE ||
  config.master.defaultUnit;

// override web port if necessary
config.ws.httpPort = args.http || config.ws.httpPort;

// Create the device interface
var port = new AcnPort( config.port.name, config );


// Create a webserver to supply the HTML page
var app = http.createServer(function (req, res) {
  fs.createReadStream('index.html').pipe(res);
});

// Attach the websocket handler to the HTTP server
var io = require('socket.io')(app);

// Start the webserver
app.listen(config.ws.httpPort, function() {
  console.log('Server listening on http://localhost:' + config.ws.httpPort);
});

/**
 * Sends a full set of status.
 *
 * If a socket is specified, send only to that socket
 * Otherwise send to all connected sockets
 *
 * @return {[type]} [description]
 */
function emitLast( socket ) {

  if( 'undefined' === typeof( socket )) {
    socket = io;
  }

  socket.emit( 'device-connect', last.slaveId );
  socket.emit( 'networkStatus', last.networkStatus );
  socket.emit( 'scanResult', last.scanResult );
  socket.emit( 'connectionTable', last.connectionTable );
  socket.emit( 'coordStatus', last.coordStatus );
  socket.emit( 'status', last.bank1 );
  socket.emit( 'config', last.config );

}

/**
 * Read out all the basic identifying information about the device,
 * and update socket clients if anything has changed.
 *
 */
function inspectDevice() {

    // Network status
  port.read( map.networkStatus )
    .then( function( result ) {
      if( !_.isEqual(result.value, last.networkStatus ) ) {
        last.networkStatus = result.value;
        io.emit( 'networkStatus', last.networkStatus );
        //console.log( result.value );
      }
    })

    // ActiveScan results
    .then( function() { return port.read( map.scanResult ); })
    .then( function( result ) {
      if( !_.isEqual(result.value, last.scanResult ) ) {
        last.scanResult = result.value;
        io.emit( 'scanResult', last.scanResult );
      //console.log( result.value );
      }
    })

    // Connection Table
    .then( function() { return port.read( map.connectionTable ); })
    .then( function( result ) {
      if( !_.isEqual(result.value, last.connectionTable ) ) {
        last.connectionTable = result.value;
        io.emit( 'connectionTable', last.connectionTable );
      //console.log( result.value );
      }
    })

    // Coordinator status
    .then( function() { return port.read( map.coordStatus ); })
    .then( function( result ) {
      last.coordStatus = result.value;
      io.emit( 'coordStatus', last.coordStatus );
      //console.log( result.value );
    })
    .catch( function() { } );

}


// When a web page opens a socket connection
io.on('connection', function(socket){

  emitLast( socket );
  console.log('Socket ' + socket.id + ' connected');


  /**
   * When a socket client emits a command message
   */
  socket.on('command', function( msg, fn) {

    console.log( 'Command from ' + socket.id + ': ' + msg.action );

    switch(msg.action){

      case 'write':
          port.write( map[msg.item], msg.value )
            .then(function(output) { fn(output.format() ); })
            .catch( function(e) { fn(e); } );
        break;

      case 'read':
          port.read( map[msg.item] )
            .then(function(output) { fn(output.format() ); })
            .catch( function(e) { fn(e); } );
        break;

      case 'scan':
          port.scan( msg.type, msg.duration )
            .then(function(output) { fn(output.format() ); })
            .catch( function(e) { fn(e); } );
        break;

      case 'reset':
        port.reset()
          .finally( function() { fn(true); } );
        break;

      case 'clear':
        port.clear()
          .then( function() { inspectDevice(); } )
          .finally( function() { fn(true); } );
        break;

      case 'pair':
        port.pair()
          .then( function() { inspectDevice(); } )
          .finally( function() { fn(true); } );
        break;

      default:
        fn( new Error('Unknown Action') );
        break;
    }

  });
});


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


/**
 * Requests status information from the device.
 *
 * Emits it to all socket clients if it changes
 *
 * Polls continuously unless the global 'polling' boolean is false
 *
 */
function pollDevice() {

  port.read( map.bank1 )
    .then( function(result ) {
      var status = result.format();

      if( !_.isEqual(status, last.bank1) ) {
        last.bank1 = status;
        io.emit( 'status', status );
      }


    })
    .then( function() { return port.read( map.sensorData ); })
    .then( function( result ) {
      var msg = result.format();
      //console.log(msg);
      if( msg.msgtype > 0 ) {
        io.emit( 'sensorData', msg );
      }
    })
    .catch(function(e){ console.log(e); })
    .finally( function() { if( polling ) { setImmediate(pollDevice); } } );

}

var inspectTimer = null;

/**
 * Initiate polling of the ACN device
 *
 */
function startPollingDevice() {


  // Device slaveId
  port.getSlaveId()
    .then( function(id) {
      if( !_.isEqual(id, last.slaveId) ) {
        last.slaveId = id;
        io.emit( 'device-connect', last.slaveId );
      }
    })
    .then( function() { return port.read(map.config); })
    .then( function(config) {
      var result = config.format();

      if( !_.isEqual(result, last.config ) ) {
        last.config = result;
        io.emit( 'config', last.config );
      }

    })
    .catch( function(e) {
      console.error('error starting polling', e);
    });



  inspectTimer = setInterval( inspectDevice, 10000);


  polling = true;

  pollDevice();
}

/**
 * Quit polling the ACN device
 * Note: we don't try to cancel outstanding requests, just
 * don't restart the polling loop when finished.
 */
function stopPollingDevice() {
  polling = false;
  if( inspectTimer ) {
    clearInterval( inspectTimer );
    inspectTimer = null;
  }
}




/**
 * When the device serial port is opened...
 *
 */
port.on( 'connected', function () {

    console.log('MODBUS port Connected');
    startPollingDevice();

});

/**
 * When the device serial port is closed...
 *
 */
port.on( 'disconnected', function() {

  last = resetStatus;

  emitLast();

  console.log('MODBUS port Disconnected');

  stopPollingDevice();

});


// Open the modbus port
port.open(function(err) {
  if( err ) {
    console.log(err);
    exit(1);
  }
});


