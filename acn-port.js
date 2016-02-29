/**
 * Entry point for Control Solutions Node.js package
 *
 * This file exposes the API for communicating via serial port to
 * CS's Adaptive Control Network products.
 *
 */

'use strict';


// built-in node utility module
var util = require('util');

// Node event emitter module
var EventEmitter = require('events').EventEmitter;

// Module which manages the serial port
var serialPortFactory = require('serialport');

// Include the MODBUS master
var Modbus = require('cs-modbus');

// assertion library
var chai = require('chai');

// Promise library
var Promise = require('bluebird');

// Extra Buffer handling stuff
var buffers = require('h5.buffers');


/**
 * Constructor: initializes the object and declares its public interface
 *
 * @param string name: the name of the port (as known to the operating system)
 * @param object config: optional object containing configuration parameters:
 */
function AcnPort (name, options) {
  var me = this;

  // for debugging
  Promise.longStackTraces();

  // Initialize the state of this object instance
  me.name = name;

  // keep track of reconnection timers
  me.reconnectTimer = null;

  // Modbus object IDs for this device
  me.object = {
    FACTORY           : 0,
    USER              : 1,
    NET_STATUS        : 2,
    SCAN_RESULT       : 3,
    CONNECTION_TABLE  : 4,
    COORD_STATUS      : 5
  };


  me.commands = [
  '',
  'reset',
  'save',
  'restore',
  'pair',
  'clear',
  'sendconn',
  'sendshort',
  'sendlong',
  'broadcast',
  'scan',
  'ping'
  ];

  // The serial port object that is managed by this instance.
  // The port is not opened, just instantiated
  me.port = new serialPortFactory.SerialPort( name, options.port.options, false );

  me.list = serialPortFactory.list;

  options.master.transport.connection.serialPort = me.port;

  // Create the MODBUS master using the supplied options
  me.master = Modbus.createMaster( options.master );

  // Catch an event if the port gets disconnected
  me.master.on( 'disconnected', function() {

    // FYI - the port object drops all listeners when it disconnects
    // but after the disconnected event, so they haven't been dropped at
    // this point.

    // let the port finish disconnecting, then work on reconnecting
    process.nextTick( function() { me.reconnect(); } );

  });
}

// This object can emit events.  Note, the inherits
// call needs to be before .prototype. additions for some reason
util.inherits(AcnPort, EventEmitter);

/**
 * Open the serial port.
 *
 * @returns {object} promise
 */
AcnPort.prototype.open = function() {
  var me = this;

  return new Promise(function(resolve, reject){

    me.master.once('connected', function() {
      resolve();
    });

    me.port.open( function(error) {

      if( error ) {
        reject( error );
      }

    });
  });
};

/**
 * Attempt to reopen the port
 *
 */
AcnPort.prototype.reconnect = function() {

  var me = this;

  // re-attach event hooks for the serial port
  me.master.connection.setUpSerialPort(me.port);

  // re-attach event hooks for the serial port
  me.master.setUpConnection();

  me.reconnectTimer = setInterval( function() {
   me.open()
    .then( function () {
      clearInterval( me.reconnectTimer );
      me.reconnectTimer = null;
    })
    .catch(function(e) {console.log(e);});
  }, 1000 );
};

/**
 * Converts a 16-bit short address into a string like 'A1B2'
 * @param  {Buffer} buffer buffer containing the bytes to format
 * @param  {number} offset offset into the buffer to start reading
 * @return {string}        a string containing the 16-bit hex value
 */
AcnPort.prototype.destroy = function() {

  this.port.close();
  this.master.destroy();

}

/**
 * Zero pads a number (on the left) to a specified length
 *
 * @param  {number} number the number to be padded
 * @param  {number} length number of digits to return
 * @return {string}        zero-padded number
 */
AcnPort.prototype.zeroPad = function( number, length ) {
  var pad = new Array(length + 1).join( '0' );

  return (pad+number).slice(-pad.length);
};


AcnPort.prototype.getSlaveId = function() {

  var me = this;

  return new Promise(function(resolve, reject){

    me.master.reportSlaveId({
      onComplete: function(err, response) {
        if( err ){
          reject( err );
        }
        else {
          resolve( response );
        }
      }
    });
  });

};


/**
 * Formats a buffer of bytes into a string like xx:yy:zz
 *
 * @param  Buffer buffer Contains the bytes to be formatted
 * @param  integer offset offset into the buffer to start reading
 * @param  integer length number of bytes to process
 * @return string a string like 'xx:yy:zz'
 */
AcnPort.prototype.macToString = function( buffer, offset, length ) {

  var mac = [];

  // Build a string array of the MAC address bytes
  for( var i = 0; i < length; i++ ) {
    mac.push( this.zeroPad( buffer[ offset + i].toString(16), 2));
  }

  return mac.join(':');
}

