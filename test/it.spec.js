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
const sourcemaps = require('gulp-sourcemaps');
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

  it('should prepend header and apply sourcemap', (done) => {
    const fname = 'test.js';
    const src = path.join(__dirname, 'fixtures', fname);
    const dest = path.join(tmpDir.name);

    gulp.src(src)
        .pipe(sourcemaps.init())
        .pipe(headerComment('License MIT'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dest))
        .on('error', (err) => done.fail(err))
        .on('end', () => {
          fs.readFile(path.join(dest, `${fname}.map`), 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
              return;
            }

            const sourcemap = JSON.parse(data);

            expect(sourcemap.version).toBe(3);
            expect(sourcemap.file).toBe(fname);
            expect(sourcemap.sources).toEqual([fname]);
            expect(sourcemap.mappings).toBeDefined();
            expect(sourcemap.mappings.length).toBe(462);
            expect(sourcemap.sourcesContent.toString()).toEqual(joinLines([
              `/* eslint-disable */`,
              ``,
              `'use strict';`,
              ``,
              `function sayHello() {`,
              `  console.log('Hello World');`,
              `}`,
              ``,
            ]));

            done();
          });
        });
  });

  it('should prepend header with file name', (done) => {
    const fname = 'test.js';
    const src = path.join(__dirname, 'fixtures', fname);
    const dest = path.join(tmpDir.name);

    const template = joinLines([
      'File path: <%= file.path %>',
      'File relative path: <%= file.relativePath %>',
      'File relative dir: <%= file.relativeDir %>',
      'File name: <%= file.name %>',
      'File dir: <%= file.dir %>',
    ]);

    gulp.src(src)
        .pipe(headerComment(template))
        .pipe(gulp.dest(dest))
        .on('error', (err) => done.fail(err))
        .on('end', () => {
          fs.readFile(path.join(dest, fname), 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
              return;
            }

            expect(data).toEqual(joinLines([
              `/**`,
              ` * File path: ${path.normalize(src)}`,
              ` * File relative path: ${path.normalize('test/fixtures/test.js')}`,
              ` * File relative dir: ${path.normalize('test/fixtures')}`,
              ` * File name: test.js`,
              ` * File dir: ${path.normalize(path.dirname(src))}`,
              ` */`,
              ``,
              `/* eslint-disable */`,
              ``,
              `'use strict';`,
              ``,
              `function sayHello() {`,
              `  console.log('Hello World');`,
              `}`,
              ``,
            ]));

            done();
          });
        });
  });
});
