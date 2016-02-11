/**
 * Test script to verify MODBUS interface to the USER configuration object
 *
 * This script attempts to test the USER non-volatile configuration.
 * It attempts to save the existing configuration and restore it upon
 * test completion, but it is possible that certain error cases can prevent
 * restoration of the data
 */

// Configuration defaults
var config = require('./config');

// Load the object that handles communication to the device
var AcnPort = require('../acn-port');

// Test helpers
var assert = require('assert');
var expect = require('chai').expect;

// use environment variable for port name if specified
config.port.name = process.env.MODBUS_PORT || config.port.name;

// Create interface to the device
var port = new AcnPort( config.port.name, config );

var originalConfig;


/**
 * Pre-test
 *
 * Runs once, before all tests in this block.
 * Calling the done() callback tells mocha to proceed with tests
 *
 */
before(function( done ) {

  // Catch the port open event. When it occurs we are done with this
  // function and we are ready to run tests
  port.on('open', function() {

    // Read the configuration so we can restore it later
    port.getUserConfig( function ( err, response ) {
      originalConfig = response;

      // finished with this init
      done();
    });

  });

  // Catch port errors (like trying to open a port that doesn't exist)
  port.on('error', function() {
    throw new Error('Error opening serial port. Check config.json');
    done();
  });

  // Open the serial port
  port.open();

});

after(function( done ) {
  // runs after all tests in this block

  // Restore the configuration if possible
  if( originalConfig ) {
    port.setUserConfig( originalConfig, function ( err, response ) {
      if( err ) {
        console.log('Failed to restore the USER config');
      }

      // finished with this init
      done();
    });
  }
  else {
    console.log( 'No User config to restore at end of test');
    done();
  }
});

beforeEach(function( done ) {
  // runs before each test in this block
  done();
});

afterEach(function( done ) {
  // runs after each test in this block
  done();
});



describe('Set Network Mode', function() {

  it('should read user config', function(done) {

    port.getUserConfig( function output( err, response ) {

      expect( err ).to.equal( null );
      expect( response ).to.be.an( 'object');

      done();
    });

  });

});
