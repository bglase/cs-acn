#!/usr/bin/env node
/**
 * Example/demo for Control Solutions Advanced Control Network interface package
 *
 * Run the demo from the command line, using 'node demo.js'.
 * You must have an ACN controller connected to your PC via USB.
 * The demo will open the first available ACN device it finds, and
 * execute some commands to demonstrate usage of the device.
 *
 */
'use strict';

// get application path
var path = require('path');

// console text formatting
var chalk = require('chalk');

// get the app info from package.json
var pkg = require( path.join(__dirname, '../package.json') );

// command-line options
var program = require('commander');

// Configuration defaults
var config = require('./config');

// Load the object that handles communication to the device
var AcnPort = require('../acn-port');

// use environment variable for port name if specified
config.port.name = process.env.MODBUS_PORT || config.port.name;

// Define the command line option parser
program
  .version(pkg.version)
  //.option('-p, --port <port>', 'Port index on which to listen (defaults to first found)', parseInt)
  .parse(process.argv);


/**
 * If error, print it, otherwise print the result
 * @param  {err}
 * @return null
 */
function output( err, response ) {
  if( err ) {
    console.log( chalk.red( err.message ) );
    process.exit(1);
  }
  else {
    console.log(response);
  }

}
console.log();
console.log();
console.log();

console.log( chalk.bold('Seat:              ' + chalk.white('CENTER')));
console.log( chalk.bold('Footrest Safety-L: ' + chalk.green('INACTIVE')));
console.log( chalk.bold('Footrest Safety-R: ' + chalk.red('ACTIVE')));
console.log( chalk.bold('Faults:            ' + chalk.green('NONE')));
console.log( chalk.bold('Drive:             ' + chalk.white('DRIVING LEFT')));
console.log( chalk.bold('Paddle Switch:     ' + chalk.green('LEFT')));
console.log( chalk.bold('Remote Control:    ' + chalk.white('CENTER')));
console.log();
console.log();
console.log();
console.log();