/**
 * Parses a string like 11:22:33:44:55:66:77:88 to a binary buffer
 *
 * @param  {[type]} mac [description]
 * @return {[type]}     [description]
 */
AcnPort.prototype.stringToMac = function( str ) {

  var macbytes = str.split(':');

  var mac = new Buffer(8);

  for( var i = 0; i < 8; i++ ) {
    mac[i] = parseInt(macbytes[i],16);
  }

  return mac;
}

/**
 * Converts a 16-bit short address into a string like 'A1B2'
 * @param  {Buffer} buffer buffer containing the bytes to format
 * @param  {number} offset offset into the buffer to start reading
 * @return {string}        a string containing the 16-bit hex value
 */
AcnPort.prototype.shortAddressToString = function( buffer, offset ) {
  return this.zeroPad( buffer.readUInt16LE(offset).toString(16), 4)
}


/**
 * Gets the factory configuration object.
 *
 * The factory configuration is stored in non-volatile memory.
 *
 * The callback's error parameter will be non-null (an Error instance)
 * if an error occurs while processing the command.
 *
 * If the command succeeds but the factory configuration is not
 * valid (eg has not yet been programmed), this function returns null
 * as the response argument of the callback.
 *
 * Otherwise( on success) the response contains:
 *   macAddress: string of 8 hex bytes separated by :
 *     example: 00:00:FF:FF:00:00:12:34
 *   serialNumber: alphanumeric string containing serial number
 *
 * @param  {Function} callback (err, response)
 */
AcnPort.prototype.getFactoryConfig = function( callback ) {

  var me = this;

  return new Promise(function(resolve, reject){

    me.master.readObject( me.object.FACTORY, {
      onComplete: function(err,response) {
        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }

        if( err ) {
          reject( err );
        }
        else {

          // Check for an invalid/unprogrammed object
          if( response.values.length === 1 && response.values[0] === 0) {
            resolve( null );
          }
          else {
            chai.assert( response.values.length === 20,
              'Wrong response length for Factory object (' + response.values.length + ')' );

            // read the mac address and make a string
            var mac = me.macToString( response.values, 0, 8 );

            resolve( {
              macAddress: mac,
              serialNumber: response.values.readUInt32BE(8),
              productType: response.values[12]
            });
          }
        }
      },
      onError: function( err ) {
        reject( err );
      }

    });

  });

};

/**
 * Writes the factory configuration into the device NVRAM
 *
 * @param {Function} callback [description]
 */
AcnPort.prototype.setFactoryConfig = function( data ) {

  var me = this;

  return new Promise(function(resolve, reject){

    // validate the data
    if( data.macAddress &&
        data.macAddress.length === 8 &&
        data.serialNumber &&
        data.serialNumber >= 0 &&
        data.serialNumber <= 4,294,967,295 &&
        data.hasOwnProperty('productType')) {

      var builder = new buffers.BufferBuilder();

      var reserve = new Buffer(7);
      reserve.fill(0);

      builder
        .pushBuffer( data.macAddress )
        .pushUInt32(data.serialNumber, false )
        .pushByte(data.productType)
        .pushBuffer(reserve);

      me.master.writeObject( me.object.FACTORY, builder.toBuffer(), {
        onComplete: function(err,response) {

          if( response && response.exceptionCode ) {
            // i'm not sure how to catch exception responses from the slave in a better way than this
            err = new Error( 'Exception ' + response.exceptionCode );
          }
          if( err ) {
            reject( err );
          }
          else {

            if( response.status !== 0 ) {
              reject( new Error('Failed to write factory config'));
            }
            else {
              // success!
              resolve( null );
            }

          }
        },
        onError: function( err ) {
          reject( err );
        }

      });
    }
    else {
      reject( new Error('Invalid data for factory config'));
    }
  });
};


/**
 * Gets object (Network ID)
 *
 * @param  {Function} callback (err, response)
 */
AcnPort.prototype.getNetworkStatus = function( callback ) {

  var me = this;

  this.master.readObject( me.object.NET_STATUS, {
    onComplete: function(err,response) {
      if( err ) {
        callback( err );
      }
      else {

        chai.assert( response.values.length === 6,
          'Wrong response length for NetworkStatus object' );

        //var mac = [];

        // Build a string array of the MAC address bytes
        //for( var i = 0; i < 8; i++ ) {
        //  mac.push( me.zeroPad( response.values[i].toString(16), 2));
        //}

        // return the result to the caller
        callback( null, {
          //longaddress: mac.join(':'),
          shortAddress: me.shortAddressToString(response.values, 0),
          parent: response.values[2],
          panId: me.shortAddressToString(response.values, 3),
          currentChannel: response.values[5],
        } );
      }
    }


  });

};

/**
 * Gets object
 *
 * @param  {Function} callback (err, response)
 */
