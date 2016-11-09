/**
 * Test script to verify WAN (MiWi RF network) operation
 *
 * This script makes changes to USER non-volatile configuration.
 * It attempts to save the existing configuration and restore it upon
 * test completion, but it is possible that certain error cases can prevent
 * restoration of the data
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

// keep track of the original config so we can restore it at the end
var originalConfig = null;

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
  });

  // Open the serial port
  port.open();

});

after(function( done ) {
  // runs after all tests in this block

    if( originalConfig !== null ) {
      // Restore the configuration
      port.write( map.config, originalConfig )
        .then( function ( ) {
        })
        .finally( function() { done(); } );
    }
    else {
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



describe('Channel Selection', function() {

  it('Zero available channels', function(done) {

    this.timeout(5000);

    // Set the unit to have no available channels
    // it should never pick a channel other than FF (which is
    // not a channel )
    port.write( map.channelMap, 0x0000 )
    .then( function (d ) { return port.read( map.channelMap ); })
    .then( function (d ) { expect( d.value).to.equal(0); })
    .then( function (d ) { return port.scan( 1, 9 ); })
    .then( function (d ) { 
      // chosen channel should be the one we specified
      expect( d[0]).to.equal( 0xFF ); 
    })
    .then( function (d ) { return port.scan( 2, 9 ); })
    .then( function (d ) { 
      // chosen channel should be the one we specified
      expect( d[0]).to.equal( 0xFF ); 
    })
    
    .then( function (d ) { return port.scan( 3, 9 ); })
    .then( function (d ) { 
      expect( d[0]).to.equal( 0xFF ); 
    })
    .then( function (d ) { return port.scan( 4, 9 ); })
    .then( function (d ) { 
      // since we didn't do
      // any scan types we should get the only available channel
      expect( d[0]).to.equal( 0xFF ); 
    })

    .then( function () { return port.write( map.networkFormation, 1 ); })
    .then( function () { return port.clear(); })

    .then( function (d ) { 
      // expect a success indicator
      expect( d ).to.equal( 0 ); 
    })
    .then( function () { return port.read( map.networkStatus ); })
    .then( function (d ) { 
      d = d.format();
      // d.currentChannel isn't tested; it is irrelevant in IDLE mode
      expect( d.shortAddress).to.equal( 'ffff' );
      expect( d.panId ).to.equal( 'ffff' ); 
    })
    .then( function () { return port.read( map.systemState ); })
    .then( function (d ) { 
      d = d.format();
      expect( d ).to.equal( 'Idle' );
    })

    .finally( function() { done(); });
  });

  it('One available channel', function(done) {

    this.timeout(5000);

    // Set the unit to only allow one channel
    port.write( map.channelMap, 0x0001 )
    .then( function (d ) { return port.read( map.channelMap ); })
    .then( function (d ) { expect( d.value).to.equal(1); })
    .then( function (d ) { return port.scan( 1, 9 ); })
    .then( function (d ) { 
      // chosen channel should be the one we specified
      expect( d[0]).to.equal(11); 
    })
    .then( function (d ) { return port.scan( 2, 9 ); })
    .then( function (d ) { 
      // chosen channel should be the one we specified
      expect( d[0]).to.equal(11); 
    })
    
    .then( function (d ) { return port.scan( 3, 9 ); })
    .then( function (d ) { 
      // chosen channel should be the one we specified
      expect( d[0]).to.equal(11); 
    })
    .then( function (d ) { return port.scan( 4, 9 ); })
    .then( function (d ) { 
      // since we didn't do
      // any scan types we should get the only available channel
      expect( d[0]).to.equal( 11 ); 
    })

    .finally( function() { done(); });
  });

  it('Two available channels', function(done) {

    this.timeout(10000);

    // Set the unit to only allow one channel
    port.write( map.channelMap, 0x8001 )
    .then( function (d ) { return port.read( map.channelMap ); })
    .then( function (d ) { expect( d.value).to.equal(0x8001); })
    .then( function (d ) { return port.scan( 1, 9 ); })
    .then( function (d ) { 
      // chosen channel should be one we specified
      assert.include([ 11, 26 ], d[0] ); 
    })
    .then( function (d ) { return port.scan( 2, 9 ); })
    .then( function (d ) { 
      // chosen channel should be one we specified
      assert.include([ 11, 26 ], d[0] ); 
    })
    
    .then( function (d ) { return port.scan( 3, 9 ); })
    .then( function (d ) { 
      // chosen channel should be one we specified
      assert.include([ 11, 26 ], d[0] ); 
    })
    .then( function (d ) { return port.scan( 4, 9 ); })
    .then( function (d ) { 
      // since we didn't do
      // any scan types we should get one or the other
      assert.include([ 11, 26 ], d[0] ); 
    })

    .finally( function() { done(); });
  });

  it('All available channels', function(done) {

    this.timeout(10000);

    // Set the unit to only allow one channel
    port.write( map.channelMap, 0xFFFF )
    .then( function (d ) { return port.read( map.channelMap ); })
    .then( function (d ) { expect( d.value).to.equal(0xFFFF); })
    .then( function (d ) { return port.scan( 1, 9 ); })
    .then( function (d ) { 
      expect( d.length).to.equal(17);
      assert.notInclude( d, 255 );
    })

    .finally( function() { done(); });
  });

  it('Force Network on channel', function(done) {

    this.timeout(10000);

    // only enable channel 12
    port.write( map.channelMap, 0x0002 )
    .then( function () { return port.write( map.networkFormation, 1 ); })
    .then( function () { return port.clear(); })

    .then( function (d ) { 
      // expect a success indicator
      expect( d ).to.equal( 0 ); 
    })
    .then( function () { return port.read( map.networkStatus ); })
    .then( function (d ) { 
      d = d.format();
      expect( d.currentChannel).to.equal(12); 
    })
    .finally( function() { done(); });
  });



});
