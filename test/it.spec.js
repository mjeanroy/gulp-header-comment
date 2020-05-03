/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017-2020 Mickael Jeanroy
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

const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const tmp = require('tmp');
const headerComment = require('../src/index');
const joinLines = require('./utils/join-lines');

describe('[IT] gulp-header-comment', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({
      unsafeCleanup: true,
    });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  it('should prepend header', (done) => {
    const fName = 'test.txt';
    const src = path.join(__dirname, 'fixtures', fName);
    const dest = path.join(tmpDir.name);

    gulp.src(src)
        .pipe(headerComment('License MIT'))
        .pipe(gulp.dest(dest))
        .on('error', (err) => done.fail(err))
        .on('end', () => {
          fs.readFile(path.join(dest, fName), 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
              return;
            }

            expect(data).toEqual(joinLines([
              '/**',
              ' * License MIT',
              ' */',
              '',
              'Hello World',
              '',
            ]));

            done();
          });
        });
  });
});
