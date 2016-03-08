/**
 * Defines the register map for ACN devices
 *
 * See CS document DOC0003825A
 *
 */

var buffers = require('h5.buffers');

var Register = require('./Register' );


//------------------------------------//---------------------------------------
// Utility functions


/**
 * Translates a product type (from ReportSlaveId) to a string
 *
 * @param {number} code run code
 */
function RoleToString( code ) {
  switch( code ) {
    case 0:
      return 'End Device';
    case 1:
      return 'Coordinator';
    case 2:
      return 'Net Coordinator';
    default:
      return 'Unknown';

  }
}

/**
 * Zero pads a number (on the left) to a specified length
 *
 * @param  {number} number the number to be padded
 * @param  {number} length number of digits to return
 * @return {string}        zero-padded number
 */
function zeroPad( number, length ) {
  var pad = new Array(length + 1).join( '0' );

  return (pad+number).slice(-pad.length);
};

/**
 * Formats a buffer of bytes into a string like xx:yy:zz
 *
 * @param  Buffer buffer Contains the bytes to be formatted
 * @param  integer offset offset into the buffer to start reading
 * @param  integer length number of bytes to process
 * @return string a string like 'xx:yy:zz'
 */
function macToString( buffer, offset, length ) {

  var mac = [];

  // Build a string array of the MAC address bytes
  for( var i = 0; i < length; i++ ) {
    mac.push( zeroPad( buffer[ offset + i].toString(16), 2));
  }

  return mac.join(':');
}

/**
 * Parses a string like 11:22:33:44:55:66:77:88 to a binary buffer
 *
 * @param  {[type]} mac [description]
 * @return {[type]}     [description]
 */
function stringToMac( str ) {

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
function shortAddressToString( buffer, offset ) {
  return zeroPad( buffer.readUInt16LE(offset).toString(16), 4)
}


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

var switchDefaults = new Register( {
  title: 'Switch Defaults',
  addr: 0x06
});

var maxHops = new Register( {
  title: 'Max Hops',
  addr: 0x07
});

/**
 * An item that contains all the bank 0 registers
 *
 */
var config = new Register( {
  title: 'Configuration',
  addr: 0x00,
  length: 0x08,
  fromBuffer: function( buf ) {

    // data is a buffer containing 'length*2' bytes
    modbusSlaveId.set( buf.readUInt16BE( 0 ));
    channelMap.set( buf.readUInt16BE( 2 ));
    msBetweenStatusTx.set( buf.readUInt16BE( 4 ));
    powerOffSec.set( buf.readUInt16BE( 6 ));
    networkFormation.set( buf.readUInt16BE( 8 ));
    pairingTimeout.set( buf.readUInt16BE( 10 ));
    switchDefaults.set( buf.readUInt16BE( 12 ));
    maxHops.set( buf.readUInt16BE( 14 ));
  },

  format: function() {
    return {
      modbusSlaveId: modbusSlaveId.format(),
      channelMap: channelMap.format(),
      msBetweenStatusTx: msBetweenStatusTx.format(),
      powerOffSec: powerOffSec.format(),
      networkFormation: networkFormation.format(),
      pairingTimeout: pairingTimeout.format(),
      switchDefaults: switchDefaults.format(),
      maxHops: maxHops.format(),
    }
  },

  unformat: function( formatted ) {

    modbusSlaveId.unformat( formatted.modbusSlaveId );
    channelMap.unformat( formatted.channelMap );
    msBetweenStatusTx.unformat( formatted.msBetweenStatusTx );
    powerOffSec.unformat( formatted.powerOffSec );
    networkFormation.unformat( formatted.networkFormation );
    pairingTimeout.unformat( formatted.pairingTimeout );
    switchDefaults.unformat( formatted.switchDefaults );
    maxHops.unformat( formatted.maxHops );
  },

  toBuffer: function() {
    var builder = new buffers.BufferBuilder();

    builder
      .pushUInt16( modbusSlaveId.value )
      .pushUInt16( channelMap.value )
      .pushUInt16( msBetweenStatusTx.value )
      .pushUInt16( powerOffSec.value )
      .pushUInt16( networkFormation.value )
      .pushUInt16( pairingTimeout.value )
      .pushUInt16( switchDefaults.value )
      .pushUInt16( maxHops.value );

    return builder.toBuffer();
  }

});

//------------------------------------//---------------------------------------
// Bank 1
var localSwitches = new Register( {
  title: 'Local Switches',
  addr: 0x0100,
  format: Register.prototype.uint16ToBoolArray,
});

var remoteSwitches = new Register( {
  title: 'Remote Switches',
  addr: 0x0101,
  format: Register.prototype.uint16ToBoolArray,
});

var remoteStatus = new Register( {
  title: 'Remote Status',
  addr: 0x0102,
});

var systemState = new Register( {
  title: 'State',
  addr: 0x0103,
  format: function(value) {
    switch( value ) {
      case 0: return 'None';
      case 1: return 'Reset';
      case 2: return 'Powerup';
      case 3: return 'Idle';
      case 4: return 'Active';
      case 5: return 'Pairing';
      default: return 'Unknown';
    }
  }
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
});

//------------------------------------//---------------------------------------
// Objects
/**
 * The network status object
 *
 */
var networkStatus = new Register( {
  title: 'Network Status',
  addr: 2,
  type: 'object',
  fromBuffer: function( buf ) {
    this.value = {
      shortAddress: shortAddressToString(buf, 0 ),
      parent: buf[2],
      panId: shortAddressToString (buf, 3 ),
      currentChannel: buf[5]
    };
  },

  format: function() {
    return this.value
  },
});

/**
 * The scan results object
 *
 */
var scanResult = new Register( {
  title: 'Scan Result',
  addr: 3,
  type: 'object',
  fromBuffer: function( buf ) {

    //console.log(buf);
    //console.log(buf.length);

    // these match the array definition in the ACN device
    var entrySize = 15;

    var numEntries = parseInt(buf.length / entrySize);

    this.value = [];

    for( var i = 0; i < numEntries; i++ ) {

      // decode the status byte
      var thebyte = buf[i * entrySize + 13];
      var capability = {
        role: ( thebyte & 0x03 ),
        sleep: ( thebyte & 0x04 ) > 0,
        securityEnable: ( thebyte & 0x08 ) > 0,
        repeatEnable: ( thebyte & 0x10 ) > 0,
        allowJoin: ( thebyte & 0x20 ) > 0,
        direct: ( thebyte & 0x40 ) > 0,
        altSourceAddress: ( thebyte & 0x80 ) > 0,
      };

      var channel = buf[i * entrySize + 0];

      if( channel < 255 && channel > 0 ) {

        // save the entry in an array
        this.value.push( {
          channel: channel,
          address: macToString( buf, 1, 8 ),
          panId: shortAddressToString( buf, i * entrySize + 9),
          rssi: buf[i * entrySize + 11],
          lqi: buf[i * entrySize + 12],
          capability: capability,
          peerInfo: buf[i * entrySize + 14]

        });
      }
    }
  },

  format: function() {
    return this.value
  },
});

/**
 * The Connection table object
 *
 */
var connectionTable = new Register( {
  title: 'Connections',
  addr: 4,
  type: 'object',
  fromBuffer: function( buf ) {
    //console.log(buf);
    //console.log(buf.length);

    // these match the array definition in the ACN device
    var entrySize = 14;

    var numEntries = parseInt(buf.length / entrySize);

    this.value = [];

    for( var i = 0; i < numEntries; i++ ) {

      // decode the status byte
      var statusByte = buf[i * entrySize + 12];
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
        this.value.push( {
          panId: shortAddressToString( buf, i * entrySize + 0),
          altAddress: shortAddressToString( buf, i * entrySize + 2),
          address: macToString( buf, 4, 8 ),
          status: status,
          extra: buf[i * entrySize + 13],

        });
      }
    }
  },

  format: function() {
    return this.value
  },
});

