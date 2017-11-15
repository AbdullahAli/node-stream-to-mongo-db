import gulp  from 'gulp';
import shell from 'gulp-shell';

gulp.task('watch', watch);

function watch() {
  return gulp.src('').pipe(shell([
    'babel --watch src/ --out-dir out/'
  ]));
}
