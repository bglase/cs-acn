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

// Keep track of mode for output purposes
var isAscii = (config.master.transport.type === 'ascii');

// Load the object that handles communication to the device
var AcnPort = require('./acn-port');

// override config file port name if necessary
config.port.name = args.port || process.env.MODBUS_PORT || config.port.name;


if( args.h || args._.length < 2 ) {
  console.info( '\r--------ACN Utility: ' + config.port.name + '----------');
  console.info( 'Reads or writes from an ACN device\r');
  console.info( '\rCommand format:\r');
  console.info( path.basename(__filename, '.js') + '[-h -v] action [type] [...]\r');
  console.info( '    action: get/set/reset\r');
  console.info( '    type: what sort of item\r');
  console.info( chalk.bold('        factory') + ' configuration\r');
  console.info( chalk.bold('        user') + ' configuration\r');
  console.info( chalk.bold('        fifo') + ' data\r');
  console.info( '    id: the ID of the item\r');
  console.info( chalk.underline( '\rOptions\r'));
  console.info( '    -h          This help output\r');
  console.info( '    -v          Verbose output (for debugging)\r');
  console.info( chalk.underline( '\rResult\r'));
  console.info( 'Return value is 0 if successful\r');
  console.info( 'Output may be directed to a file\r');
  console.info( '    e.g. ' + chalk.dim('acn get factory >> myConfig.json') + '\r');


  process.exit(0);
}

console.log( args );

// Check the action argument for validity
var action = args._[0];
var type;

if( ['get', 'set', 'reset'].indexOf( action ) < 0 ) {
  console.error(chalk.red( 'Unknown Action ' + action + ' Requested'));
}


/**
 * If error, print it, otherwise print the result as an object dump
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

/**
 * If error, print it, otherwise print the result as a string
 * @param  {err}
 * @return null
 */
function outputText( err, response ) {
  if( err ) {
    console.log( chalk.red( err.message ) );
    process.exit(1);
  }
  else if( response.values ) {
    console.log(response.values.toString());
    process.exit(0);
  }
  else {
    console.log( chalk.red( 'No values returned' ) );
    process.exit(1);
  }
}

var port = new AcnPort( config.port.name, config );

// Attach event handler for the port opening
port.on( 'open', function () {

  // Now do the action that was requested
  switch( action ) {

    case 'get':
      // Validate what we are supposed to get
      var type = args._[1] || 'unknown';

      switch( type ) {
        case 'factory':
          port.getFactoryConfig( output );
          break;

        case 'user':
          port.getUserConfig( output );
          break;

        case 'net':
          port.getNetworkStatus( output );
          break;

        case 'scan':
          port.getScanResults( output );
          break;

        case 'connection':
          port.getConnections( output );
          break;

        case 'coord':
          port.getCoord( output );
          break;

        case 'debug':
          port.getDebug( outputText );
          break;

        default:
          console.error( chalk.red('Trying to get unknown item'));
          process.exit(1);
          break;
      }

      break;

    case 'set':
      // Validate what we are supposed to set
      var type = args._[1] || 'unknown';

      switch( type ) {
        case 'debug':
          port.master.writeFifo8( 0, new Buffer(250), {onComplete: output });
          break;
      }

      break;

    case 'reset':
      break;

    default:
      break;
  }

});

// port errors
port.on('error', function( err ) {
  console.error( chalk.underline.bold( err.message ));
  process.exit(1);
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
    process.exit(1);
  });

  connection.on('write', function(data)
  {
    if( isAscii ) {
      console.log(chalk.green('[connection#write] ' + data.toString()));
    }
    else {
      console.log(chalk.green('[connection#write] '), data );
    }


  });

  connection.on('data', function(data)
  {
    if( isAscii ) {
      console.log(chalk.green('[connection#data] ' + data.toString()));
    }
    else {
      console.log(chalk.green('[connection#data] ' ), data );
    }
  });

}

// Open the port
// the 'open' event is triggered when complete
port.open();


