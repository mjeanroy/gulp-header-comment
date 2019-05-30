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
const Vinyl = require('vinyl');
const Stream = require('stream');
const moment = require('moment');
const gulpHeaderComment = require('../dist/index');
const EOL = '\n';

describe('gulp-header-comment', () => {
  let cwd;
  let base;

  beforeEach(() => {
    cwd = __dirname;
    base = path.join(cwd, 'fixtures');
  });

  it('should not prepend header with null file', (done) => {
    const filePath = path.join(base, 'test.js');
    const contents = null;
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const stream = gulpHeaderComment({
      file: path.join(base, 'test.txt'),
    });

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).toBeNull();
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with buffer content', (done) => {
    const filePath = path.join(base, 'test.js');
    const code = fs.readFileSync(filePath, 'utf-8');
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const headerFile = path.join(base, 'test.txt');
    const expectedHeader = joinLines([
      '/**',
      ' * Hello World',
      ' */',
      '',
    ]);

    const stream = gulpHeaderComment({
      file: headerFile,
    });

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).not.toBeNull();
      expect(newFile.contents.toString()).toEqual(joinLines([
        expectedHeader,
        code,
      ]));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with stream content', (done) => {
    const filePath = path.join(base, 'test.js');
    const code = fs.readFileSync(filePath, 'utf-8');
    expect(code).toBeTruthy();

    const contents = new Stream.Readable();
    contents.push(code);
    contents.push(null);

    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const headerFile = path.join(base, 'test.txt');
    const expectedHeader = joinLines([
      '/**',
      ' * Hello World',
      ' */',
      '',
    ]);

    const stream = gulpHeaderComment({
      file: headerFile,
    });

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).not.toBeNull();

      let newContent = '';

      newFile.contents.on('data', (chunk) => {
        newContent += chunk;
      });

      newFile.contents.once('end', () => {
        expect(newContent).toEqual(joinLines([
          expectedHeader,
          code,
        ]));

        done();
      });
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with CSS content', (done) => {
    const filePath = path.join(base, 'test.css');
    const code = fs.readFileSync(filePath);
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const headerFile = path.join(base, 'test.txt');
    const expectedHeader = joinLines([
      '/**',
      ' * Hello World',
      ' */',
      '',
    ]);

    const stream = gulpHeaderComment({
      file: headerFile,
    });

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).not.toBeNull();
      expect(newFile.contents.toString()).toEqual(joinLines([
        expectedHeader,
        code,
      ]));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header from a simple string', (done) => {
    const filePath = path.join(base, 'test.js');
    const code = fs.readFileSync(filePath);
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const header = 'Hello World';
    const expectedHeader = joinLines([
      '/**',
      ' * ' + header,
      ' */',
      '',
    ]);

    const stream = gulpHeaderComment(header);

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).not.toBeNull();
      expect(newFile.contents.toString()).toEqual(joinLines([
        expectedHeader,
        code,
      ]));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with custom separator', (done) => {
    const filePath = path.join(base, 'test.js');
    const code = fs.readFileSync(filePath, 'utf-8');
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const headerFile = path.join(base, 'test.txt');
    const expectedHeader = joinLines([
      '/**',
      ' * Hello World',
      ' */',
      '',
    ]);

    const separator = '//' + EOL;

    const stream = gulpHeaderComment({
      file: headerFile,
      separator,
    });

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).not.toBeNull();
      expect(newFile.contents.toString()).toEqual(expectedHeader + separator + code);
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with custom encoding', (done) => {
    const filePath = path.join(base, 'test.js');
    const code = fs.readFileSync(filePath, 'utf-8');
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const headerFile = path.join(base, 'test.txt');
    const encoding = 'ascii';

    const stream = gulpHeaderComment({
      file: headerFile,
      encoding,
    });

    spyOn(fs, 'readFile').and.callThrough();

    stream.on('data', () => {
      expect(fs.readFile).toHaveBeenCalledWith(jasmine.any(String), {encoding}, jasmine.any(Function));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with interpolated template', (done) => {
    const filePath = path.join(base, 'test.js');
    const code = fs.readFileSync(filePath, 'utf-8');
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const header = `Generated on <%= moment().format('YYYY') %>`;
    const expectedHeader = joinLines([
      '/**',
      ' * Generated on ' + moment().format('YYYY'),
      ' */',
      '',
    ]);

    const stream = gulpHeaderComment(header);

    stream.on('data', (newFile) => {
      expect(newFile.contents.toString()).toEqual(joinLines([
        expectedHeader,
        code,
      ]));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with data from package.json file', (done) => {
    const filePath = path.join(base, 'test.js');
    const code = fs.readFileSync(filePath, 'utf-8');
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const header = `Lib: <%= pkg.name %>`;
    const expectedHeader = joinLines([
      '/**',
      ' * Lib: gulp-header-comment',
      ' */',
      '',
    ]);

    const stream = gulpHeaderComment(header);

    stream.on('data', (newFile) => {
      expect(newFile.contents.toString()).toEqual(joinLines([
        expectedHeader,
        code,
      ]));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should fail if template file does not exist', (done) => {
    const filePath = path.join(base, 'test.js');
    const code = fs.readFileSync(filePath, 'utf-8');
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const stream = gulpHeaderComment({
      file: 'fake-file-that-does-not-exist',
    });

    stream.once('error', (err) => {
      expect(err).toBeDefined();
      done();
    });

    stream.once('end', () => {
      done.fail('Error should have been triggered');
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with configuration file such as .appacache', (done) => {
    const filePath = path.join(base, '.appcache');
    const code = fs.readFileSync(filePath);
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const headerFile = path.join(base, 'test.txt');

    const expectedHeader = joinLines([
      '#',
      '# Hello World',
      '#',
      '',
    ]);

    const stream = gulpHeaderComment({
      file: headerFile,
    });

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).not.toBeNull();
      expect(newFile.contents.toString()).toEqual(joinLines([
        expectedHeader,
        code,
      ]));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header with an unknown extension', (done) => {
    const filePath = path.join(base, 'test.appcache');
    const code = fs.readFileSync(filePath);
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const headerFile = path.join(base, 'test.txt');

    const expectedHeader = joinLines([
      '#',
      '# Hello World',
      '#',
      '',
    ]);

    const stream = gulpHeaderComment({
      file: headerFile,
    });

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).not.toBeNull();
      expect(newFile.contents.toString()).toEqual(joinLines([
        expectedHeader,
        code,
      ]));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  it('should prepend header not at first line with files such as SVG file', (done) => {
    const filePath = path.join(base, 'test.svg');
    const code = fs.readFileSync(filePath);
    expect(code).toBeTruthy();

    const contents = new Buffer(code);
    const vinyl = new Vinyl({cwd, base, contents, path: filePath});
    const headerFile = path.join(base, 'test.txt');

    const stream = gulpHeaderComment({
      file: headerFile,
    });

    stream.on('data', (newFile) => {
      expect(newFile).toBeDefined();
      expect(newFile.cwd).toEqual(cwd);
      expect(newFile.base).toEqual(base);
      expect(newFile.path).toEqual(filePath);
      expect(newFile.contents).not.toBeNull();
      expect(newFile.contents.toString()).toEqual(joinLines([
        '<?xml version="1.0" encoding="utf-8"?>',
        '',
        '<!--',
        ' // Hello World',
        '-->',
        '',
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="300" height="200">',
        '  <rect width="100" height="80" x="0" y="70" fill="green" />',
        '  <line x1="5" y1="5" x2="250" y2="95" stroke="red" />',
        '  <circle cx="90" cy="80" r="50" fill="blue" />',
        '  <text x="180" y="60">Un texte</text>',
        '</svg>',
        '',
      ]));
    });

    stream.once('error', (err) => {
      done.fail(err);
    });

    stream.once('end', () => {
      done();
    });

    stream.write(vinyl);
    stream.end();
  });

  /**
   * Join given strings with the EOL character.
   * @param {Array<string>} lines Given lines to join.
   * @return {string} Joined lines.
   */
  function joinLines(lines) {
    return lines.join(EOL);
  }
});
