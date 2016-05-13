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

// Load the object that handles communication to the device
var map = require('./lib/Map');

// override config file port name if necessary
config.port.name = args.port || process.env.MODBUS_PORT || config.port.name;

// override slave id if necessary
config.master.defaultUnit = args.slave ||
  process.env.MODBUS_SLAVE || config.master.defaultUnit;

/**
 * Parses a string into a number with bounds check
 *
 * String can be decimal, or if it starts with 0x
 * it is interpreted as hex
 *
 * @param  {[string]} s       string to parse
 * @param  {[number]} default if string can't be parsed
 * @return {[number]}         the parsed number or the default
 */
function parseNumber( s, def )
{
  var number;

  if( 'undefined' === typeof( s )) {
    return def;
  }

  if( s.toString().substring(0,1) === '0x') {
    number = parseInt(s.substring(2), 16);
  }
  else {
    number = parseInt(s);
  }
  return number;

}

/**
 * Convert an array of args to an array of numbers
 *
 * Parses 0x as hex numbers, else decimal
 * @param  {[array]} args  string array
 * @param  {[number]} start offset in args to start parsing
 * @return {[array]}       array of numbers
 */
function argsToByteBuf( args, start ){

  var values = [];

  for( var i = start; i< args.length; i++ ) {
    var number;

    if( args[i].toString().substring(0,1) === '0x') {
      number = parseInt(args[i].substring(2), 16);
    }
    else {
      number = parseInt(args[i]);
    }

    if( number < 0 || number > 255 ) {
      console.error( chalk.red('Invalid data value: ' + args[i] ));
        exit(1);
    }
    values.push(number);
  }

  return new Buffer(values);

}

/**
 * Cleanup and terminate the process
 *
 * @param  {[type]} code [description]
 * @return {[type]}      [description]
 */
function exit(code ) {
  port.destroy();
  process.exit(code);
}

if( args.h ) {
  console.info( '\r--------ACN Utility: ' + config.port.name + '----------');
  console.info( 'Reads or writes from an ACN device\r');
  console.info( '\rCommand format:\r');
  console.info(
    path.basename(__filename, '.js') + '[-h -v] action [type] [...]\r');
  console.info( '    action:\r');
  console.info( chalk.bold('        read') + '  item\r');
  console.info( chalk.bold('        write') + ' item [value]\r');
  console.info( chalk.bold('        scan') + '  [noise|active] [duration]\r');
  console.info(
    chalk.bold('        slaveId') + ': Report Identity information\r');
  console.info( chalk.bold('        reset') + '  : Reset the device\r');
  console.info( chalk.bold('        clear') + '  : clear network pairing\r');
  console.info( chalk.bold('        pair') + '   : Initiate Pairing\r');
  console.info(
    chalk.bold('        ping') + ' [address]  : Ping remote station\r');
  console.info( chalk.underline('Items for read/write:\r'));
  Object.keys(map).forEach(function (key) {
    console.info( chalk.bold(key) );
  });
  console.info( chalk.underline( '\rOptions\r'));
  console.info( '    -h          This help output\r');
  console.info( '    -l          List all ports on the system\r');
  console.info( '    -v          Verbose output (for debugging)\r');
  console.info( '    --port      Specify serial port to use\r');
  console.info( '    --loop      Run the command continuously\r');
  console.info(
    '    --slave     Specify MODBUS slave ID to communicate with\r');
  console.info( chalk.underline( '\rResult\r'));
  console.info( 'Return value is 0 if successful\r');
  console.info( 'Output may be directed to a file\r');
  console.info( '    e.g. ' +
    chalk.dim('acn read config >> myConfig.json') + '\r');


  process.exit(0);
}


function onSuccess() {
  // On success, if looping do it again.  otherwise exit
  if( args.loop ) {
    setImmediate( doAction );
  }
  else {
    exit( 0 );
  }
}

function doAction(){

  var type;

  // Now do the action that was requested
  switch( action ) {

    case 'read':
      // Validate what we are supposed to get
      type = args._[1] || 'unknown';
        port.read( map[type] )
          .then(function(output) {
            console.log( map[type].title + ': ', output.format() );
            onSuccess();
          })
          .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'write':
      // Validate what we are supposed to get
      type = args._[1] || 'unknown';
      var value = args._[2];

        port.write( map[type], value )
          .then(function() {
            console.log( map[type].title + ' written to ',
              map[type].format() );
            onSuccess();
          })
          .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'scan':
      // Validate what we are supposed to get
      switch(args._[1] ) {
        case 'active': type = 2; break;
        case 'both': type = 3; break;
        case 'noise':
        default:
          type = 1;
          break;
      }

      var duration = args._[2];

        port.scan( type, duration )
          .then(function(result) {
            console.log( 'Scan Result: ', result );
            onSuccess();
          })
          .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'slaveId':
      port.getSlaveId()
        .then(function(output) { console.log(output);})
        .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'reset':
      port.reset()
        .then(function(d) { console.log( 'Result: ' + d);onSuccess();})
        .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'clear':
      port.clear()
        .then(function(d) { console.log( 'Result: ' + d); onSuccess();})
        .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'pair':
      port.pair()
        .then(function(d) { console.log( 'Result: ' + d); onSuccess(); })
        .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'command':
      if( port.commands.indexOf( args._[1] ) < 0 ) {
        console.error(chalk.red( 'Unknown Command ' + action ));
        exit(1);
      }

      var buf = argsToByteBuf( args._, 2 );

      port.command( args._[1], buf )
        .then(function(response) {
          console.log(response.toString());
          
        })
        .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'ping':

      port.ping( parseNumber(args._[1], 0) )
        .then(function(response) { console.log(response); onSuccess(); })
        .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'unlock':

      port.unlock()
        .then(function(response) { console.log(response);  onSuccess(); })
        .catch( function(e) { console.log( e); exit(1); } );
      break;

    case 'factory':
      port.getFactoryConfig()
        .then(function(response) { console.log(response); onSuccess(); })
        .catch( function(e) { console.log( e); exit(1); } );
      break;


    default:
      console.error( chalk.underline.bold( 'Unknown Command' ));
      exit(1);
      break;
  }

}



// Check for the list ports option
if( args.l ) {

  var port = new AcnPort( config.port.name, config );

  // Retrieve a list of all ports detected on the system
  port.list(function (err, ports) {

    if( err ) {
      console.error( err );
    }

    if( ports ) {
      // ports is now an array of port descriptions.
      ports.forEach(function(port) {

        // print each port description
        console.log(port.comName +
        ' : ' + port.pnpId + ' : ' + port.manufacturer );

      });
    }

    process.exit(0);

  });

}
else {



  // Check the action argument for validity
  var action = args._[0];

  var port = new AcnPort( config.port.name, config );

  // Attach event handler for the port opening
  port.master.once( 'connected', doAction );

  // port errors
  port.on('error', function( err ) {
    console.error( chalk.underline.bold( err.message ));
    exit(1);
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
      exit(1);
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
        console.log(chalk.green('[connection#data] %d ' ),data.length, data );
      }
    });

  }



  if( args.v ) {
    console.log( 'Opening ' + config.port.name );
  }

  // Open the port
  // the 'open' event is triggered when complete
  port.open(function(err) {
    if( err ) {
      console.log(err);
      exit(1);
    }
  });

}
