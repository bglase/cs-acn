#!/usr/bin/env node
/**
 * Example/demo for Control Solutions Advanced Control Network interface package
 *
 * Run the demo from the command line, using 'node demo.js'.
 * You must have an ACN controller connected to your PC via USB.
 * The demo will open the first available ACN device it finds, and
 * execute some commands to demonstrate usage of the device.
 *
 */
'use strict';

// get application path
var path = require('path');

// console text formatting
var chalk = require('chalk');

// get the app info from package.json
var pkg = require( path.join(__dirname, '../package.json') );

// command-line options
var program = require('commander');

program
  .version(pkg.version)
  .option('-p, --port <port>', 'Port index on which to listen (defaults to first found)', parseInt)
  .parse(process.argv);

var serialPortIndex = program.port || 0;


// Load the object that handles communication to the device
var portFactory = require('../acn-port');


/**
 * If error, print it and exit the application
 * @param  {err}
 * @return null
 */
function handleError( err ) {
  if( err ) {
    console.log( chalk.red( err.message ) );
    process.exit(1);
  }

}

console.log( chalk.blue.bold('--------ACN Port Demo----------'));
console.log( 'Press CTRL-C to exit' );


// Find all available ACN device ports
portFactory.list( function ( err, list ) {

  handleError( err );

  // print the name of each port found
  console.log( chalk.underline.bold( 'ACN Ports Detected'));

    // Display ACN Ports found
  for( var i = 0; i < list.length; i++ ) {
	if( list[i].vendorId === '0x04d8' && list[i].productId === '0x000a' )
    		console.log( chalk.bold( i + ': ' + list[i].comName) );
	else 
  		console.log( i + ': ' + list[i].comName );
   }

  if( list.length > serialPortIndex )
  {
    var port = new portFactory.AcnPort( list[serialPortIndex].comName );

    // Attach event handler for the port opening
    port.port.on( 'open', function () {
      console.log( chalk.green('Port ' + this.path + ' opened' ));

      var getNetId = new Buffer(9);
      var transaction = 0;
      getNetId.writeUInt16LE( transaction, 0 ); // transId
      getNetId.writeUInt16LE( 0x0, 2 ); // protocol
      getNetId.writeUInt16LE( 3, 4 ); // length

      var mpacket = new Buffer([1,66,1]);

      mpacket.copy(getNetId, 6);
      this.write(getNetId);

    });

    // catch port disconnected events
    port.port.on('disconnected', function() {
      console.log( chalk.underline.bold( this.path + ' disconnected'));
    });

    // port errors
    port.port.on('error', function( err ) {
      console.log( chalk.underline.bold( this.path + ' error: ', err.message ));
    });

    // Open the port
    // the 'open' event is triggered when complete
    port.port.open();

  }
  else {
    console.log( chalk.red( 'Error: port ' + serialPortIndex + ' not found'));
  }

  console.log('------------------');


});



