#!/usr/bin/env node
/**
 * This is a serial port listener that outputs to the console.
 * It is not an ACN-specific utility, it is really for development/
 * debugging of a serial debug stream
 *
 */
'use strict';

// console text formatting
var chalk = require('chalk');

// command-line options
var program = require('commander');

// Module which manages the serial port
var serialPortFactory = require('serialport');


// Define the command line option parser
program
  .option('-p, --port <port>', 'Port on which to listen')
  .parse(process.argv);


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

console.log(
  chalk.blue.bold('--------Serial Monitor: ' + program.port + '----------'));
console.log( 'Press CTRL-C to exit' );

var port = new serialPortFactory.SerialPort( program.port, {baudrate: 19200 } );

// Attach event handler for the port opening
port.on( 'open', function () {
  console.log( chalk.green('Port ' + program.port + ' opened' ));
});


// Attach event handler for the port opening
port.on( 'data', function (data) {
  process.stdout.write( data.toString().replace('\r', '\r\n'));
});


// port errors
port.on('error', function( err ) {
  console.log( chalk.underline.bold( this.path + ' error: ', err.message ));
});


console.log('------------------');



