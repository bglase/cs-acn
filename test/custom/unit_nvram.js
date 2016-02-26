/**
 * Unit tests the non-volatile RAM functionality
 *
 * This test attempts to save and restore the non-volatile device configuration; however
 * in certain error cases this may not be possible, and additional steps will have to be taken
 * after the test to recover the device (like factory initializing it)
 *
 */

// Configuration defaults
var config = require('../../config');

// Load the object that handles communication to the device
var AcnPort = require('../../acn-port');

// Test helpers
var assert = require('assert');
var expect = require('chai').expect;

// use environment variable for port name if specified
config.port.name = process.env.MODBUS_PORT || config.port.name;

// Create interface to the device
var port = new AcnPort( config.port.name, config );

// Store configuration
var originalFactoryConfig;

/**
 * Pre-test
 *
 * Runs once, before all tests in this block.
 * Calling the done() callback tells mocha to proceed with tests
 *
 */
before(function( done ) {

  // open the port, read the config, and call 'done'.
  port.open()
    .then( function() { return port.command( 2520 ); })
    .then( function( d ) { console.log(d); })
    .then( function() { return port.getFactoryConfig(); })
    .then( function( f ) {
      originalFactoryConfig = f;
    })
    .catch(function(e){ throw new Error(e); })
    .finally( function() { done(); });


});

after(function( done ) {
  // runs after all tests in this block

  // attempt to restore the device configuration
  port.setFactoryConfig( originalFactoryConfig )
    .then( function() { done(); })
    .catch( function(e) { throw new Error( 'Could not restore original factory config'); });

});

beforeEach(function( done ) {
  // runs before each test in this block
  done();
});

afterEach(function( done ) {
  // runs after each test in this block
  done();
});



describe('NVRAM Unit test ', function() {


  it.only('should not allow a write to protected region', function(done) {

    port.command( 2520 )
      .then( function() { port.readMemory( port.NVRAM, address, length, values ); })
      .then( function( mem ) { console.log( mem ); })
      .then( function() { port.writeMemory( port.NVRAM, address, length, values ); })
      .then( function(result) {
        //expect( result);

      })
      .then( function() { port.readMemory( port.NVRAM, address, length, values ); })
      .then( function( mem ) {
        console.log( mem );
       })
      .catch( function(e) {
        assert( false );
      });

  });

  it('should not start with invalid factory config', function(done) {

    port.writeMemory( port.NVRAM, address, length, values )
      .then( function(result) {
        expect( result);

      })
      .then( function() { return port.reset(); })
      .delay( 5000 )
      .then( function() { return port.reportSlaveId(); })
      .then( function( id ) {
        console.log( id );
        expect( id ).to.be.an('object');
        expect( id.run !== 255 );
       })
      .then( function() { return port.command( 2520 ); })
      .then( function() { return port.getFactoryConfig(); })
      .then( function( config ) {
        console.log( 'config: ', config );
       })
      .catch( function(e) {
        assert( false );
      });

  });




});
