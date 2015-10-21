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

/**
 * Constructor: initializes the object and declares its public interface
 *
 * @param string name: the name of the port (as known to the operating system)
 * @param object config: optional object containing configuration parameters:
 */
function AcnPort (name, options) {
  var me = this;

  // Initialize the state of this object instance
  me.name = name;

  // keep track of reconnection timers
  me.reconnectTimer = null;

  // The serial port object that is managed by this instance.
  // The port is not opened, just instantiated
  me.port = new serialPortFactory.SerialPort( name, {}, false );

  options.master.transport.connection.serialPort = me.port;

  // Create the MODBUS master using the supplied options
  me.master = Modbus.createMaster( options.master );

  // Hook event handlers for the serialport object
  // Often we pass them through to our client
  me.port.on('open', function() {

    me.emit('open');

  });

  me.port.on('close', function() {

    me.emit('close');

    // start a timer to retry opening the port
    me.reconnectTimer = setInterval( me.reconnect, 5000 );

  });

  me.port.on('error', function(err) {

    me.emit('error', err);
  });


}

// This object can emit events.  Note, the inherits
// call needs to be before .prototype. additions for some reason
util.inherits(AcnPort, EventEmitter);

/**
 * Open the serial port.  When complete, start processing requests
 */
AcnPort.prototype.open = function( callback ) {

  this.port.open( function(error) {


    // Notify the caller that the port is open
    if( 'function' === typeof( callback ) ) {
      callback( error );
    }
  });
};

/**
 * Attempt to reopen the port
 *
 */
AcnPort.prototype.reconnect = function() {

  var me = this;

  me.emit( 'reopening' );

  me.port.open(function (error) {
    if ( error ) {

    } else {
      clearInterval( me.reconnectTimer );
      me.reconnectTimer = null;

      me.emit('open');

    }
  });

};


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


AcnPort.prototype.getSlaveId = function( callback ) {

  this.master.reportSlaveId({
    onComplete: callback });

};

AcnPort.prototype.getDebug = function( callback ) {

  this.master.readFifo8( 0, 50, {
    onComplete: callback });

};

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

  this.master.readObject( 0, {
    onComplete: function(err,response) {
      if( err ) {
        callback( err );
      }
      else {

        // Check for an invalid/unprogrammed object
        if( response.values.length === 1 && response.values[0] === 0) {
          return callback( null, null );
        }
        else {
          chai.assert( response.values.length === 29,
            'Wrong response length for Factory object' );


          var mac = [];

          // Build a string array of the MAC address bytes
          for( var i = 0; i < 8; i++ ) {
            mac.push( me.zeroPad( response.values[i].toString(16), 2));
          }

          callback( null, {
            macAddress: mac.join(':'),
            serialNumber:
              response.values.slice(8,27).toString().replace(/\W/g, ''),
            productType: response.values[28]
          });
        }
      }
    }


  });

};

/**
 * Writes the factory configuration into the device NVRAM
 *
 * @param {Function} callback [description]
 */
AcnPort.prototype.setFactoryConfig = function( data, callback ) {

  // validate the data
  if( data.macAddress && data.serialNumber && data.hasOwnProperty('productType')) {

    var macbytes = data.macAddress.split(':');

    if( macbytes.length === 8 &&
      typeof(data.serialNumber) === 'string' &&
      data.productType >=0 &&
      data.productType < 256 ) {

      //var count = new Buffer([29]);
      var mac = new Buffer(8);
      var serial = new Buffer(Array(20));
      var product = new Buffer(1);

      for( var i = 0; i < 8; i++ ) {
        mac[i] = parseInt(macbytes[i],16);
      }

      // values appear valid
      var string = new Buffer( data.serialNumber.substr(0,20) );

      // copy serial number string into zero-filled buffer
      string.copy( serial );

      product[0] = data.productType;

      this.master.writeObject( 0, Buffer.concat([mac,serial,product]), {
        onComplete: function(err,response) {

          if( response.exceptionCode ) {
            // i'm not sure how to catch exception responses from the slave in a better way than this
            err = new Error( 'Exception ' + response.exceptionCode );
          }
          if( err ) {
            callback( err );
          }
          else {

            if( response.status !== 0 ) {
              callback( new Error('Failed to write factory config'));
            }
            else {
              // success!
              callback( null );
            }

          }
        },
        onError: function( err ) {
          callback( err );
        }

      });
    }
    else {
      callback( new Error('Invalid data for factory config'));
    }

  }
  else {
    callback( new Error('Invalid object for factory config'));
  }

};

/**
 * Gets object 0 (Network ID)
 *
 * @param  {Function} callback (err, response)
 */
AcnPort.prototype.getNetworkStatus = function( callback ) {

  var me = this;

  this.master.readObject( 2, {
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
          shortAddress: me.zeroPad(
            response.values.readUInt16LE(0).toString(16), 4),
          parent: response.values[2],
          panId: me.zeroPad( response.values.readUInt16LE(3).toString(16), 4),
          currentChannel: response.values[5],
        } );
      }
    }


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

