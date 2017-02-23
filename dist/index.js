/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Mickael Jeanroy
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var moment = require('moment');
var commenting = require('commenting');
var through = require('through2');
var gutil = require('gulp-util');
var read = require('./read');

module.exports = function gulpHeaderComment() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var separator = _.isObject(options) && _.isString(options.separator) ? options.separator : '\n';
  var pkgPath = path.join(process.cwd(), 'package.json');
  var pkg = fs.existsSync(pkgPath) ? require(pkgPath) : {};

  return through.obj(function (file, encoding, cb) {
    if (file.isNull() || file.isDirectory()) {
      return cb(null, file);
    }

    read(options).then(function (content) {
      var templateFn = _.template(content);
      var template = templateFn({ _: _, moment: moment, pkg: pkg });
      var extension = path.extname(file.path);
      var header = commenting(template.trim(), { extension: extension }) + separator;

      if (file.isBuffer()) {
        // Just prepend content.
        file.contents = new Buffer(header + file.contents);
      } else if (file.isStream()) {
        // Pipe to a new stream.
        var stream = through();
        stream.write(new Buffer(header));
        file.contents = file.contents.pipe(stream);
      }

      cb(null, file);
    }).catch(function (err) {
      // Log error.
      gutil.log(gutil.colors.red('gulp-header-comment: ' + err));

      // Wrap error.
      cb(new gutil.PluginError('gulp-header-comment', err));
    });
  });
};