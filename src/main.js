var app = require('app');
var ipc = require('ipc');
var exec = require('child_process').exec;
var Window = require('browser-window');
var mainWindow;
var operationDate;

app.on('ready', load);
app.on('window-all-closed', close);

ipc.on('cancel', cancel);
ipc.on('restart', restart);
ipc.on('shutdown', shutdown);
ipc.on('hibernate', hibernate);
ipc.on('seconds-left?', sendSeconds);

console.log('Node');

function cancel() {
	operationDate = null;
}

function shutdown(event, seconds) {
	var commands = {win32: 'shutdown -s -f -t 1'};
	runCommand(commands[process.platform], seconds);
}

function restart(event, seconds) {
	var commands = {win32: 'shutdown -r -f -t 1'};
	runCommand(commands[process.platform], seconds);
}

function hibernate(event, seconds) {
	var commands = {win32: 'shutdown -h -f'};
	runCommand(commands[process.platform], seconds);
}

function sendSeconds(event) {
	event.sender.send('seconds-left', secondsUntil(operationDate));
}

/**
 * Runs a shell command
 * @param {String} command
 * @param {Number} delay - In seconds
 */
function runCommand(command, delay) {
	delay = delay || 10;
	operationDate = new Date();
	operationDate.setSeconds(operationDate.getSeconds() + delay);

	function checkTime() {
		if (operationDate) {
			var until = secondsUntil(operationDate);
			console.log(until + ' seconds until command');
			if (until === 0) console.log('EXECUTING COMMAND NOW!', command);
			else setTimeout(checkTime, 3000);
		}
	}
}

/**
 * Gives the number of seconds until date,
 * it stops at 0 (does not go negative)
 * @param {Date} date
 * @returns {Number|Boolean}
 */
function secondsUntil(date) {
	if (!date) return false;
	var mSec = date.getTime() - Date.now();
	var sec = Math.floor(mSec / 1000);
	return sec < 0? 0 : sec;
}

function load() {
	mainWindow = new Window({});
	mainWindow.loadUrl('file://' + __dirname + '/index.html');
	mainWindow.openDevTools();

	mainWindow.on('closed', function() {
		mainWindow = null; // For garbage collector
	});
}

function close() {
	if (process.platform != 'darwin') app.quit();
}
