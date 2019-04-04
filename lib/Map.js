'use strict';

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

/**
 * Compute voltage from CS1108 value
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
function voltage( value ) {
  var volts = value * 1469 / 3 / 16777216.0;
  return volts * 24;
}

function valueToCs1108Serial( values ) {

        // checksum is the xor of the nibbles of the 3 serial number bytes.
      // On my dev board, this calculation does not match what is stored in value[0]
      // so the checksum is ignored (until I can verify it is working correctly)
      /*var cks =
        ((values[1] & 0xF0) / 16)
        ^ (values[1] & 0x0F)
        ^ ((values[2] & 0xF0) / 16)
        ^ (values[2] & 0x0F)
        ^ ((values[3] & 0xF0) / 16)
        ^ (values[3] & 0x0F); */

      //if( ((values[0] & 0x0F) === cks) && ((values[0] & 0xF0) === 0x20)) {
      if( (values[0] & 0xF0) === 0x20) {

        // valid serial number, prepend the S, zero pad, and convert to decimal
        var n = (values[1]*65536 + values[2] * 256 + values[3] ).toString(10);

        return 'S' + zeroPad( n, 7 );

      }
      else {
        // serial number not programmed
        return '';
      }
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

var maxHops = new Register( {
  title: 'Max Hops',
  addr: 0x07
});

var slowSpeed = new Register( {
  title: 'Slow Speed',
  addr: 0x08,
  format: Register.prototype.valueToHex16,
});

var fastSpeed = new Register( {
  title: 'Fast Speed',
  addr: 0x09,
  format: Register.prototype.valueToHex16,
});

/**
 * An item that contains all the bank 0 registers
 *
 */
var config = new Register( {
  title: 'Configuration',
  addr: 0x00,
  length: 10,
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
    slowSpeed.set( buf.readUInt16BE( 16 ));
    fastSpeed.set( buf.readUInt16BE( 18 ));
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
      slowSpeed: slowSpeed.format(),
      fastSpeed: fastSpeed.format(),
    };
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
    slowSpeed.unformat( formatted.slowSpeed );
    fastSpeed.unformat( formatted.fastSpeed );
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

var remoteQuality = new Register( {
  title: 'Remote Quality',
  addr: 0x0103,
  format: function(value) {
    return {
      rssi: (value & 0xFF),
      lqi: (value >> 8 )
    };
  }
});

var systemState = new Register( {
  title: 'State',
  addr: 0x0104,
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
  title: 'Volts',
  addr: 0x0105,
});

/**
 * An item that contains all the bank 1 registers
 *
 */
var bank1 = new Register( {
  title: 'Bank 1',
  addr: 0x0100,
  length: 6,
  fromBuffer: function( buf ) {
    var reader = new buffers.BufferReader( buf );

    // data is a buffer containing 'length*2' bytes
    localSwitches.set( reader.shiftUInt16() );
    remoteSwitches.set( reader.shiftUInt16() );
    remoteStatus.set( reader.shiftUInt16() );
    remoteQuality.set( reader.shiftUInt16() );
    systemState.set( reader.shiftUInt16() );
    volts.set( reader.shiftUInt16() );
  },

  format: function() {
    return {
      localSwitches: localSwitches.format(),
      remoteSwitches: remoteSwitches.format(),
      remoteStatus: remoteStatus.format(),
      remoteQuality: remoteQuality.format(),
      systemState: systemState.format(),
      volts: volts.format(),
    };
  },
});

//------------------------------------//---------------------------------------
// Bank 2
var channel = new Register( {
  title: 'Channel',
  addr: 0x0200,
});

var fault = new Register( {
  title: 'Fault',
  addr: 0x0201,
});

/**
 * An item that contains all the bank 1 registers
 *
 */
var bank2 = new Register( {
  title: 'Bank 2',
  addr: 0x0200,
  length: 2,
  fromBuffer: function( buf ) {
    var reader = new buffers.BufferReader( buf );

    // data is a buffer containing 'length*2' bytes
    channel.set( reader.shiftUInt16() );
    fault.set( reader.shiftUInt16() );
  },

  format: function() {
    return {
      channel: channel.format(),
      fault: fault.format(),
    };
  },
});

//------------------------------------//---------------------------------------
// Bank 3/4 - local/remote outputs


/**
 * Decodes a 16-bit register into the 'output configuration' used by bank 3/4
 * @param array bits contains 16 bits of info from the record
 */
function registerToOutputConfig( value ) {
  
  var duty = (value & 0x06) >> 1;
  var dutyLookup = [ 25, 50, 75, 100 ];

  var period = (value & 0xF8) >> 3;
  console.log ('output: ' + duty + ' - period: ' + period );

  return {
    active: (1 === (value & 0x01)),
    duty: dutyLookup[ duty ],
    period: (period + 1) * 50

  };
}


/**
 * An item that contains all the bank's registers
 *
 */

var lo0 = new Register( {
  title: 'Local Output 0',
  addr: 0x300,
  format: registerToOutputConfig
});

var lo1 = new Register( {
  title: 'Local Output 1',
  addr: 0x301,
  format: registerToOutputConfig
});


var localOutputs = new Register( {
  title: 'Local Outputs',
  addr: 0x0300,
  length: 2,
  fromBuffer: function( buf ) {
    var reader = new buffers.BufferReader( buf );

    lo0.set( reader.shiftUInt16 );
    lo1.set( reader.shiftUInt16 );
  },

  format: function() {

    return [
      lo0.format(),
      lo1.format()
    ];
  },
  
});


/**
 * An item that contains all the bank's registers
 *
 */

var ro0 = new Register( {
  title: 'Remote Output 0',
  addr: 0x400,
  format: registerToOutputConfig
});

var ro1 = new Register( {
  title: 'Remote Output 1',
  addr: 0x401,
  format: registerToOutputConfig
});

var ro2 = new Register( {
  title: 'Remote Output 2',
  addr: 0x402,
  format: registerToOutputConfig
});

var remoteOutputs = new Register( {
  title: 'Remote Outputs',
  addr: 0x0400,
  length: 16,
  fromBuffer: function( buf ) {
    var reader = new buffers.BufferReader( buf );

    ro0.set( reader.shiftUInt16 );
    ro1.set( reader.shiftUInt16 );
    ro2.set( reader.shiftUInt16 );
  },

  format: function() {

    return [
      ro0.format(),
      ro1.format(),
      ro2.format()
    ];
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
    return this.value;
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
    return this.value;
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
          address: macToString( buf, i* entrySize + 4, 8 ),
          status: status,
          extra: buf[i * entrySize + 13],

        });
      }
    }
  },

  format: function() {
    return this.value;
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
    return this.value;
  },
});