AcnPort.prototype.getScanResults = function( callback ) {

  var me = this;

  this.master.readObject( me.object.SCAN_RESULT, {
    onComplete: function(err,response) {
      if( err ) {
        callback( err );
      }
      else {
        console.log(response.values);
        console.log(response.values.length);

        // these match the array definition in the ACN device
        var entrySize = 15;

        // length has to be a multiple of the entry size
        chai.assert( response.values.length % entrySize === 0,
          'Wrong response length for Scan  Results object' );

        var numEntries = parseInt(response.values.length / entrySize);

        var connections = [];

        for( var i = 0; i < numEntries; i++ ) {

          // decode the status byte
          var thebyte = response.values[i * entrySize + 13];
          var capability = {
            role: ( thebyte & 0x03 ),
            sleep: ( thebyte & 0x04 ) > 0,
            securityEnable: ( thebyte & 0x08 ) > 0,
            repeatEnable: ( thebyte & 0x10 ) > 0,
            allowJoin: ( thebyte & 0x20 ) > 0,
            direct: ( thebyte & 0x40 ) > 0,
            altSourceAddress: ( thebyte & 0x80 ) > 0,
          };

          var channel = response.values[i * entrySize + 0];

          if( channel < 255 && channel > 0 ) {

            // save the entry in an array
            connections.push( {
              channel: channel,
              address: me.macToString( response.values, 1, 8 ),
              panId: me.shortAddressToString( response.values, i * entrySize + 9),
              rssi: response.values[i * entrySize + 11],
              lqi: response.values[i * entrySize + 12],
              capability: capability,
              peerInfo: response.values[i * entrySize + 14]

            });
          }
        }

        // return the result to the caller
        callback( null, connections );
      }
    }


  });


};

/**
 * Gets object
 *
 * @param  {Function} callback (err, response)
 */
AcnPort.prototype.getConnections = function( callback ) {

  var me = this;

  this.master.readObject( me.object.CONNECTION_TABLE, {
    onComplete: function(err,response) {
      if( err ) {
        callback( err );
      }
      else {
        console.log(response.values);
        console.log(response.values.length);

        // these match the array definition in the ACN device
        var entrySize = 14;

        // length has to be a multiple of the entry size
        chai.assert( response.values.length % entrySize === 0,
          'Wrong response length for Connections object' );

        var numEntries = parseInt(response.values.length / entrySize);

        var connections = [];

        for( var i = 0; i < numEntries; i++ ) {

          // decode the status byte
          var statusByte = response.values[i * entrySize + 12];
          var status = {
            rxOnWhenIdle: ( statusByte & 0x01 ) > 0,
            directConnection: ( statusByte & 0x02 ) > 0,
            longAddressValid: ( statusByte & 0x04 ) > 0,
            shortAddressValid: ( statusByte & 0x08 ) > 0,
            finishJoin: ( statusByte & 0x10 ) > 0,
            isFamily: ( statusByte & 0x20 ) > 0,
            isValid: ( statusByte & 0x80 ) > 0,
          };

          if( status.isValid ) {

            // save the entry in an array
            connections.push( {
              panId: me.shortAddressToString( response.values, i * entrySize + 0),
              altAddress: me.shortAddressToString( response.values, i * entrySize + 2),
              address: me.macToString( response.values, 4, 8 ),
              status: status,
              extra: response.values[i * entrySize + 12],

            });
          }
        }

        // return the result to the caller
        callback( null, connections );
      }
    }


  });

};

/**
 * Gets object
 *
 * @param  {Function} callback (err, response)
 */
AcnPort.prototype.getCoord = function( callback ) {

  var me = this;

  this.master.readObject( me.object.COORD_STATUS, {
    onComplete: function(err,response) {
      if( err ) {
        callback( err );
      }
      else {
        console.log(response.values);

        // return the result to the caller
        callback( null, {
        } );
      }
    }


  });

};

/*
AcnPort.prototype.reset = function() {

  var me = this;

  return new Promise(function(resolve, reject){
    me.master.command( me.COMMAND.RESET, new Buffer(0),   {
      onComplete: function(err,response) {

        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }
        if( err ) {
          reject( err );
        }
        else {
          resolve( response );
        }
      },
      onError: function( err ) {
        reject( err );
      }
    });
  });
}
*/



/**
 * Sends a command to the slave
 *
 * @param {number} id command ID
 * @param {Buffer} data additional bytes to send
 *
 * @returns Promise instance that resolves when command is completed
 */
AcnPort.prototype.command = function( cmd, data ) {

  var me = this;

  return new Promise(function(resolve, reject){
    var id = me.commands.indexOf(cmd );

    me.master.command( id, data, {
      onComplete: function(err,response) {

        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }
        if( err ) {
          reject( err );
        }
        else {
          resolve( response );
        }
      },
      onError: function( err ) {
        reject( err );
      }
    });
  });
};

