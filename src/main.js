var app = require('app');
var ipc = require('ipc');
var exec = require('child_process').exec;
var Window = require('browser-window');
var mainWindow;
var timer;

app.on('ready', load);
app.on('window-all-closed', close);

ipc.on('cancel', cancel);
ipc.on('restart', restart);
ipc.on('shutdown', shutdown);
ipc.on('hibernate', hibernate);

console.log('Node');

function cancel() {
	if (timer) clearTimeout(timer);
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
 * Runs a shell command
 * @param {String} command
 * @param {Number} delay - In seconds
 */
function runCommand(command, delay) {
	delay = delay || 10;
	console.log('EXECUTING COMMAND IN A BIT...', command);
	timer = setTimeout(function() {
		//exec(commands[process.platform]);
		console.log('EXECUTING COMMAND NOW!', command);
	}, delay * 1000);
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
