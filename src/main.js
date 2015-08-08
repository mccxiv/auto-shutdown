var app = require('app');
var ipc = require('ipc');
var exec = require('child_process').exec;
var Window = require('browser-window');
var startup = require('./modules/squirrel-startup.js');
var version = require('./package.json').version;
var mainWindow;
var operationDate;
var timer;

if (startup()) return;

app.on('ready', load);
app.on('window-all-closed', close);

ipc.on('cancel', cancel);
ipc.on('restart', restart);
ipc.on('shutdown', shutdown);
ipc.on('hibernate', hibernate);
ipc.on('version?', sendVersion);
ipc.on('seconds-left?', sendSeconds);
ipc.on('open-dev-tools', devTools)

function cancel() {
	if (timer) clearTimeout(timer);
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

/**
 * Runs a shell command after a delay
 * @param {String} command
 * @param {Number} delay - In seconds
 */
function runCommand(command, delay) {
	delay = delay || 10;
	operationDate = new Date(Date.now() + delay * 1000);

	checkTime();

	function checkTime() {
		if (operationDate) {
			var until = secondsUntil(operationDate);
			console.log(until + ' seconds until command');
			if (until === 0) exec(command, close);
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

/**
 * Replies to an event with another event
 * that provides the number of seconds until shutdown
 * @param event
 */
function sendSeconds(event) {
	event.sender.send('seconds-left', secondsUntil(operationDate));
}

function sendVersion(event) {
	event.sender.send('version', version);
}

/**
 * Creates the main program window
 */
function load() {
	var windowOpts = {
		'use-content-size': true,
		'min-width': 480,
		'min-height': 310,
		width: 620,
		height: 375,
		title: 'Auto Shutdown',
		'auto-hide-menu-bar': true
	};

	mainWindow = new Window(windowOpts);
	mainWindow.loadUrl('file://' + __dirname + '/index.html');

	mainWindow.on('closed', function() {
		mainWindow = null; // For garbage collector
	});
}

function devTools() {
	mainWindow.openDevTools();
}

/**
 * Quits the app when the main window is closed
 */
function close() {
	app.quit();
}
