/**
 * Test script to verify MODBUS interface to the USER configuration
 *
 * This script attempts to test the USER non-volatile configuration.
 * It attempts to save the existing configuration and restore it upon
 * test completion, but it is possible that certain error cases can prevent
 * restoration of the data
 */

// Configuration defaults
var config = require('../config');

// Load the object that handles communication to the device
var AcnPort = require('../acn-port');

// Load the object that handles communication to the device
var map = require('../lib/Map');

// Test helpers
var assert = require('assert');
var expect = require('chai').expect;

// use environment variable for port name if specified
config.port.name = process.env.MODBUS_PORT || config.port.name;

// Create interface to the device
var port = new AcnPort( config.port.name, config );

// keep track of the original config so we can restore it at the end
var originalConfig;

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

    // Read the configuration so we can restore it later
    port.read( map.config )
      .then( function (data ) {

        originalConfig = data.format();
      })
      .catch(function(e){ throw new Error(e); })
      .finally( function() { done(); } );

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

    // Restore the configuration
    port.write( map.config, originalConfig )
      .then( function (data ) {
      })
      .finally( function() { done(); } );

});

beforeEach(function( done ) {
  // runs before each test in this block
  done();
});

afterEach(function( done ) {
  // runs after each test in this block
  done();
});



describe('Configuration', function() {

  it('modbusSlaveId', function(done) {

    // Note we don't reset the slave, so the modbus ID change never is really implemented
    port.write( map.modbusSlaveId, 2 )
      .then( function () { return port.read( map.modbusSlaveId ); })
      .then( function (d ) { expect( d.value).to.equal(2); })
      .then( function () { return port.write( map.modbusSlaveId, 247 ); })
      .then( function () { return port.read( map.modbusSlaveId ); })
      .then( function (d ) { expect( d.value).to.equal(247); })
      .then( function () { return port.read( map.config ); })
      .then( function (d ) { expect( d.format().modbusSlaveId).to.equal(247); })
      .finally( function() { done(); });
  });

  it('channelMap', function(done) {
    port.write( map.channelMap, 0x0001 )
      .then( function (d ) { return port.read( map.channelMap ); })
      .then( function (d ) { expect( d.value).to.equal(1); })
      .then( function () { return port.write( map.channelMap, 0xFFFF ); })
      .then( function () { return port.read( map.channelMap ); })
      .then( function (d ) { expect( d.value).to.equal(0xFFFF); })
      .then( function () { return port.read( map.config ); })
      .then( function (d ) { expect( d.format().channelMap).to.equal('0xffff'); })
      .finally( function() { done(); });
  });

  it('msBetweenStatusTx', function(done) {
    port.write( map.msBetweenStatusTx, 0x0001 )
      .then( function (d ) { return port.read( map.msBetweenStatusTx ); })
      .then( function (d ) { expect( d.value).to.equal(1); })
      .then( function () { return port.write( map.msBetweenStatusTx, 0xFF ); })
      .then( function () { return port.read( map.msBetweenStatusTx ); })
      .then( function (d ) { expect( d.value).to.equal(0xFF); })
      .then( function () { return port.read( map.config ); })
      .then( function (d ) { expect( d.format().msBetweenStatusTx).to.equal(0xFF); })
      .finally( function() { done(); });
  });

  it('powerOffSec', function(done) {
    port.write( map.powerOffSec, 0x0001 )
      .then( function (d ) { return port.read( map.powerOffSec ); })
      .then( function (d ) { expect( d.value).to.equal(1); })
      .then( function () { return port.write( map.powerOffSec, 0xFFF ); })
      .then( function () { return port.read( map.powerOffSec ); })
      .then( function (d ) { expect( d.value).to.equal(0xFFF); })
      .then( function () { return port.read( map.config ); })
      .then( function (d ) { expect( d.format().powerOffSec).to.equal(0xFFF); })
      .finally( function() { done(); });
  });

  it('networkFormation', function(done) {
    port.write( map.networkFormation, 0x0001 )
      .then( function (d ) { return port.read( map.networkFormation ); })
      .then( function (d ) { expect( d.value).to.equal(1); })
      .then( function () { return port.write( map.networkFormation, 0x2 ); })
      .then( function () { return port.read( map.networkFormation ); })
      .then( function (d ) { expect( d.value).to.equal(0x2); })
      .then( function () { return port.read( map.config ); })
      .then( function (d ) { expect( d.format().networkFormation).to.equal(0x2); })
      .finally( function() { done(); });
  });

  it('pairingTimeout', function(done) {
    port.write( map.pairingTimeout, 0x0001 )
      .then( function (d ) { return port.read( map.pairingTimeout ); })
      .then( function (d ) { expect( d.value).to.equal(1); })
      .then( function () { return port.write( map.pairingTimeout, 0x10); })
      .then( function () { return port.read( map.pairingTimeout ); })
      .then( function (d ) { expect( d.value).to.equal(0x10); })
      .then( function () { return port.read( map.config ); })
      .then( function (d ) { expect( d.format().pairingTimeout).to.equal(0x10); })
      .finally( function() { done(); });
  });


});
