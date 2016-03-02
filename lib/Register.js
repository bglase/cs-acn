/**
 * Object that represents and manipulates a register
 *
 * This provides a convenient way to describe registers and convert their contents
 * to and from user-friendly interpretations.
 *
 */
'use strict';

var types = {
  'uint16': {
    length: 1
  },

  'uint32' : {
    length: 2
  },

  'object': {
    length: 1   // this is kinda arbitrary for an object; length varies
  },


}


// Constructor for Item object
function Register( options ) {

  // Save the address and make sure it's in array format
  this.addr = options.addr;
  this.type = options.type || 'uint16';

  this.length = options.length || types[this.type].length;

  this.value = options.value || 0;
  this.min = options.min || 0;
  this.max = options.max || 255;
  this.fnFormat = options.format || null;
  this.fnUnformat = options.unformat || null;
  this.title = options.title || 'Reg: ' + this.addr;
  this.units = options.units || '';

  this.fromBuffer = options.fromBuffer || this.fromBuffer;
  this.toBuffer = options.toBuffer || this.toBuffer;
}

Register.prototype.set = function( value ) {
  this.value = value;
}

Register.prototype.get = function( value ) {
  return this.value;
}

Register.prototype.fromBuffer = function( value ) {
  if (value instanceof Buffer ) {
    this.value = value.readUInt16BE(0);
  }
}

Register.prototype.toBuffer = function() {

  var buf;

  switch( this.type ) {
    case 'uint16':
      buf = new Buffer( 2 );
      buf.writeUInt16BE( this.value, 0 );
      break;

    case 'uint32':
      buf = new Buffer( 4 );
      buf.writeUInt32BE( this.value, 0 );
      break;

    default:
      throw new Error( 'Unknown Register Type');
      break;


  }

  return buf;
}


/**
 * Returns the value of this item, formatted if possible
 *
 * @return {[type]} value
 */
Register.prototype.format = function() {

  if( this.fnFormat ) {
    return this.fnFormat( this.value );
  }
  else {
    return this.value;
  }

};

/**
 * Sets the value of the object, from the format()ted version
 *
 * @return {[type]} value
 */
Register.prototype.unformat = function( formatted ) {

  if( this.fnUnformat ) {
    this.value = this.fnUnformat( formatted );
  }
  else {
    this.set( formatted );
  }

};


/**
 * Returns a boolean array containing the bits in the value
 * @param {number} value the number to convert to bits
 * @param {number} length the number of 8-bit bytes in the value
 */
Register.prototype.uint16ToBoolArray = function( value ) {
  var b = [];

  var bit = 1;

  for( var i = 0; i < 16; i++) {
    b.push( (value & bit)? true : false );
    bit = bit << 1;
  }

  return b;
};

/**
 * Returns a boolean array containing the bits in the value
 * @param {number} value the number to convert to bits
 * @param {number} length the number of 8-bit bytes in the value
 */
Register.prototype.uint8ToBoolArray = function( value ) {
  var b = [];

  var bit = 1;

  for( var i = 0; i < 8; i++) {
    b.push( (value & bit)? true : false );
    bit = bit << 1;
  }

  return b;
};

/**
 * Returns a 8-bit byte formatted as hex string. 2 chars long
 *
 */
Register.prototype.valueToHex8 = function(value) {
  if( 'undefined' == typeof( value ) ) value = this.value;

  return '0x' + this.zeroPad( this.value.toString(16), 2);
};

/**
 * Returns a 16-bit word formatted as hex string, 4 chars long
 *
 */
Register.prototype.valueToHex16 = function(value) {
  if( 'undefined' == typeof( value ) ) value = this.value;

  return '0x' + this.zeroPad( value.toString(16), 4);
};

/**
 * Returns a 32-bit word formatted as hex string, 8 chars long
 *
 */
Register.prototype.valueToHex32 = function(value) {
  if( 'undefined' == typeof( value ) ) value = this.value;

  return '0x' + this.zeroPad( this.value.toString(16), 8);
};

/**
 * Returns a 32-bit word from a string
 *
 */
Register.prototype.hex32ToValue = function( hex ) {

  if( 'string' === typeof( hex )) {
    return parseInt( hex, 16 );
  }
  else {
    return hex;
  }
};

/**
 * Returns a 16-bit word from a string
 *
 */
Register.prototype.hex16ToValue = function( hex ) {

  if( 'string' === typeof( hex )) {
    return parseInt( hex, 16 );
  }
  else {
    return hex;
  }

};


/**
 * Returns a byte formatted as decimal string
 *
 */
Register.prototype.value8 = function() {

    return this.value & 0xFF;
};

/**
 * Returns a 16-bit word formatted as decimal string
 *
 */
Register.prototype.value16 = function() {
    return (this.value & 0xFFFF);
};

/**
 * Zero pads a number (on the left) to a specified length
 *
 * @param  {number} number the number to be padded
 * @param  {number} length number of digits to return
 * @return {string}        zero-padded number
 */
Register.prototype.zeroPad = function( number, length ) {
  var pad = new Array(length + 1).join( '0' );

  return (pad+number).slice(-pad.length);
};

/**
 * Converts a percentage value to an item's scaled value based on its min and max
 *
 * @param item an object from the memory map that has a max and min value
 * @param value the value that should be converted from a percent
 */
Register.prototype.value8FromPercent = function() {
    return Math.max(
      Math.min(
        Math.round((this.value * this.max / 100)-this.min), this.max),this.min);
};

/**
 * Convert a value to a percent using the item's max and min parameters
 *
 * @param item an object from the memory map that has a max and min value
 * @param value the value that should be converted to a percent
 *
 * @returns {Number}
 */
Register.prototype.value8ToPercent = function() {
    return Math.max(
      Math.min(
        Math.round((this.value-this.min) * 100 / this.max), 100),0);
};


module.exports = Register;