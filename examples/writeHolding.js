#!/usr/bin/env node
/**
 * Example/demo for Control Solutions Advanced Control Network interface package
 *
 * Run the demo from the command line.  The port settings in the config.json
 * file will be used to connect to the ACN device and execute the command
 *
 */
'use strict';

// get application path
var path = require('path');

// console text formatting
var chalk = require('chalk');

// command-line options
var args = require('minimist')(process.argv.slice(2));

// Configuration defaults
var config = require('./config');

// Load the object that handles communication to the device
var AcnPort = require('../acn-port');

// use environment variable for port name if specified
config.port.name = process.env.MODBUS_PORT || config.port.name;

if( args.h ) {
  console.info( '\r--------ACN ' + path.basename(__filename, '.js') +
  ': ' + config.port.name + '----------');
  console.info( 'Writes a holding register to the device\r');
  console.info( 'Usage: <address> <value>\r');
  console.info( '<address> starting address of register\r');
  console.info( '<value> decimal value\r');
  process.exit(0);
}

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
    process.exit(0);
  }
}

var port = new AcnPort( config.port.name, config );

// Attach event handler for the port opening
port.on( 'open', function () {
  port.master.writeSingleRegister( args._[0], args._[1], output );
});

// port errors
port.on('error', function( err ) {
  console.error( chalk.underline.bold( err.message ));
});

// Hook events for verbose output
if( args.v ) {


  var connection = port.master.getConnection();

  connection.on('open', function()
  {
    console.log( chalk.green('[connection#open]'));
  });

  connection.on('close', function()
  {
    console.log(chalk.green('[connection#close]'));
  });

  connection.on('error', function(err)
  {
    console.log(chalk.red('Error: ', '[connection#error] ' + err.message));
  });

  connection.on('write', function(data)
  {
    console.log(chalk.green('[connection#write] ' + data.toString()));
  });

  connection.on('data', function(data)
  {
    console.log(chalk.green('[connection#data] ' + data.toString()));
  });
}

// Open the port
// the 'open' event is triggered when complete
port.open();


