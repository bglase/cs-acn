#!/usr/bin/env node
/**
 * Factory Init script for CS ACN modules
 *
 * This file loads the factory configuration into an attached
 * ACN module.
 *
 */
'use strict';

// get application path
var path = require('path');

// console text formatting
var chalk = require('chalk');

// parse the command-line options
var args = require('minimist')(process.argv.slice(2));

// Configuration defaults
var config = require('./config');

// Load the object that handles communication to the device
var AcnPort = require('./acn-port');

// Load the object that handles communication to the device
var map = require('./lib/Map');

// use environment variables if specified
config.port.name = args.port || process.env.MODBUS_PORT || config.port.name;
config.port.name = process.env.MODBUS_PORT || config.port.name;

config.master.defaultUnit = args.slave || 1;

if( args.h ) {
  console.info( '\r--------ACN Factory Init Utility: ' +
    config.port.name + '----------');
  console.info( 'Initializes factory settings.\r');
  console.info( '\rCommand format:\r');
  console.info( path.basename(__filename, '.js') +
    '[-h] serialNumber product\r');
  console.info( 'where ' + chalk.bold('serialNumber') +
    ' is the serial number to program into the device\r');
  console.info( 'and ' + chalk.bold('product') +
    ' is the product type (0-255)\r');

  console.info( chalk.underline( '\rOptions\r'));
  console.info( '    -h      This help output\r');
  console.info( '    --port  Uses specified serial port instead of default\r');
  console.info( '    --slave Uses specific slave ID instead of default\r');
  console.info( chalk.underline( '\rResult\r'));
  console.info( 'Return value is 0 if successful\r');

  process.exit(0);
}

//-------------------------------------//---------------------------------------------
// Parse the serial number entered as a command line argument
var serial;
var product;

if( !args._[0] ) {
  console.error( 'Serial number not specified');
  process.exit(1);
}
else {
  serial = parseInt( args._[0] );

  if( serial < 1 || serial >  2147483647) {
    console.error( 'serial number must be a number between 1 and 2147483647');
    process.exit(1);
  }

}

//-------------------------------------//---------------------------------------------
// Parse the product id entered as a command line argument
// Parse the serial number entered as a command line argument
var serial;

if( !args._[1] ) {
  console.error( 'Product ID not specified');
  process.exit(1);
}
else {
  product = parseInt( args._[1] );

  if( product < 0 || product >  255) {
    console.error( 'product ID must be a number between 0 and 255');
    process.exit(1);
  }

}



//-------------------------------------//---------------------------------------------
// Use the serial number to create a MAC address for the radio interface

// Note: for MAC reservations, see Control Solutions document DOC0003872A
//
var MAC = new Buffer([0xE4, 0xA3, 0x87, 0x00, 0x00, 0x00, 0x00, 0x00]);
MAC.writeUInt32BE( serial, 4 );

// Define the Factory config object to be loaded
var factory = {
  macAddress: MAC,
  serialNumber: serial,
  productType: product
};

// Define the default user config object to be loaded

var userConfig = {
  modbusSlaveId: 1,
  channelMap: 0xFFFF,
  msBetweenStatusTx: 10000,
  powerOffSec: 0,
  networkFormation: 0,
  pairingTimeout: 10,
  switchDefaults: 0
};

// Start up the serial interface using the configured serial port name
var port = new AcnPort( config.port.name, config );

//port.master.once( 'connected', function () {

//console.log( chalk.bold('Looking for device...') );

port.open()
  // Pull the current identification from the slave
  .then( function() { console.log( chalk.bold('Looking for device...') ); })
  .then( function() { return port.getSlaveId(); })
  .then( function( id ) { console.log( id.toString() ); })

  // Program the factory configuration
  .then( function() { console.log( chalk.bold('Writing configuration...') ); })
  .then( function() { return port.unlock(); })
  .then( function() { return port.setFactoryConfig( factory ); })

  // Program user configuration
  .then( function() { return port.write( map.config, userConfig ); })
  //.then( function() { return port.command( 'save' ); })

  // Save the user config to the default
  .then( function() { console.log( chalk.bold('Resetting - wait...') ); })
  .then( function() { return port.command('reset'); })
  .delay( 5000 )

  // Read back the config just to be sure
  .then( function() { console.log(
    chalk.bold('Verifying Configuration...') ); })
  .then( function() { return port.unlock(); })
  .then( function() { return port.getFactoryConfig(); })
  .then( function( f ) {
    var status = chalk.red('FAIL:');
    if( f.macAddress === port.macToString( factory.macAddress, 0, 8 )) {
      status = chalk.green('OK  :');
    }

    console.log( '%s MAC: %s, Serial: %d, Product ID: %d',
      status,
      f.macAddress,
      f.serialNumber,
      f.productType );
  })
  .error(function(e){console.log(chalk.red('Error: ' + e)); })
  .catch(function(e){console.log(chalk.red( '' + e)); })
  .finally( function() { process.exit(0); } );


// port errors
port.on('error', function( err ) {
  console.error( chalk.underline.bold( err.message ));
  process.exit(1);
});

port.on('connected', function() { console.log('connected');});

if( args.v ) {

  // catch events for verbose mode (debug output)
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
    process.exit(1);
  });

  connection.on('write', function(data)
  {
      console.log(chalk.green('[connection#write] '), data );
  });

  connection.on('data', function(data)
  {
      console.log(chalk.green('[connection#data] ' ), data );
  });
}

