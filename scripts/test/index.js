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
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const path = require('node:path');
const gulp = require('gulp');
const Jasmine = require('jasmine');
const build = require('../build');
const config = require('../config');
const { readCliOptions } = require('../cli');

/**
 * Remove project modules (i.e not in `node_modules`) from the require cache, so that
 * successive runs (in `tdd` mode) load fresh sources and specs.
 *
 * @return {void}
 */
function deleteRequireCache() {
  Object.keys(require.cache).forEach((id) => {
    if (id.startsWith(config.root) && !id.includes('node_modules')) {
      delete require.cache[id];
    }
  });
}

/**
 * Run unit test suite (or the subset selected with `--file` / `--filter`).
 *
 * @return {Promise<void>} A promise resolved when the test suite succeeds, rejected otherwise.
 */
function test() {
  const { files, filter } = readCliOptions();

  deleteRequireCache();

  const runner = new Jasmine({
    projectBaseDir: config.root,
  });

  runner.loadConfig({
    spec_dir: path.relative(config.root, config.test),
    spec_files: [
      '**/*.spec.js',
    ],
  });

  return new Promise((resolve, reject) => {
    // Replace the default completion handler, which would exit the process.
    runner.onComplete((passed) => {
      if (passed) {
        resolve();
      } else {
        reject(new Error('JasmineError'));
      }
    });

    runner.execute(files, filter);
  });
}

/**
 * Watch for changes, and run unit test suite on every change.
 *
 * @param {function} done The `done` callback.
 * @return {void}
 */
function tdd(done) {
  gulp.watch(path.join(config.dist, '**', '*.js'), test);
  gulp.watch(path.join(config.src, '**', '*.js'), build);
  gulp.watch(path.join(config.test, '**', '*.js'), test);
  done();
}

module.exports = {
  tdd,
  test,
};
