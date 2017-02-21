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

const path = require('path');
const _ = require('lodash');
const commenting = require('commenting');
const through = require('through2');
const read = require('./read');

module.exports = function gulpHeaderComment(options = {}) {
  return through((file, encoding, cb) => {
    if (file.isNull() || file.isDirectory()) {
      return cb(null, file);
    }

    read(options)
      .then((content) => {
        const template = _.template(content, {_, moment});
        const extension = path.extname(file.basename);
        const header = commenting(template.trim(), {extension});

        if (file.isBuffer()) {
          // Just prepend content.
          file.contents = new Buffer(header + '\n' + file.contents);
        } else if (file.isStream()) {
          // Pipe to a new stream.
          const stream = through();
          stream.write(template);
          file.contents = file.contents.pipe(stream);
        }

        cb(null, file);
      })
      .catch((err) => {
        cb(err);
      });
  });
};
