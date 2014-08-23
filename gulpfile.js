var gulp                  	= require('gulp'),
	concat                	= require('gulp-concat'),
	uglify                	= require('gulp-uglify'),
	less                  	= require('gulp-less'),
	rename                	= require('gulp-rename'),
	del                   	= require('del'),
	livereload            	= require('gulp-livereload'),
	inject                	= require("gulp-inject"),
	html2js               	= require('gulp-html2js'),
	jshint                	= require('gulp-jshint'),
	stylish               	= require('jshint-stylish'),
	debug                 	= require('gulp-debug'),
	svgstore              	= require('gulp-svgstore'),
	merge                 	= require('merge-stream'),
	watch                 	= require('gulp-watch'),
	changed               	= require('gulp-changed'),
	header                	= require('gulp-header'),
	fs                    	= require('fs'),
	conventionalChangelog 	= require('conventional-changelog'),
	bump                  	= require('gulp-bump'),
	ngAnnotate            	= require('gulp-ng-annotate'),
	config                	= require('./build.config.js'),
	pkg                   	= require('./package.json'),
	streamqueue  		  	= require('streamqueue'),
	sass 				  	= require('gulp-ruby-sass'),
	gutil 					= require('gulp-util'),
	http 					= require('http'),
	ecstatic		 		= require('ecstatic')
	;

gulp.task('sass', function () {
	return gulp.src(config.app_files.scss)
		.pipe(sass({noCache: true}))
		.on('error', function (err) { console.log(err.message); })
		.pipe(rename(function(path){
			path.basename = pkg.name + '-' + pkg.version;
		}))
		.pipe(gulp.dest(config.build_dir + '/assets'));
});

gulp.task('copy', function() {
	var sources = [
		gulp.src('src/assets/**/*', { base: 'src/assets/' })
			.pipe(changed(config.build_dir + '/assets'))
			.pipe(gulp.dest(config.build_dir + '/assets')),

		gulp.src(config.app_files.js)
			.pipe(changed(config.build_dir + '/src'))
			.pipe(gulp.dest(config.build_dir + '/src')),

		gulp.src(config.vendor_files.js.concat(config.vendor_files.css), {base: '.'})
			.pipe(changed(config.build_dir))
			.pipe(gulp.dest(config.build_dir))
	];

	return merge(sources);
});


gulp.task('injectify', ['prod'], function () {

	var target = gulp.src('./build/index.html'),
		files = [].concat(
			config.vendor_files.css,
				'assets/' + pkg.name + '-' + pkg.version + '.app.css',
			'js/app.js',
			'templates-app.js'
		),
		sources = gulp.src(files, {read: false, cwd: config.prod_dir});

	return target.pipe(inject(sources))
		.pipe(gulp.dest(config.prod_dir));
});


gulp.task('prod', function() {

	var paths = {
		scriptsNoTest: ['src/**/*.js', '!src/**/*.spec.js'],
		assets : 'build/assets/**/*',
		index: 'build/index.html',
		templates: 'build/templates-app.js'
	};

	//Concat into prod/js/app.js
	var concats = streamqueue(
		{objectMode: true},
		gulp.src(config.vendor_files.js),
		gulp.src(paths.scriptsNoTest)
	)
		.pipe(concat('app.js'))
		.pipe(ngAnnotate({
			remove: false,
			add: false,
			single_quotes: true
		}))
		.pipe(gulp.dest(config.prod_dir + '/js'));

	//Copy assets
	var simpleCopy = (function(){
		var sources = [
			gulp.src(paths.assets)
				.pipe(gulp.dest(config.prod_dir + '/assets')),
			gulp.src(paths.templates)
				.pipe(gulp.dest(config.prod_dir))
		];
		return merge(sources);
	})();

	return {
		concats : concats,
		simpleCopy: simpleCopy
	};
});

gulp.task('less', function() {
	return gulp.src(config.app_files.less)
		.pipe(changed(config.build_dir + '/assets', {extension: '.css'}))
		.pipe(less())
		.pipe(rename(function(path){
			path.basename = pkg.name + '-' + pkg.version;
		}))
		.pipe(gulp.dest(config.build_dir + '/assets'));
});

gulp.task('jshint', function() {
	var options = {
		curly: true,
		immed: true,
		newcap: true,
		noarg: true,
		sub: true,
		boss: true,
		eqnull: true,
		globalstrict: true
	};

	return gulp.src(config.app_files.js)
		.pipe(jshint(options))
		.pipe(jshint.reporter(stylish))
		.pipe(jshint.reporter('fail'));
});

gulp.task('html2js', function() {
	var templates = [
		{ files: config.app_files.atpl, type: 'app'},
		{ files: config.app_files.ctpl, type: 'common'}
	];

	return templates.map(function(template) {
		return gulp.src(template.files)
			.pipe(html2js({base: 'src/' + template.type, outputModuleName: 'templates-' + template.type}))
			.pipe(changed(config.build_dir, {extension: '.js'}))
			.pipe(concat('templates-'+ template.type +'.js'))
			.pipe(gulp.dest(config.build_dir));
	});
});

var indexTask = function() {
	var target = gulp.src('src/index.html'),

		files = [].concat(
			config.vendor_files.js,
			'src/**/*.js',
			config.vendor_files.css,
			'templates-common.js',
			'templates-app.js',
				'assets/' + pkg.name + '-' + pkg.version + '.css'
		),

		sources = gulp.src(files, {read: false, cwd: config.build_dir, addRootSlash: false});

	return target.pipe(inject(sources))
		.pipe(gulp.dest(config.build_dir));
};

gulp.task('index', ['sass', 'copy', 'html2js'], function() {
	return indexTask();
});

gulp.task('watch-index', ['sass'], function() {
	return indexTask();
});

var svgstoreTask = function() {
	var svgs = gulp.src('src/assets/svg/*.svg')
			.pipe(svgstore({ prefix: pkg.name + '-', inlineSvg: true })),

		fileContents = function fileContents (filePath, file) {
			return file.contents.toString('utf8');
		};

	return gulp.src(config.build_dir + '/index.html')
		.pipe(inject(svgs, { transform: fileContents }))
		.pipe(gulp.dest(config.build_dir));
};

gulp.task('svgstore', ['index'], function () {
	return svgstoreTask();
});

gulp.task('watch-svgstore', ['watch-index'], function () {
	return svgstoreTask();
});

gulp.task('livereload', ['svgstore'], function() {
	livereload.listen();
	gulp.watch(config.build_dir + '/**').on('change', livereload.changed);
});

gulp.task('watch', ['svgstore'], function() {
	gulp.watch(['**/*.scss'], ['sass']);
	gulp.watch(['src/**/*.js'], [
		//'jshint',
		'copy'
	]);
	gulp.watch([config.app_files.atpl, config.app_files.ctpl], ['html2js']);
	gulp.watch('src/index.html', ['watch-index', 'watch-svgstore']);
	gulp.watch('src/assets/svg/*.svg', ['svgstore']);
});

gulp.task('server', function() {
	http.createServer(ecstatic({root: __dirname + '/build'})).listen(8080);
	gutil.log(gutil.colors.blue('HTTP server listening on port 8080'));
});

gulp.task('default', [
	//'jshint',
	'server',
	'watch',
	'livereload'
]);