function cs1108StateFlags( byte ) {
  var chargeMode;
  switch( byte & 0xF ) {
    case 1:
      chargeMode = 'Pre-charge';
      break;
    case 2:
      chargeMode = 'Bulk';
      break;
    case 4:
      chargeMode = 'Overcharge';
      break;
    case 8:
      chargeMode = 'Float Charge';
      break;
    default:
      chargeMode = 'Not Charging';
      break;

  }

  return {
    charging: byte & 0xF,
    chargeMode: chargeMode,
    inUse: (byte & 0x10)
  };

}

function cs1108Hours( fraction, hours ) {
  return Math.round((hours + (fraction/65536))*10)/10;
}

/**
 * The coordinator status object
 *
 */
var sensorData = new Register( {
  title: 'Sensor Data',
  addr: 7,
  type: 'object',
  fromBuffer: function( buf ) {
    //console.log( buf);
    if( buf.length < 46 ){
      this.msgtype = 0;
    }
    else {

      var values = new buffers.BufferReader( buf );

      // Just keep the binary data of the packet
    //  this.packet = values.shiftBytes( 40 );

      
      var dataType = values.shiftUInt8();
 
      if( dataType === 1 ) {
        // Controller report
        this.packet = {
          datatype: dataType,
          serial : valueToCs1108Serial( values.shiftBytes( 4 ) ),
          faultLog : values.shiftBytes( 16 ),
          meters : {
            hours : cs1108Hours( values.shiftUInt16( true ), values.shiftUInt16( true ) ),
            noFloat : values.shiftUInt8(),
            lowBatMin : values.shiftUInt8(),
            lowBatHrs : values.shiftUInt8(),
            overtemp : values.shiftUInt8(),
            throtFail : values.shiftUInt8(),
          },

          currentFault : values.shiftUInt8(),
          batteryVoltage : voltage( values.shiftUInt16() ),
          stateFlags : cs1108StateFlags( values.shiftUInt8() ),
        };

        // Skip unused bytes
        values.shiftBytes(6);


      } 
      else if( dataType === 2 ) {
        // GPS report
        this.packet = {
          datatype: dataType,
          serial : valueToCs1108Serial( values.shiftBytes( 4 ) ),
          latitude: (values.shiftInt32( true ))/10000000.0,
          longitude: (values.shiftInt32( true ))/10000000.0,
          sats: values.shiftUInt8(),
          fixValid: values.shiftUInt8(),
          ehpe: values.shiftUInt32( true )/100.0,

          cnoMin: values.shiftUInt8(),
          cnoMax: values.shiftUInt8(),
          cnoAvg: values.shiftUInt8(),
          boundaryViolated: values.shiftUInt8(),
          boundaryAction: values.shiftUInt8(),
        };

        //console.log( values.length );
        // Skip unused bytes
        values.shiftBytes(16);
      }
      else { 
        this.msgtype = 0; 
        // Skip unused bytes
        values.shiftBytes(39);
      }


      //console.log( values );
     // this.packet = values.shiftBytes(40);

/*
      // sensortdata packet is always 40 bytes
      this.packet = {
        serial: valueToCs1108Serial( values.shiftBytes(4) ),
        latitude: values.shiftFloat( true ),
        longitude: values.shiftFloat( true ),
        numSat: values.shiftUInt8(),
        meters: {
          hours: cs1108Hours( values.shiftUInt16( true ), values.shiftUInt16( true )),
          noFloat: values.shiftUInt8(),
          lowBatMin: values.shiftUInt8(),
          lowBatHrs: values.shiftUInt8(),
          overtemp: values.shiftUInt8(),
          throtFail: values.shiftUInt8(),
        },
        gpsFlags: values.shiftUInt8(),
        boundaryCount: values.shiftUInt8(),
        boundaryStatus: values.shiftUInt8(),
        gpsLossCount: values.shiftUInt8(),
        currentFault: values.shiftUInt8(),
        batteryVoltage: voltage( values.shiftUInt16()),
        stateFlags: cs1108StateFlags(values.shiftUInt8()),

      };

      // convert GPS flags to bools
      var flags = this.uint8ToBoolArray( this.packet.gpsFlags, 1);

      this.packet.gpsFlags = {
        noSignal: flags[0],
        error: flags[1],
        boundary: flags[2],
        warning: flags[3]
      };
*/
      // unused bytes in the packet
      // last 6 bytes are metadata about the packet
      this.from = zeroPad( values.shiftUInt16(true).toString(16), 4);
      this.msgtype = values.shiftUInt8();
      this.length = values.shiftUInt8();
      this.rssi = values.shiftUInt8();
      this.lqi = values.shiftUInt8();

      // truncate the packet buffer to its actual length
      //if( this.length >= 0 & this.length <=40 ) {
      //  this.packet.length = this.length;
      //}
    }
  },

  format: function() {
    if( this.msgtype === 0) {
      return { msgtype: 0};
    }
    else {
      return {
        //buf: this.value,
        from: this.from,
        msgtype: this.msgtype,
        length: this.length,
        rssi: this.rssi,
        lqi: this.lqi,
        packet: this.packet
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
  slowSpeed: slowSpeed,
  fastSpeed: fastSpeed,

  config: config,

  // Bank 1
  localSwitches: localSwitches,
  remoteSwitches: remoteSwitches,
  remoteStatus: remoteStatus,
  //remoteQuality: remoteQuality,
  systemState: systemState,
  volts: volts,

  bank1: bank1,

  // Bank 2
  channel: channel,
  fault: fault,
  bank2: bank2,

  // bank 3
  lo0: lo0,
  lo1: lo1,
  localOutputs: localOutputs,

  // bank 4
  ro0: ro0,
  ro1: ro1,
  ro2: ro2,
  remoteOutputs: remoteOutputs,

  // objects:
  networkStatus: networkStatus,
  scanResult: scanResult,
  connectionTable: connectionTable,
  coordStatus: coordStatus,
  sensorData: sensorData,

  // access to the register object
  Register: Register
}
