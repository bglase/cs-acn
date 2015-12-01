/**
 * Test script to verify MODBUS communication to ACN module
 *
 * This script checks basic read/non-destructive write tests for the MODBUS
 * functions
 *
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
    done();
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
  done();
});

beforeEach(function( done ) {
  // runs before each test in this block
  done();
});

afterEach(function( done ) {
  // runs after each test in this block
  done();
});

describe('Report Slave Id', function() {

  it('should report the slave id', function(done) {

    port.getSlaveId( function( err, response ) {

      expect( err ).to.equal( null );
      expect( response ).to.be.an( 'object');

      done();
    });

  });

});

describe('Read Object', function() {

  it('should read factory config', function(done) {


    port.getFactoryConfig( function output( err, response ) {

      expect( err ).to.equal( null );
      expect( response ).to.be.an( 'object');

      expect( response.macAddress ).to.be.a('string');
      expect( response.macAddress.split(':').length).to.equal(8);

      expect( response.serialNumber ).to.be.a('string');
      expect( response.serialNumber ).to.have.length.of.at.least(1);

      expect( response.productType ).to.equal(2);

      done();
    });
  });

  it('should read user config', function(done) {

    port.getUserConfig( function output( err, response ) {

      expect( err ).to.equal( null );
      expect( response ).to.be.an( 'object');

      done();
    });

  });

});



describe('Write Object', function() {


});

describe('Read Holding Register', function() {


});

describe('Write Holding Register', function() {


});



