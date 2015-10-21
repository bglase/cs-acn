/**
 * Shows a status console for an ACN Gateway
 *
 */

'use strict';

// Screen management utilities
var blessed = require('blessed');
var contrib = require('blessed-contrib');

// Load the object that handles communication to the device
var AcnPort = require('../acn-port');

// Read the config.json file
var config = require('./config');

// utilities
var util = require('util');

// get application path
var path = require('path');

// get the app info from package.json
var pkg = require( path.join(__dirname, '../package.json') );

// command-line options
var program = require('commander');

// use environment variable for port name if specified
config.port.name = process.env.MODBUS_PORT || config.port.name;

// Define the command line option parser
program
  .version(pkg.version)
  //.option('-p, --port <port>', 'Port index on which to listen (defaults to first found)', parseInt)
  .parse(process.argv);


var screen = blessed.screen();

//create layout and widgets
var grid = new contrib.grid({rows: 12, cols: 12, screen: screen});




var netStatus = grid.set(0, 0, 6, 6, blessed.box, {content: 'My Box', label: 'My Label'});


/**
 * Communication Log
 *
 */
var comm = grid.set(6, 6, 4, 6, contrib.log, {
  fg: 'white',
  label: 'Comm Log'
});

var messages = grid.set(6, 0, 4, 6, contrib.log, {
  fg: 'white',
  label: 'Messages'
});

var help = grid.set(10, 0, 2, 12, contrib.log, {
  fg: 'white',
  label: 'Help'
});

help.log( '[ESC][q][Ctrl-C] Quit');


/**
 * Message counters
 *
 */
/*
var table =  grid.set(6, 6, 6, 2, contrib.table,
  { //keys: true
   fg: 'white'
  , label: 'Messages'
  , columnSpacing: 1
  , columnWidth: [12, 6]});

*/


/**
 * Donut Options
  self.options.radius = options.radius || 14; // how wide is it? over 5 is best
  self.options.arcWidth = options.arcWidth || 4; //width of the donut
  self.options.yPadding = options.yPadding || 2; //padding from the top
 */
/*
var donut = grid.set(8, 8, 4, 2, contrib.donut,
  {
  label: 'Percent Donut',
  radius: 16,
  arcWidth: 4,
  spacing: 2,
  yPadding: 2,
  data: [{label: 'Storage', percent: 87}]
})
*/

// var latencyLine = grid.set(8, 8, 4, 2, contrib.line,
//   { style:
//     { line: "yellow"
//     , text: "green"
//     , baseline: "black"}
//   , xLabelPadding: 3
//   , xPadding: 5
//   , label: 'Network Latency (sec)'})

/*
var gauge = grid.set(8, 10, 2, 2, contrib.gauge, {label: 'Storage', percent: [80,20]})
var gauge_two = grid.set(2, 9, 2, 3, contrib.gauge, {label: 'Deployment Progress', percent: 80})

var sparkline = grid.set(10, 10, 2, 2, contrib.sparkline,
  { label: 'Throughput (bits/sec)'
  , tags: true
  , style: { fg: 'blue', titleFg: 'white' }})
*/

/*
 *
 * LCD Options
//these options need to be modified epending on the resulting positioning/size
  options.segmentWidth = options.segmentWidth || 0.06; // how wide are the segments in % so 50% = 0.5
  options.segmentInterval = options.segmentInterval || 0.11; // spacing between the segments in % so 50% = 0.5
  options.strokeWidth = options.strokeWidth || 0.11; // spacing between the segments in % so 50% = 0.5
//default display settings
  options.elements = options.elements || 3; // how many elements in the display. or how many characters can be displayed.
  options.display = options.display || 321; // what should be displayed before anything is set
  options.elementSpacing = options.spacing || 4; // spacing between each element
  options.elementPadding = options.padding || 2; // how far away from the edges to put the elements
//coloring
  options.color = options.color || "white";
*/
/*
var lcdLineOne = grid.set(0,9,2,3, contrib.lcd,
  {
    label: "LCD Test",
    segmentWidth: 0.06,
    segmentInterval: 0.11,
    strokeWidth: 0.1,
    elements: 5,
    display: 3210,
    elementSpacing: 4,
    elementPadding: 2
  }
);
*/
/*
var errorsLine = grid.set(0, 6, 4, 3, contrib.line,
  { style:
    { line: "red"
    , text: "white"
    , baseline: "black"}
  , label: 'Errors Rate'
  , maxY: 60
  , showLegend: true })
*/

