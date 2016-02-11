/**
 * Tests the READ_FIFO8 and WRITE_FIFO8 modbus commands
 *
 * Requires a FIFO to be available on the target - for example, in
 * mbfuncfifo8, enable the UNIT_TEST macro.
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

// ID of the FIFO we will be testing
var THE_FIFO = 0;

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

    // finished with this init
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
  //
  // make sure the FIFO is empty
  //console.log('after');

  port.master.readFifo8( THE_FIFO, 250, {
    onComplete: function output( err, response ) {
      done();
    }
  });
});

beforeEach(function( done ) {
  // runs before each test in this block
  done();
});

afterEach(function( done ) {
  // runs after each test in this block
  done();
});



describe('Unit test of FIFO ' + THE_FIFO, function() {

  // set test timeout default
  //this.timeout(5000);

  it('should be empty', function(done) {

    port.master.readFifo8( THE_FIFO, 250, {
      onComplete: function output( err, response ) {
        //console.log( response );
        expect( err ).to.equal( null );
        expect( response ).to.be.an( 'object');
        expect( response.values ).to.be.an.instanceof(Buffer);
        expect( response.values.length ).to.equal(0);
        done();
       }
    });
  });

  it('should accept a byte', function(done) {

    port.master.writeFifo8( THE_FIFO, new Buffer([0x55]), {
      onComplete: function output( err, response ) {
        //console.log( response );
        expect( err ).to.equal( null );
        expect( response ).to.be.an( 'object');
        expect( response.code ).to.equal(66);
        expect( response.quantity).to.equal(1);

        done();
      }
    });
  });

  it('should return the same byte', function(done) {

    port.master.readFifo8( THE_FIFO, 250, {
      onComplete: function output( err, response ) {
        //console.log( response );
        expect( err ).to.equal( null );
        expect( response ).to.be.an( 'object');
        expect( response.values ).to.be.an.instanceof(Buffer);
        expect( response.values.length ).to.equal(1);
        expect( response.values[0] ).to.equal(0x55);
        expect( response.status.overflow ).to.equal(false);
        expect( response.status.more ).to.equal(false);

        done();
      }
    });
  });

  it('should not accept more than max', function(done) {

    var buf = new Buffer(250);
    // Fill buffer with a pattern we can test for when we read it back
    for( var i = 0; i < buf.length; i++ ) {
      buf[i] = i;
    }

    port.master.writeFifo8( THE_FIFO, buf, {
      onComplete: function output( err, response ) {
        //console.log( response );
        expect( err ).to.equal( null );
        expect( response ).to.be.an( 'object');
        expect( response.code ).to.equal(66);
        expect( response.quantity).to.equal(8);

        done();
      }
    });
  });

  it('should report queue full', function(done) {

    port.master.readFifo8( THE_FIFO, 0, {
      onComplete: function output( err, response ) {
        //console.log( response );
        expect( err ).to.equal( null );
        expect( response ).to.be.an( 'object');
        expect( response.values ).to.be.an.instanceof(Buffer);
        expect( response.values.length ).to.equal(0);
        expect( response.status.more ).to.equal(true);
        expect( response.status.overflow ).to.equal(true);

        done();
      }
    });
  });

  it('should read back the correct bytes', function(done) {

    port.master.readFifo8( THE_FIFO, 8, {
      onComplete: function output( err, response ) {
        //console.log( response );
        expect( err ).to.equal( null );
        expect( response ).to.be.an( 'object');
        expect( response.values ).to.be.an.instanceof(Buffer);
        expect( response.values.length ).to.equal(8);
        expect( response.status.more ).to.equal(false);
        expect( response.values[0] ).to.equal(0);
        expect( response.values[7] ).to.equal(7);

        done();
      }
    });
  });

  it('should be empty', function(done) {

    port.master.readFifo8( THE_FIFO, 0, {
      onComplete: function output( err, response ) {
        //console.log( response );
        expect( err ).to.equal( null );
        expect( response ).to.be.an( 'object');
        expect( response.values ).to.be.an.instanceof(Buffer);
        expect( response.values.length ).to.equal(0);
        expect( response.status.more ).to.equal(false);
        expect( response.status.overflow ).to.equal(false);

        done();
      }
    });
  });

});
