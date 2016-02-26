'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');
var sprity = require('sprity');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var tsc = require('gulp-typescript');

var tsProject = tsc.createProject('tsconfig.json');

var paths = {
  sass: ['./app/scss/**/*.scss'],
  ts: ['./app/ts/**/*.ts'],
  html: ['./app/**/*.html'],
  images: ['./app/images/**/*.{png,jpg}']
};

// static server + watching scss/html/ts files
gulp.task('serve', ['ts', 'sass', 'sprites'], function() {
  browserSync.init({
    server: {
      baseDir: './app/'
    }
  });

  gulp.watch(paths.ts, ['ts-watch']);
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.images, ['sprites']);
  gulp.watch(paths.html).on('change', browserSync.reload);
});

// create a task that ensures the `ts` task is complete before
// reloading browsers
gulp.task('ts-watch', ['ts'], browserSync.reload);

// process ts files and return the stream.
gulp.task('ts', function() {
  var tsResult = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsc(tsProject));

  return tsResult.js
    .pipe(gulp.dest('./app/js'))
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./app/bundle/js'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./app/bundle/js'));
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
  return gulp.src(paths.sass)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(autoprefixer({
      browsers: ['last 2 version', '> 1%']
    }))
    .pipe(gulp.dest('./app/css'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./app/css/'))
    .pipe(browserSync.stream());
});

// generate sprite.png and sprite.css 
gulp.task('sprites', function () {
  return sprity.src({
    src: paths.images,
    style: './sprite.css',
    split: true,
    margin: 0,
    orientation: 'binary-tree',
    cssPath: './img/',
    cachebuster: true,
    base64: true
  })
  .pipe(gulpif('*.png', gulp.dest('./app/bundle/img/'), gulp.dest('./app/css/')));
});

gulp.task('default', ['serve']);