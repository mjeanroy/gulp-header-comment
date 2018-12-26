/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017-2018 Mickael Jeanroy
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

const fs = require('fs');
const path = require('path');
const log = require('fancy-log');
const colors = require('ansi-colors');
const PluginError = require('plugin-error');
const _ = require('lodash');
const moment = require('moment');
const commenting = require('commenting');
const through = require('through2');
const read = require('./read');

module.exports = function gulpHeaderComment(options = {}) {
  const separator = _.isObject(options) && _.isString(options.separator) ? options.separator : '\n';
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = fs.existsSync(pkgPath) ? require(pkgPath) : {};

  return through.obj((file, encoding, cb) => {
    if (file.isNull() || file.isDirectory()) {
      return cb(null, file);
    }

    read(options)
        .then((content) => {
          const templateFn = _.template(content);
          const template = templateFn({_, moment, pkg});
          const extension = path.extname(file.path);
          const header = commenting(template.trim(), {extension}) + separator;

          if (file.isBuffer()) {
            // Just prepend content.
            file.contents = new Buffer(header + file.contents);
          } else if (file.isStream()) {
            // Pipe to a new stream.
            const stream = through();
            stream.write(new Buffer(header));
            file.contents = file.contents.pipe(stream);
          }

          cb(null, file);
        })
        .catch((err) => {
          // Log error.
          log.error(colors.red(`gulp-header-comment: ${err}`));

          // Wrap error.
          cb(new PluginError('gulp-header-comment', err));
        });
  });
};
