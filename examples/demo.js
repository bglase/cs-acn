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

// Configuration defaults
var config = require('./config');

// Load the object that handles communication to the device
var AcnPort = require('../acn-port');

// use environment variable for port name if specified
config.port.name = process.env.MODBUS_PORT || config.port.name;

// Define the command line option parser
program
  .version(pkg.version)
  //.option('-p, --port <port>', 'Port index on which to listen (defaults to first found)', parseInt)
  .parse(process.argv);


/**
 * If error, print it, otherwise print the result
 * @param  {err}
 * @return null
 */
function output( err, response ) {
  if( err ) {
    console.log( chalk.red( err.message ) );
    process.exit(1);
  }
  else {
    console.log(response);
  }

}

console.log( chalk.blue.bold('--------ACN Port Demo----------'));
console.log( 'Press CTRL-C to exit' );

var port = new AcnPort( config.port.name, config );

port.master.on('error', function( err ) {
  console.log( chalk.underline.bold( this.path + ' master error: ', err.message ));
});

// Attach event handler for the port opening
port.on( 'open', function () {
  console.log( chalk.green('Port ' + config.port.name + ' opened' ));

  port.getSlaveId( output );

  port.getFactoryConfig( output );

/*
  port.master.readCoils( 0, 1, {
    onComplete: function(err, response ) {

      console.log( response );
    } });

 // port.getNetworkStatus( output );

  port.setFactoryConfig({
    macAddress: '00:01:02:03:04:05:06:07',
    serialNumber: 'A001',
    productType: 2
  }, function( err, response ) {
    if( err ) {
      console.log( err );
    }
    else {
      // now query it
      console.log( response );
     port.getFactoryConfig( output );

    }

  } );


  port.getDebug( function(err, result ) {
    if( result.values ) {
      console.log( 'Debug: ' + result.values.toString());
    }
  } );
*/

});

// port errors
port.on('error', function( err ) {
  console.log( chalk.underline.bold( this.path + ' error: ', err.message ));
});

var connection = port.master.getConnection();

connection.on('open', function()
{
  console.log('[connection#open]');
});

connection.on('close', function()
{
  console.log('[connection#close]');
});

connection.on('error', function(err)
{
  console.log('[connection#error] %s', err.message);
});

connection.on('write', function(data)
{
  console.log('[connection#write]', data.toString());
});

connection.on('data', function(data)
{
  console.log('[connection#data] %d %s', data.length, data.toString());
});


// Open the port
// the 'open' event is triggered when complete
port.open();






console.log('------------------');



