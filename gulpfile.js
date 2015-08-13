var exec = require('child_process').exec;
var zip = require('gulp-zip');
var del = require('del');
var gulp = require('gulp');
var rename = require('gulp-rename');
var sequence = require('run-sequence');
var packager = require('electron-packager');
var vulcanize = require('gulp-vulcanize');
var winInstaller = require('electron-windows-installer');

var VERSION = require('./src/package.json').version;
var TEMP_BUILD_DIR = 'vulcanized';
var BUILD_DIR = 'build';
var DIST_DIR = 'dist';

gulp.task('make-installer', function() {
	return winInstaller({
		appDirectory: BUILD_DIR + '/AutoShutdown-win32-ia32',
		outputDirectory: DIST_DIR,
		iconUrl: __dirname + '/build-assets/logo-gray.ico',
		exe: 'AutoShutdown.exe',
		setupExe: 'AutoShutdown-Setup-'+VERSION+'.exe',
		authors: 'Mccxiv Software',
		title: 'Auto Shutdown',
		setupIcon: __dirname + '/build-assets/logo-gray.ico'
	});
});

gulp.task('run-development', function(cb) {
	exec('"src/node_modules/.bin/electron" ./src', cb);
});

gulp.task('run-vulcanized', function(cb) {
	exec('"src/node_modules/.bin/electron" '+TEMP_BUILD_DIR, cb);
});

gulp.task('vulcanize', function() {
	return gulp.src('src/index.html')
		.pipe(vulcanize({
			excludes: [],
			inlineScripts: true,
			inlineCss: true,
			stripExcludes: false
		}))
		.pipe(gulp.dest(TEMP_BUILD_DIR));
});

gulp.task('copy-files', function() {
	return gulp.src(['src/main.js', 'src/package.json'])
		.pipe(gulp.dest(TEMP_BUILD_DIR));
});

gulp.task('copy-modules', function() {
	return gulp.src(['src/modules/**'])
		.pipe(gulp.dest(TEMP_BUILD_DIR+'/modules'));
});

gulp.task('copy-assets', function() {
	return gulp.src(['src/assets/**'])
		.pipe(gulp.dest(TEMP_BUILD_DIR+'/assets'));
});

gulp.task('clean-up-before', function(cb) {
	del([TEMP_BUILD_DIR, BUILD_DIR, DIST_DIR], cb);
});

gulp.task('clean-up-after', function(cb) {
	del([TEMP_BUILD_DIR, BUILD_DIR, 'dist/RELEASES', 'dist/**/*.nupkg'], cb);
});

gulp.task('package', function(cb) {
	var opts = {
		dir: 'vulcanized',
		name: 'AutoShutdown',
		platform: 'all',
		arch: 'ia32',
		version: '0.30.2',
		'app-version': VERSION,
		icon: 'build-assets/logo-gray.ico',
		'version-string': {
			CompanyName: 'Mccxiv Software',
			LegalCopyright: 'Copyright 2015 Andrea Stella. All rights reserved',
			ProductVersion: VERSION,
			FileVersion: VERSION,
			FileDescription: 'Auto Shutdown',
			ProductName: 'Auto Shutdown'
		},
		out: BUILD_DIR
	};
	packager(opts, cb);
});

gulp.task('make-zip-windows', function() {
	return gulp.src('build/AutoShutdown-win32-ia32/**/*')
		.pipe(rename(function(path) {
			path.dirname = path.dirname === '.'? 'AutoShutdown' : 'AutoShutdown/'+path.dirname;
		}))
		.pipe(zip('AutoShutdown-win32-'+VERSION+'.zip'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('build', function(cb) {
	sequence('clean-up-before',
		['vulcanize', 'copy-files', 'copy-modules', 'copy-assets'],
		'package',
		['make-installer', 'make-zip-windows'],
		'clean-up-after', cb);
});

gulp.task('default', ['build']);