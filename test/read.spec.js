/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017-2019 Mickael Jeanroy
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
const read = require('../src/read');

describe('read', () => {
  beforeEach(() => {
    spyOn(fs, 'readFile').and.callThrough();
  });

  it('should read file and return a promise of the content', (done) => {
    const file = path.join(__dirname, 'fixtures', 'test.txt');
    const promise = read({file});

    expect(fs.readFile).toHaveBeenCalledWith(file, {encoding: 'utf-8'}, jasmine.any(Function));

    promise
        .then((content) => {
          expect(content).toBeDefined();
          expect(content.trim()).toEqual('Hello World');
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
  });

  it('should read file using custom encoding and return a promise of the content', (done) => {
    const file = path.join(__dirname, 'fixtures', 'test.txt');
    const encoding = 'ascii';
    const promise = read({file, encoding});

    expect(fs.readFile).toHaveBeenCalledWith(file, {encoding}, jasmine.any(Function));

    promise
        .then((content) => {
          expect(content).toBeDefined();
          expect(content.trim()).toEqual('Hello World');
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
  });

  it('should return a promise of a simple string', (done) => {
    const txt = 'Hello World';
    const promise = read(txt);

    expect(fs.readFile).not.toHaveBeenCalled();

    promise
        .then((content) => {
          expect(content).toBeDefined();
          expect(content).toEqual(txt);
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
  });

  it('should return a rejected promise if file cannot be read', (done) => {
    const file = path.join(__dirname, 'fixtures', 'fake.txt');
    const promise = read({file});

    promise
        .then((content) => {
          done.fail('Promise should be rejected');
        })
        .catch((err) => {
          expect(err).toBeDefined();
          done();
        });
  });
});
