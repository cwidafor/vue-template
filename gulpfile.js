//////////////////////////////////////
//Loop Returns Gulpfile v: 0.2.2
//Created by: Xariable
//
//"Booter": Single file used to grab all
//dependencies and build compiled file.
/////////////////////////////////////

/////////////
// Modules //
/////////////
var gulp = require('gulp'),
	glob = require('glob'),
	jshint = require('gulp-jshint'),
  	browserify = require('browserify'),
	browserSync = require('browser-sync').create();
	gb = require('gulp-browserify'),
	concatenify = require('concatenify'),
  	vueify = require('vueify'),
	postCss = require('gulp-postcss'),
	sass = require('gulp-sass'),
	concat = require('gulp-concat'),
	notify = require('gulp-notify'),
	watch = require('gulp-watch'),
	gutil = require('gulp-util'),
	rename = require('gulp-rename'),
	count = require('gulp-count'),
	fs = require('fs'),
	path = require('path'),
	argv = require('yargs').argv,
	size = require('gulp-filesize'),
	stripDebug = require('gulp-strip-debug'),
	uglify = require('gulp-uglify'),
	size = require('gulp-filesize'),
	autoprefixer = require('autoprefixer'),
	cssNano = require('gulp-cssnano'),
	shell = require('gulp-shell'),
	filter = require('gulp-filter'),
	cacheBuster = require('postcss-cachebuster');
////////////////////
////Src and Dest////
////////////////////


		//Master and Src Files for Customer Facing App
		//"Master" is the booters directory
		var files = {
			vueMaster: 'src/components',
			vueSrc: ['src/components/**/**'],

			cssMaster: ['src/scss/appStyles.scss'],
			cssSrc: 'src/scss/**/*.scss',

			jsMaster: 'src/js/',
			jsSrc: ['src/js/**/*.js']
		},

		output = {
			main: 'public/',
			js: 'public/js/',
			css: 'public/css/'
		};

////////////////////////////
// Compilation Functions //
//////////////////////////

//MASTER COMPILER FUNCTION
function compileSection(){
	compileJS();
	compileCSS();
}

//function that finds and compiles entire sections
function compileJS(){
	var sectionDir = 'src/components/',
		components;

		components = getFolders(sectionDir);

		components.forEach(function(folder){
			generateVueFile(sectionDir + '/' + folder);
		});

		jsBoot(sectionDir);
}

//Use booter directory path to grab all js booter files in a directory
//Use browserify to "require" all dependecies
//export file to public directory with unique boot name
function jsBoot(booterDir){

	console.log('booter: ' + booterDir);

	booters = getBooters(booterDir);

	if(booters === false){
		return false;
	}

	booters.forEach(function(booter){
		newFileName = booter.substring((booter.indexOf('boot') + 4), booter.length).toLowerCase();
		console.log(booter);
		browserify(booterDir + '/' + booter)
			.transform(vueify)
			.bundle()
			.on('error', gutil.log.bind(gutil, gutil.colors.red('Browserify Error\n')))
			.pipe(fs.createWriteStream(output.js + newFileName));
	});
}

//Find and Combine html and js in a directory
//Also adds vue related tags
function vueCompile(src){
	console.log(src);
	var jspath,
			htmlpath,
			JSREAD,
			HTMLREAD;

	jspath = glob.sync(src + '/*.js');
	htmlpath = glob.sync(src + '/*.html');

	JSREAD = ('<script>' + (fs.readFileSync(jspath[0], 'utf-8')) + '</script>');
	HTMLREAD = ('<template>' + (fs.readFileSync(htmlpath[0], 'utf-8')) + '</template>');

	return HTMLREAD + JSREAD;
}

//Create a single .vue file from JS and HTML in a directory
function generateVueFile(folder, dest){
	if(dest === undefined){
		var parseName = folder.split('/'),
				fileName = '/' + parseName[(parseName.length - 1)] + '.vue';

		dest = folder + fileName;
	}

	fs.writeFile(dest, vueCompile(folder));
}

//Funtion that finds the master SCSS file and inits the compilation
function compileCSS(){
	cssBoot();
}

