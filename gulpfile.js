var exec = require('child_process').exec;
var gulp = require('gulp');

gulp.task('run-development', function(cb) {
	exec('"src/node_modules/.bin/electron" ./src', cb);
});