/**
 * The coordinator status object
 *
 */
var coordStatus = new Register( {
  title: 'Coordinator Status',
  addr: 5,
  type: 'object',
  fromBuffer: function( buf ) {
    //console.log(buf);
    //console.log(buf.length);

    var values = new buffers.BufferReader( buf );

    var routingTable = values.shiftBytes(8);
    var routingErrors = values.shiftBytes(8);
    var coordinators = values.shiftUInt8();
    var role = values.shiftUInt8();
    this.value = {
      role: role,
      roleType: RoleToString(role),
      known: this.uint8ToBoolArray( coordinators, 1),
      route: []
    };

    // now create the routing table
    for (var i = 0; i < 8; i++ ){
      this.value.route.push( {
        to: i,
        nextHop: routingTable[i],
        errors: routingErrors[i]
      });
    }
  },

  format: function() {
    return this.value
  },
});


/**
 * The coordinator status object
 *
 */
var sensorData = new Register( {
  title: 'Sensor Data',
  addr: 7,
  type: 'object',
  fromBuffer: function( buf ) {
    if( buf.length < 46 ){
      this.type = 0;
    }
    else {
      var values = new buffers.BufferReader( buf );

      this.value = values.shiftBytes(40);
      this.from = values.shiftUInt16(true);
      this.type = values.shiftUInt8();
      this.length = values.shiftUInt8()
      this.rssi = values.shiftUInt8();
      this.lqi = values.shiftUInt8();
    }
  },

  format: function() {
    if( this.type === 0) {
      return { type: 0};
    }
    else {
      return {
        buf: this.value,
        from: this.from,
        type: this.type,
        length: this.length,
        rssi: this.rssi,
        lqi: this.lqi
      };
    }
  },
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
  switchDefaults: switchDefaults,
  maxHops: maxHops,

  config: config,

  // Bank 1
  localSwitches: localSwitches,
  remoteSwitches: remoteSwitches,
  remoteStatus: remoteStatus,
  systemState: systemState,
  volts: volts,

  bank1: bank1,

  // Bank 2


  // objects:
  networkStatus: networkStatus,
  scanResult: scanResult,
  connectionTable: connectionTable,
  coordStatus: coordStatus,
  sensorData: sensorData,

  // access to the register object
  Register: Register
}
