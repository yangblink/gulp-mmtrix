## gulp-mmtrix

> Minify image use [mmtrix](http://doc.mmtrix.com/api/imageopt.html)

## Install

```
npm install --save-dev gulp-mmtrix
```

## Example

```javascript
var gulp = require('gulp');
var mmtrix = require('gulp-mmtrix');
gulp.task('mmtrix', function() {
    var opt = {
        accesskey: accesskey-from-mmtrix,
        securekey: securekey-from-mmtrix,
    }
    gulp.src('your/minify/img/**')
        .pipe(mmtrix(opt))
        .pipe(gulp.dest('/imagemin/'))
})
```
It will minify all you img to **/imagemin**

`accesskey` and `securekey` is generate by [mmtrix](http://doc.mmtrix.com/api/imageopt.html)