//Grab SASS booter file
//run it through gulp scss
//export with newFileName to the public directory
function cssBoot(){

	var booter = files.cssMaster,
		newFileName = 'braille'

		console.log(booter);
	gulp.src(booter)
		.pipe(sass({outputStyle: 'expanded'}).on('error', handleSassError))
		.pipe(postCss([autoprefixer()]))
		.pipe(rename(newFileName + '.css'))
		.pipe(gulp.dest(output.css))
		.pipe(browserSync.stream());
}

/////////////////////////////
//   File Search Methods   //
/////////////////////////////

//All folder in a directory into an array
function getFolders(dir) {
  return fs.readdirSync(dir).filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
  });
}

//Get all the js files from a directory
//Meant to locate booter files
function getBooters(dir){
	console.log(dir);
	var booter = fs.readdirSync(dir).filter(function(file) {
      return file.indexOf('.js') > -1 && file.indexOf('boot') > -1;
  });
	console.log(booter);
	if(booter.length < 1){
		return false;
	}
	return booter
}


//Checks for the location of a save event
function changeChecker(type, response){
	var parsedLocation = {};
	if(type === 'component' || type === 'scss'){
		var splitPath = response.path.split('/');
		parsedLocation['section'] = splitPath[(splitPath.length - 3)];
		parsedLocation['page'] = splitPath[(splitPath.length - 2)];

		var parseVuePath = splitPath.splice(0, (splitPath.length - 1));
		parsedLocation.vuePath = parseVuePath.join('/');
		var	parseBootPath = parseVuePath.splice(0, (parseVuePath.length - 1));
		parsedLocation.bootPath = parseBootPath.join('/') + '/';
	}
	return parsedLocation;
}

//Show sass errors
function handleSassError(err){
	gutil.log(gutil.colors.bold.white.bgRed('\n \n [SASS] ERROR \n'));
	console.error('', err.message);
	return notify({
		title: 'Sass Error',
		message: 'Error on line ' + err.line + ' of ' + err.file
	}).write(err);
}

//Check if Arg is present in command line
function argCheck(arguments){
	var validArgs = []
	if(argv.admin === true){
		validArgs.push('admin')
	}
	if(argv.loop === true){
		validArgs.push('loop')
	}
	return validArgs;
}

///////////
// Tasks //
///////////
var watchSrc = ['assets/*.js', 'assets/*.css', '!assets/.DS_Store', 'layout/**/*.*', 'snippets/**/*.*', 'templates/**/*.*', 'sections/**/*.*', 'config/*.*', 'locales/*.*'];

function isChanged(file) {
    return file.event === 'change' || file.event === 'add';
}

function isDeleted(file) {
    return file.event === 'unlink';
}

var filterChanged = filter(isChanged),
	filterDeleted = filter(isDeleted);


//Compiles all CSS designated in specified booter file
gulp.task('compileSCSS', function(){
	cssBoot();
});


gulp.task('build', [], function() {
	var locations = argCheck();
	console.log(locations);
	if(locations[0] === undefined){
		locations = ['loop', 'admin'];
	}
	compileSection(locations);
});

///////////////////
// Coupled Tasks //
///////////////////

//Spin up Browserify
//Watchs all files for changes, compiles if necessary and reloads Browsersync
gulp.task('watch',['build'], function(){

	browserSync.init({
        server: {
            baseDir: "public",
            browser: "chrome.exe"
        }
    });

	//Watch Scss
	gulp.watch([files.cssSrc], ['compileSCSS']);
	
	//Watch Vue Components
	gulp.watch([files.vueSrc], function(response){

		var changeLocation = changeChecker('component', response);
		console.log('Change in ' + changeLocation.section + ':' + changeLocation.page);

		generateVueFile(changeLocation.vuePath);
		jsBoot(changeLocation.bootPath);
	});
	gulp.watch([files.jsSrc], ['compileJS']);

});

//Watchs all files for changes, compiles if necessary
gulp.task('default', ['theme:upload', 'theme:delete'], function() {

});