/**
 * Test script to verify MODBUS communication to ACN module
 *
 * This script checks basic read/non-destructive write tests for the MODBUS
 * functions
 *
 */
'use strict';

// Configuration defaults
var config = require('../config');

// Load the object that handles communication to the device
var AcnPort = require('../acn-port');

// Load the object that handles communication to the device
var map = require('../lib/Map');

// Test helpers
var assert = require('chai').assert;
var expect = require('chai').expect;

// use environment variable for port name if specified
config.port.name = process.env.MODBUS_PORT || config.port.name;

// Create interface to the device
var port = new AcnPort( config.port.name, config );

// enable extra debug output
var debug = false;

/**
 * Pre-test
 *
 * Runs once, before all tests in this block.
 * Calling the done() callback tells mocha to proceed with tests
 *
 */
before(function( done ) {

  //-------------------- DEBUGGING OUTPUT --------------------------------//
  var connection = port.master.getConnection();

  if( debug ) {
    connection.on('open', function(){
      console.info( '[connection#open]');
    });

    connection.on('close', function(){
      console.info('[connection#close]');
    });

    connection.on('error', function(err){
      console.error('Error: ', '[connection#error] ' + err.message);
    });

    connection.on('write', function(data){
        console.info('[TX] ', data );
    });

    connection.on('data', function(data){
        console.info('[RX] ',data );
    });
  }
  //---------------------------------------------------------------------//


  // Catch the port open event. When it occurs we are done with this
  // function and we are ready to run tests
  port.master.once( 'connected', function() {

    done();

  });

  // Catch port errors (like trying to open a port that doesn't exist)
  port.on('error', function() {
    throw new Error('Error opening serial port. Check config.json');
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

    port.getSlaveId()
    .then( function( response ) {

      
      expect( response ).to.be.an( 'object');
      expect( response.fault ).to.equal( 'None');
      expect( response.run ).to.equal( 255 );
      expect( response.version ).to.be.a('string');
      expect( response.productType ).to.be.a('string');
      assert.include( [ 1,2], response.product );
      

      done();
    })
    .catch( function( err ) {
      throw( err );
    });

  });

});

describe('Read Object', function() {

  it('should read factory config', function(done) {

    // Special unlock command to allow factory config to be accessed
    port.unlock()

    .then( function() { return port.getFactoryConfig(); })
    .then( function( response ) {
      expect( response ).to.be.an( 'object');

      expect( response.macAddress ).to.be.a('string');
      expect( response.macAddress.split(':').length).to.equal(8);

      expect( response.serialNumber ).to.be.a('number');

      assert.include( [1,2], response.productType );

      done();
    })
    .catch( function( err ) {
      throw( err );
    });

  });

  it('should read user config', function(done) {

    port.read( map.config )
    .then( function( response ) {

      expect( response ).to.be.an( 'object');

      done();
    })
    .catch( function( err ) {
      throw( err );
    });


  });

});



describe('Write Object', function() {


});

describe('Read Holding Register', function() {


});

describe('Write Holding Register', function() {


});



