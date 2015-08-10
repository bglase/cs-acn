/**
 * Entry point for Control Solutions Node.js package
 *
 * This file exposes the API for communicating via serial port to
 * CS's Adaptive Control Network products.
 *
 */

/*jslint node: true */
'use strict';

// Packet contains MODBUS traffic
var HOST_PROTOCOL_MODBUS = 0;

// Packet contains debug console traffic
var HOST_PROTOCOL_CONSOLE = 1;

// Packet contains a wireless network message
var HOST_PROTOCOL_NET = 2;


function decodeProtocol( p ) {
  switch( p ) {
    case HOST_PROTOCOL_MODBUS: return 'Modbus';
    case HOST_PROTOCOL_CONSOLE: return 'Console';
    case HOST_PROTOCOL_NET: return 'Net';
    default: return 'Unknown';
  }
}




// unique ID for modbus messages
var transaction = 0;


var chalk = require('chalk');

var chai = require('chai');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var serialPortFactory = require('serialPort');

function AcnPort( name )
{
    this.port = new serialPortFactory.SerialPort(name, {}, false);

    /**
     * The main receive event for the serial port
     */
    this.port.on('data', function(data) {

      // check for valid header
      if( data.length >= 6) {

        var transId = data.readUInt16LE( 0 );
        var protocol = data.readUInt16LE( 2 );
        var len = data.readUInt16LE( 4 );
        var offset = 6;

        console.log( chalk.blue( 'Trans: ' + transId + ' Prot: ' + decodeProtocol(protocol) + ' len: ' + len ));
        console.log( data );

        switch( protocol )
        {
          case HOST_PROTOCOL_MODBUS:
            transaction++;
            //getNetId.writeUInt16LE( transaction, 0, false ); // transId
            console.log( chalk.cyan( 'Modbus: ' + data[1] ));
            break;

          case HOST_PROTOCOL_CONSOLE:
            process.stdout.write( chalk.green( data.toString('ascii', 6) ));
            break;

          case HOST_PROTOCOL_NET:
            var message = {
              serialNo:  data.readUInt16LE( offset + 0 ),
              productId: data.readUInt16LE( offset + 2 ),
              fwRev:      data.readUInt16LE( offset + 4 ),
              hours:      data[offset + 6],
              lowBatt:    data[offset + 7],
              overtemps:  data[offset + 8],
              throttleFaults: data[offset + 9],
              nofloats:   data[offset + 10],

              faultCode:   data[offset + 11],
              //faultLog: offset + 12 - 27

              batteryVolts: data[offset + 28 ],

            };

            message.faultLog = new Buffer(16);
            data.copy( message.faultLog, 0, offset+12, offset+27 );
            console.log( chalk.yellow( 'Hello: ' + message.serialNo ));
            console.log( message );
            break;


            default:
              console.log( chalk.red( 'Unknown protocol ' + protocol ));
        }

      }
      else {
        console.log( chalk.red( 'Incoming header too short: ' + data.length ));
      }
  });




    this.get = function( item, cb ) {

      console.log( 'Getting ' + item );
    };

    //this.open = this.port.open;
}


function PortManager()
{
    var manager = this;


    /**
     * Find all ACN serial ports in the system
     * @param  {Function} cb [callback; receives an array of port details]
     * @return {[type]}      [Nothing]
     */
    manager.list = function( cb ) {
      if( cb ) {

        serialPortFactory.list( function (err, ports) {
          console.log(ports);
          if( !err ) {
            ports = ports.filter(function (el) {
              return el.vendorId === '0x04d8' &&
                     el.productId === '0x000a';
            });
          }

          cb( err, ports );
        });
      }
    };


    manager.AcnPort = AcnPort;
    //factory.SerialPort = SerialPort;
    //manager.usePorts = function( portArray )
    //{
    //  openPort( portArray[0]);
    //};

}

/**
 * Sets the port(s) that the manager should open, and keep open.
 *
 * The manager will attempt to open and initialize the ports
 * supplied in the portArray.
 * If they close (eg disconnected USB cord) the manager will
 * watch them and try to reopen
 * the port if they become available again.
 * Calling this function again updates the set of open ports and
 * cleans up any changes to the list.
 *
 * @param portArray array of strings corresponding to the O/S device names
 */
//PortManager.prototype.usePorts = function( portArray )
//{
//  openPort( portArray[0]);
//};


//Open a port, hook its events
function openPort(portName)
{

  console.log('opening ' + portName);

  var port = new serialPortFactory.SerialPort (portName, null, false);

  //var data = new Buffer("hello");
  var sendDataIntervalId;

  port.on('disconnected', function()
  {
    clearInterval(sendDataIntervalId);
    console.log('disconnected');

    var intervalId = setInterval(function ()
    {
      reconnect(portName, intervalId);
    }, 2000 );

  });

  port.on('error', function(err) {
    chai.assert.fail('no error', err, util.inspect(err));
  });

  port.on('data', function(d) {
    //chai.assert.equal(data.toString(), d.toString(), 'incorrect data received');
    //process.stdout.write('r'); // data properly received
  });

  port.on('open', function() {
    console.log('opened');

    //sendDataIntervalId = setInterval(function () {
    //  process.stdout.write('s'); // sending data
    //  port.write(data);
    //}, 200 );

  });

  port.on('close', function() {

      clearInterval(sendDataIntervalId);
      console.log('closed');

    });

    port.open();
}

function reconnect(portName, intervalId)
{
    serialPortFactory.list(function(err, ports) {

      chai.assert.isUndefined(err, util.inspect(err));
      chai.assert.isDefined(ports, 'ports is not defined');

      if (ports.length > 0 && portName === ports.slice(-1)[0].comName) {
        clearInterval(intervalId);
        openPort(portName);
      } else {
        console.log('Port ' + portName + ' not found, retrying...');
      }

    });
}





util.inherits(AcnPort, EventEmitter);

module.exports = new PortManager();