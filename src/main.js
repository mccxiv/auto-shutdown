var app = require('app');
var ipc = require('ipc');
var exec = require('child_process').exec;
var Window = require('browser-window');
var mainWindow;
var operationDate;
var timer;

app.on('ready', load);
app.on('window-all-closed', close);

ipc.on('cancel', cancel);
ipc.on('restart', restart);
ipc.on('shutdown', shutdown);
ipc.on('hibernate', hibernate);
ipc.on('seconds-left?', sendSeconds);

function cancel() {
	if (timer) clearTimeout(timer);
	operationDate = null;
}

function shutdown(event, seconds) {
	var commands = {win32: 'shutdown -s -f -t 1'};
	runCommand(commands[process.platform], seconds);
}

function restart(event, seconds) {
	console.log('RESTART!', arguments);
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
	console.log('runCommand delay is ', delay);
	delay = delay || 10;
	operationDate = new Date(Date.now() + delay * 1000);
	//operationDate.setSeconds(operationDate.getSeconds() + delay);


	checkTime();

	function checkTime() {
		console.log('checkTime')
		if (operationDate) {
			var until = secondsUntil(operationDate);
			console.log(until + ' seconds until command');
			if (until === 0) console.log('EXECUTING COMMAND NOW!', command);
			else timer = setTimeout(checkTime, 3000);
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
