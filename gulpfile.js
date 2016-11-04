var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    spawn = require('child_process').spawn,
    replace = require('gulp-replace'),
    fs = require('fs'),
    os = require("os"),
    release = require('gulp-release');

release.register(gulp, {
    packages: ['package.json'],
    messages: {
        // Commit message on version bumping
        bump: 'Bump release version',

        // Commit message on setting next "-dev" version on `develop`
        next: 'Set next development version'
    }});

gulp.task('embed:data', function(){
    var allowedWebsites = JSON.parse((fs.readFileSync('data/websites.json', 'utf8')));
    var db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

    var websitesSection = '';
    Object.keys(allowedWebsites).forEach(function(key){
        //include main website
        websitesSection += '// @include *://'+key+'/*'+os.EOL;
        //include subdomains + www
        websitesSection += '// @include *://*.'+key+'/*'+os.EOL;
    });
    var parts = [];
    Object.keys(db).forEach(function(key){
        var human = db[key];
        human.variants.forEach(function (val) {
            parts.push(val.replace("* ", ".? ").replace("*", ".?"));
        });
    });


    var regex = '(' + parts.join('|') + ')';

    return gulp.src('scripts/*')
        .pipe(replace('// @include', websitesSection))
        .pipe(replace('{{ db }}', JSON.stringify(db)))
        .pipe(replace('{{ regex }}', regex))
        .pipe(replace('{{ websites }}', JSON.stringify(allowedWebsites)))
        .pipe(gulp.dest('src/common/'))
});
gulp.task('scripts', ['embed:data'], function () {
    return gulp.src([
        'bower_components/jquery/dist/jquery.js',
        'bower_components/mark.js/dist/jquery.mark.js',
        'bower_components/dot/doT.js'
    ])
        .pipe(plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest('src/common/'))
        .pipe(uglify())
        .pipe(gulp.dest('src/common/'))
});
gulp.task('copy:templates', function () {
    gulp
        .src(['templates/*', '!templates/index.html'])
        .pipe(gulp.dest('src/common'));
});
gulp.task('build', ['embed:data', 'scripts', 'copy:templates'], function (cb) {
    var cmd = spawn('python2.7', ['kangoext/kango.py', 'build', '.'], {stdio: 'inherit'});
    cmd.on('close', function (code) {
        console.log('my-task exited with code ' + code);
        cb(code);
    });
});

gulp.task('default', function () {
    gulp.watch("scripts/**/*.js", ['scripts']);
    gulp.watch("templates/*.html", ['embed:template']);
});


//this task is for dev only
gulp.task('embed:template', function () {
    return gulp.src('templates/index.html')
        .pipe(replace('//tooltip-template', fs.readFileSync('templates/tooltip.html', 'utf8')))
        .pipe(gulp.dest('debug/'))
});