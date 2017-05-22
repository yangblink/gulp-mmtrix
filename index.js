var through = require('through2');
var gutil = require('gulp-util');
var mkdirp = require('mkdirp');
var rmdir = require( 'rmdir' );
var request = require('request');
var path = require('path');
var fs = require('fs');
var md5 = require('md5');

var PluginError = gutil.PluginError;
var MD5_TOKEN;

// Consts
const PLUGIN_NAME = 'gulp-mmtrix';

var download = function(uri, filename, complete){
  var buffer = new Buffer(0);
  request(uri)
    .on('data', (chunk) => {
      var len = buffer.length + chunk.length;
      buffer = Buffer.concat([buffer, chunk], len);
    })
    .on('end', () => {
      complete(buffer);
    });
};

// Plugin level function (dealing with files)
function gulpPrefixer(options, eventCall) {

  var accesskey = options.accesskey,
      securekey = options.securekey;

  if(!(accesskey || securekey)){
    throw PluginError(PLUGIN_NAME, "Missing accesskey or securekey");
  }

  // Creating a stream through which each file will pass
  var stream = through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      this.push(file); // Do nothing if no contents
      return callback();
    }

    if (file.isBuffer()) {
      MD5_TOKEN = md5(securekey + file.contents);

      var reqOpt = {
        accesskey: accesskey,
        md5: MD5_TOKEN,
      }

      // console.log('file name:', file.relative, file.contents.length);

      mmtrix(reqOpt, file, ((data, responseJson) => {
        gutil.log(PLUGIN_NAME + ': [compressing]', gutil.colors.green('✔ ') + file.relative + gutil.colors.gray(' (done)'));
        file.contents = data;
        this.push(file);
        if(eventCall) {
          eventCall(responseJson);
        }
        return callback();
      }).bind(this) );

    }

    if (file.isStream()) {
      throw PluginError(PLUGIN_NAME, "Stream is not supported");
      return callback();
    }

  });

  // returning the file stream
  return stream;
};

function mmtrix(reqOpt, file, cb) {
  var r = request({
    url: 'http://api.mmtrix.com/v1/imageoptimize/file',
    method: 'POST',
    formData: reqOpt,
    json: true
  }, function(err, res, body) {
    if(!err) {
      if(body && body.code == 0) {
        var minurl = body.results[0].optImg.fdfsUrl;
        var filename = file.relative;
        // gutil.log(PLUGIN_NAME, body, gutil.colors.green('now download'));2
        download(minurl, filename, (buf) => {
            cb(buf, body);
        });
      }
      else{
        gutil.log(PLUGIN_NAME + ':[compressing] failed', gutil.colors.red('☓ '), file.relative, gutil.colors.red( body.errorMsg))
      }
    }
    else{
      console.error(PLUGIN_NAME, err);
    }
  });

  var form = r.form();
  form.append('file', file.contents, {filename: file.relative});
  form.append('accesskey', reqOpt.accesskey)
  form.append('md5', reqOpt.md5);
}
// Exporting the plugin main function
module.exports = gulpPrefixer;