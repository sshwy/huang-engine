const fs = require('fs')
const gulp = require('gulp')
const GulpBabel = require('gulp-babel')

function buildJS () {
  return gulp.src(['src/*.js'])
    .pipe(GulpBabel({
      presets: ['minify'],
    }))
    .pipe(gulp.dest('dist/'))
}

function buildStatic () {
  return gulp.src(['src/*.css', 'src/*.html'])
    .pipe(gulp.dest('dist/'))
}

function buildData () { // 与游戏引擎无关的数据
  return gulp.src(['src/data.dump'])
    .pipe(gulp.dest('dist/'))
}

function initDir (cb) {
  fs.mkdirSync('./dist')
  console.log('hello world!');
  cb();
}

function clean (cb) {
  fs.rmSync('./dist', { recursive: true, force: true })
  cb();
}

const build = gulp.series(initDir, buildJS, buildStatic, buildData)
const defaultTask = gulp.series(clean, build)

exports.clean = clean
exports.build = build
exports.default = defaultTask