/*
var map = grid.set(6, 0, 6, 6, contrib.map, {label: 'Servers Location'})
*/


//dummy data
//var commands = ['grep', 'node', 'java', 'timer', '~/ls -l', 'netns', 'watchdog', 'gulp', 'tar -xvf', 'awk', 'npm install']


/*
//set dummy data on gauge
var gauge_percent = 0
setInterval(function() {
  gauge.setData([gauge_percent, 100-gauge_percent]);
  gauge_percent++;
  if (gauge_percent>=100) gauge_percent = 0
}, 200)

var gauge_percent_two = 0
setInterval(function() {
  gauge_two.setData(gauge_percent_two);
  gauge_percent_two++;
  if (gauge_percent_two>=100) gauge_percent_two = 0
}, 200);






//set spark dummy data
var spark1 = [1,2,5,2,1,5,1,2,5,2,1,5,4,4,5,4,1,5,1,2,5,2,1,5,1,2,5,2,1,5,1,2,5,2,1,5]
var spark2 = [4,4,5,4,1,5,1,2,5,2,1,5,4,4,5,4,1,5,1,2,5,2,1,5,1,2,5,2,1,5,1,2,5,2,1,5]

refreshSpark()
setInterval(refreshSpark, 1000)

function refreshSpark() {
  spark1.shift()
  spark1.push(Math.random()*5+1)
  spark2.shift()
  spark2.push(Math.random()*5+1)
  sparkline.setData(['Server1', 'Server2'], [spark1, spark2])
}



//set map dummy markers
var marker = true
setInterval(function() {
   if (marker) {
    map.addMarker({"lon" : "-79.0000", "lat" : "37.5000", color: 'yellow', char: 'X' })
    map.addMarker({"lon" : "-122.6819", "lat" : "45.5200" })
    map.addMarker({"lon" : "-6.2597", "lat" : "53.3478" })
    map.addMarker({"lon" : "103.8000", "lat" : "1.3000" })
   }
   else {
    map.clearMarkers()
   }
   marker =! marker
   screen.render()
}, 1000)

//set line charts dummy data

var transactionsData = {
   title: 'USA',
   style: {line: 'red'},
   x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40', '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20', '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
   y: [0, 20, 40, 45, 45, 50, 55, 70, 65, 58, 50, 55, 60, 65, 70, 80, 70, 50, 40, 50, 60, 70, 82, 88, 89, 89, 89, 80, 72, 70]
}

var transactionsData1 = {
   title: 'Europe',
   style: {line: 'yellow'},
   x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40', '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20', '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
   y: [0, 5, 5, 10, 10, 15, 20, 30, 25, 30, 30, 20, 20, 30, 30, 20, 15, 15, 19, 25, 30, 25, 25, 20, 25, 30, 35, 35, 30, 30]
}

var errorsData = {
   title: 'server 1',
   x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25'],
   y: [30, 50, 70, 40, 50, 20]
}

var latencyData = {
   x: ['t1', 't2', 't3', 't4'],
   y: [5, 1, 7, 5]
}

setLineData([transactionsData, transactionsData1], driveGraph)
setLineData([errorsData], errorsLine)
// setLineData([latencyData], latencyLine)

setInterval(function() {
   setLineData([transactionsData, transactionsData1], driveGraph)
   screen.render()
}, 500)

setInterval(function() {
    setLineData([errorsData], errorsLine)
}, 1500)

setInterval(function(){
  var colors = ['green','magenta','cyan','red','blue'];
  var text = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  var value = Math.round(Math.random() * 100);
  lcdLineOne.setDisplay(value + text[value%12]);
  lcdLineOne.setOptions({
    color: colors[value%5],
    elementPadding: 4
  });
  screen.render()
}, 1500);

var pct = 0.00;

function updateDonut(){
  if (pct > 0.99) pct = 0.00;
  var color = "green";
  if (pct >= 0.25) color = "cyan";
  if (pct >= 0.5) color = "yellow";
  if (pct >= 0.75) color = "red";
  donut.setData([
    {percent: parseFloat((pct+0.00) % 1).toFixed(2), label: 'storage', 'color': color}
  ]);
  pct += 0.01;
}

setInterval(function() {
   updateDonut();
   screen.render()
}, 500)



function setLineData(mockData, line) {
  for (var i=0; i<mockData.length; i++) {
    var last = mockData[i].y[mockData[i].y.length-1]
    mockData[i].y.shift()
    var num = Math.max(last + Math.round(Math.random()*10) - 5, 10)
    mockData[i].y.push(num)
  }

  line.setData(mockData)
}
*/


screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();


/**
* Wraps the serial port interface manager
*
*/


/*

function updateSpeed() {

  var stuffToRead = [
     PortManager.map.throttleValue,
     PortManager.map.pwm,
     PortManager.map.speed,
     ];


 PortManager.readRam( stuffToRead, function( error, data ) {
     outputItems( error, data );
      //return res.json( data );
 } );



}

thePort.open( function( error ) {
   if( !error )
       console.log( 'Port Opened: ' );
   else {
       console.log( error );
       process.exit(1);
   }

setInterval(function() {
   updateSpeed();
}, 500)



});

*/

var port = new AcnPort( config.port.name, config.options );

var connection = port.master.getConnection();

connection.on('open', function()
{
  comm.log('Port Open');
});

connection.on('close', function()
{
  comm.log('Port Closed');
});

connection.on('error', function(err)
{
  comm.log('E:' + err.message);
});

connection.on('write', function(data)
{
  comm.log('S:' + util.inspect(data));
});

connection.on('data', function(data)
{
  comm.log('R:' + util.inspect(data));
});

var transport = port.master.getTransport();

transport.on('request', function(transaction)
{
  messages.log( '' + transaction.getRequest());
});



// Attach event handler for the port opening
port.on( 'open', function () {

  port.getFactoryConfig( function( err, result ) {
    if( err ) {
      netStatus.setLabel( 'Disconnected');
    }
    else {
      netStatus.setLabel( result.productType + ' ' +
        result.serialNumber + ' ' + result.macAddress );
    }

  });

  //port.getNetworkStatus( output );


});

port.open();


port.master.once( 'connected', function() {

netStatus.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');

  setInterval( function() {
    port.getNetworkStatus( function(err, response) {

      if( response.shortAddress ) {
        var status = '{left}Short Address:{/left}{right}' +
          response.shortAddress + '{/right}';
        //netStatus.setContent( status );
        screen.render();
      }

    });
  }, 5000 );

  /*var pollNetStatus = port.master.readObject(2, {
    interval: 1000,
    onComplete: function(err, response)
    {
      if (err)
      {
        messages.log(err.message);
      }
      else
      {
        messages.log(response.toString());
      }
    }
  });
*/


});

  /*

  port.getFactoryConfig( output );

  port.getNetworkStatus( output );

  port.setFactoryConfig({
    macAddress: '00:01:02:03:04:05:06:07',
    serialNumber: 'A001',
    productType: 2
  }, function( err, response ) {
    if( err ) {
      console.log( err );
    }
    else {
      // now query it
      console.log( response );
     port.getFactoryConfig( output );

    }

  } );


  port.getDebug( function(err, result ) {
    if( result.values ) {
      console.log( 'Debug: ' + result.values.toString());
    }
  } );
*/
