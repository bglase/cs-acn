/**
 * Defines the register map for ACN devices
 *
 * See CS document DOC0003825A
 *
 */

var buffers = require('h5.buffers');

var Register = require('./Register' );


//------------------------------------//---------------------------------------
// Bank 0

var modbusSlaveId = new Register( {
  title: 'Slave ID',
  addr: 0x00,
});

var channelMap = new Register( {
  title: 'Channel Map',
  addr: 0x01,
  type: 'uint16',
  format: Register.prototype.valueToHex16,
  unformat: Register.prototype.hex16ToValue
});

var msBetweenStatusTx = new Register( {
  title: 'Status Interval',
  addr: 0x02,
  units: 'ms'
});

var powerOffSec = new Register( {
  title: 'Power Off',
  addr: 0x03,
  units: 's'
});

var networkFormation = new Register( {
  title: 'Formation',
  addr: 0x04,
});

var pairingTimeout = new Register( {
  title: 'Pairing Timeout',
  addr: 0x05,
  units: 's'
});

/**
 * An item that contains all the bank 0 registers
 *
 */
var config = new Register( {
  title: 'Configuration',
  addr: 0x00,
  length: 0x06,
  fromBuffer: function( buf ) {

    // data is a buffer containing 'length*2' bytes
    modbusSlaveId.set( buf.readUInt16BE( 0 ));
    channelMap.set( buf.readUInt16BE( 2 ));
    msBetweenStatusTx.set( buf.readUInt16BE( 4 ));
    powerOffSec.set( buf.readUInt16BE( 6 ));
    networkFormation.set( buf.readUInt16BE( 8 ));
    pairingTimeout.set( buf.readUInt16BE( 10 ));
  },

  format: function() {
    return {
      modbusSlaveId: modbusSlaveId.format(),
      channelMap: channelMap.format(),
      msBetweenStatusTx: msBetweenStatusTx.format(),
      powerOffSec: powerOffSec.format(),
      networkFormation: networkFormation.format(),
      pairingTimeout: pairingTimeout.format(),
    }
  },

  unformat: function( formatted ) {

    modbusSlaveId.unformat( formatted.modbusSlaveId );
    channelMap.unformat( formatted.channelMap );
    msBetweenStatusTx.unformat( formatted.msBetweenStatusTx );
    powerOffSec.unformat( formatted.powerOffSec );
    networkFormation.unformat( formatted.networkFormation );
    pairingTimeout.unformat( formatted.pairingTimeout );
  },

  toBuffer: function() {
    var builder = new buffers.BufferBuilder();

    builder
      .pushUInt16( modbusSlaveId.value )
      .pushUInt16( channelMap.value )
      .pushUInt16( msBetweenStatusTx.value )
      .pushUInt16( powerOffSec.value )
      .pushUInt16( networkFormation.value )
      .pushUInt16( pairingTimeout.value );

    return builder.toBuffer();
  }

});

//------------------------------------//---------------------------------------
// Bank 1
var localSwitches = new Register( {
  title: 'Local Switches',
  addr: 0x0100,
  format: Register.prototype.valueToBoolArray,
});

var remoteSwitches = new Register( {
  title: 'Remote Switches',
  addr: 0x0101,
  format: Register.prototype.valueToBoolArray,
});

var remoteStatus = new Register( {
  title: 'Remote Status',
  addr: 0x0102,
});

var systemState = new Register( {
  title: 'State',
  addr: 0x0103,
});

var volts = new Register( {
  title: 'State',
  addr: 0x0104,
});

/**
 * An item that contains all the bank 0 registers
 *
 */
var bank1 = new Register( {
  title: 'Bank 1',
  addr: 0x0100,
  length: 5,
  fromBuffer: function( buf ) {

    // data is a buffer containing 'length*2' bytes
    localSwitches.set( buf.readUInt16BE( 0 ));
    remoteSwitches.set( buf.readUInt16BE( 2 ));
    remoteStatus.set( buf.readUInt16BE( 4 ));
    systemState.set( buf.readUInt16BE( 6 ));
    volts.set( buf.readUInt16BE( 8 ));
  },

  format: function() {
    return {
      localSwitches: localSwitches.format(),
      remoteSwitches: remoteSwitches.format(),
      remoteStatus: remoteStatus.format(),
      systemState: systemState.format(),
      volts: volts.format(),
    }
  },

/*
  unformat: function( formatted ) {

    localSwitches.unformat( formatted.localSwitches );
    remoteSwitches.unformat( formatted.remoteSwitches );
    remoteStatus.unformat( formatted.remoteStatus );
    systemState.unformat( formatted.systemState );
    volts.unformat( formatted.volts );
  },

  toBuffer: function() {
    var builder = new buffers.BufferBuilder();

    builder
      .pushUInt16( localSwitches.value )
      .pushUInt16( channelMap.value )
      .pushUInt16( remoteSwitches.value )
      .pushUInt16( remoteStatus.value )
      .pushUInt16( systemState.value )
      .pushUInt16( volts.value );

    return builder.toBuffer();
  }
*/
});

//------------------------------------//---------------------------------------

/**
 * Make the register map available when this module is required
 * @type {Object}
 */
module.exports = {

  // Bank 0
  modbusSlaveId: modbusSlaveId,
  channelMap: channelMap,
  msBetweenStatusTx: msBetweenStatusTx,
  powerOffSec: powerOffSec,
  networkFormation: networkFormation,
  pairingTimeout: pairingTimeout,

  config: config,

  // Bank 1
  localSwitches: localSwitches,
  remoteSwitches: remoteSwitches,
  remoteStatus: remoteStatus,
  systemState: systemState,
  volts: volts,

  bank1: bank1

  // Bank 2

}
