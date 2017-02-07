# cs-acn

Client module for Control Solutions Adaptive Control Network Module

Installation:
Install nodejs for your platform (http://nodejs.org).  

Install this package globally:
`npm install cs-acn -g`


The scripts you will likely want to use are:
_acn_ (general purpose utility for interacting with the device from the command line)
_acn-ws_ (a basic graphical interface using an HTML page)

The scripts have help output:
`acn -h`
`acn-ws -h`

Examples:

Find out what serial ports are available on your machine
`node acn -l`

Configuring the port to use for communication:
There are three choices:
* Edit the `config.json` file and enter the port name.  This will be used as a default for all communication to the device.
* Set an environment variable called MODBUS_PORT (depending on platform, the syntax could be `set MODBUS_PORT=COM1` or `export MODBUS_PORT=/dev/tty1`).  This will override the setting in config.json for a particular terminal window (this is useful if you have more than one wireless device connected; you can use separate terminal windows to manage them).
* Specify the port on the command line (eg `node acn slaveId --port=COM1`).  This overrides the config.json setting and the environment variable.

Verifying connection:
The `node acn slaveId` command queries the device for basic information, such as serial number.  This can be useful to confirm communication with the device.

Troubleshooting:
Verbose mode (eg `node acn slaveId -v`) can be useful - it displays the actual bytes sent and received from the device.

Tweaking:
`config.json` contains other settings used for communication; some of these are explained in the github cs-modbus package (https://github.com/csllc/cs-modbus).  These should not normally need to be changed.

Configuring the device:
Refer to Control Solutions document DOC0003826A for the device register map.  The _acn_ utility gives friendly access to read and write these registers.  For example, to read the non-volatile configuration of the device:
`node acn read config`

Change the number of milliseconds between the transmission of button status:
`node acn write msBetweenStatusTx 100`

The register names available for reading and writing are available on the `node acn -h` help screen.
