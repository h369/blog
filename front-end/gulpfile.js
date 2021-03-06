var fs = require('fs')

var gulp = require('gulp')

var sass = require('gulp-sass')
var cleanCSS = require('gulp-clean-css')
var replace = require('gulp-replace')
var qiniu = require('gulp-qiniu')

gulp.task('default', function() {
    gulp.run('build')
})

gulp.task('build', function() {
    gulp.run('html')
})

gulp.task('watch', function() {
    gulp.run('html')
    gulp.watch(['src/sass/**'], function() {
        gulp.run('html')
    })
})

gulp.task('css', function() {
    return gulp.src('src/sass/index.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('dist'))
})

gulp.task('html', ['css'], function() {
    return gulp.src('src/index.html')
        .pipe(replace(/<link href="([^\.]*\.css)"[^>]*>/, function(s, filename) {
            var style = fs.readFileSync(filename, 'utf8')
            return '<style>\n' + style + '\n</style>'
        }))
        .pipe(gulp.dest('../node/app/views/'))
})

// gulp.task('cdn', function() {
//     // body...
// })