/**
 * Sends a command to the slave
 *
 * @param {number} id command ID
 * @param {Buffer} data additional bytes to send
 *
 * @returns Promise instance that resolves when command is completed
 */
AcnPort.prototype.unlock = function() {

  var me = this;

  return new Promise(function(resolve, reject){

    me.master.command( 255, new Buffer(0), {
      onComplete: function(err,response) {

        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }
        if( err ) {
          reject( err );
        }
        else {
          resolve( response );
        }
      },
      onError: function( err ) {
        reject( err );
      }
    });
  });
};

/**
 * Writes multiple values to the slave
 *
 * @param {number} id command ID
 * @param {Buffer} data additional bytes to send
 *
 * @returns Promise instance that resolves when command is completed
 */
AcnPort.prototype.setRegisters = function( address, values ) {

  var me = this;

  return new Promise(function(resolve, reject){

    var builder = new buffers.BufferBuilder();

    for( var i = 0; i < values.length; i++ ) {
      builder
        .pushUInt16( values[i] );
    }

    me.master.writeMultipleRegisters( address, builder.toBuffer(), {
      onComplete: function(err,response) {

        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }
        if( err ) {
          reject( err );
        }
        else {
          resolve( response );
        }
      },
      onError: function( err ) {
        reject( err );
      }
    });
  });
};


/**
 * Reads registers from the slave
 *
 * @param {object} items
  *
 * @returns Promise instance that resolves when command is completed
 */
AcnPort.prototype.read = function( item ) {

  var me = this;

  return new Promise(function(resolve, reject){

    var t1 = me.master.readHoldingRegisters( item.addr, item.length, {
      onComplete: function(err, response ) {

        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }
        if( err ) {
          reject( err );
        }
        else {
          item.fromBuffer( response.values );
          resolve( item );
        }
      },
      onError: function( err ) {
        reject( err );
      }
    });

  });
};

/**
 * Writes a Register item to the slave
 *
 * @param {object} item
 * @param {varies} value value to be written
  *
 * @returns Promise instance that resolves when command is completed
 */
AcnPort.prototype.write = function( item, value ) {

  var me = this;

  return new Promise(function(resolve, reject){

    item.unformat( value );

    var t1 = me.master.writeMultipleRegisters( item.addr, item.toBuffer(), {
      onComplete: function(err, response ) {

        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }
        if( err ) {
          reject( err );
        }
        else {
          resolve( true );
        }
      },
      onError: function( err ) {
        reject( err );
      }
    });

  });
};

/**
 * Performs a network scan and returns the result
 *
 * @param {number} type
 * @param {number} duration enumeration indicating amount of time to dwell on each channel
  *
 * @returns Promise instance that resolves when command is completed
 */
AcnPort.prototype.scan = function( type, duration ) {

  var me = this;

  return new Promise(function(resolve, reject){

    var id = me.commands.indexOf('scan' );

    var t1 = me.master.command( id, new Buffer([type, duration]), {
      onComplete: function(err, response ) {

        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }
        if( err ) {
          reject( err );
        }
        else {
          var values = new buffers.BufferReader( response.values );
          resolve( values.readBytes(0, values.length ) );
        }
      },
      onError: function( err ) {
        reject( err );
      }
    });

  });
};

/**
 * Commands the device to 'ping' another device to verify wireless communication
 *
 * @param {number} address the address to ping (16 bits)
 * @param {number} duration enumeration indicating amount of time to dwell on each channel
  *
 * @returns Promise instance that resolves when command is completed
 */
AcnPort.prototype.ping = function( address ) {

  var me = this;

  return new Promise(function(resolve, reject){

    var id = me.commands.indexOf('ping' );
    var parameters = new Buffer(2);

    parameters.writeUInt16BE( address );

    var t1 = me.master.command( id, parameters, {
      onComplete: function(err, response ) {

        if( response && response.exceptionCode ) {
          // i'm not sure how to catch exception responses from the slave in a better way than this
          err = new Error( 'Exception ' + response.exceptionCode );
        }
        if( err ) {
          reject( err );
        }
        else {

          var values = new buffers.BufferReader( response.values );
          if( values.length < 8 ) {
            resolve( {error: 'No Response'} );
          }
          else {
            var result = {
              rtt: values.readUInt32BE(0),
              fwd: {
                lqi: values[4],
                rssi: values[5]
              },
              rev: {
                lqi: values[6],
                rssi: values[7]
              },
            };
            resolve( result );
          }
        }
      },
      onError: function( err ) {
        reject( err );
      }
    });

  });
};


/**
 * Public interface to this module
 *
 * The object constructor is available to our client
 *
 * @ignore
 */
module.exports = AcnPort;

