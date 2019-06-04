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

var fs = require('fs');

var path = require('path');

var stringDecoder = require('string_decoder');

var log = require('fancy-log');

var colors = require('ansi-colors');

var PluginError = require('plugin-error');

var _ = require('lodash');

var moment = require('moment');

var commenting = require('commenting');

var through = require('through2');

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
      var extension = getExtension(file);
      var type = extension.slice(1);
      var header = generateHeader(content, extension, pkg);

      if (file.isBuffer()) {
        updateFileContent(file, type, header, separator);
      } else if (file.isStream()) {
        pipeFileContent(file, type, header, separator);
      }

      cb(null, file);
    })["catch"](function (err) {
      // Log error.
      log.error(colors.red("gulp-header-comment: ".concat(err))); // Wrap error.

      cb(new PluginError('gulp-header-comment', err));
    });
  });
};
/**
 * Add header to given file content.
 *
 * @param {Object} file Original file.
 * @param {string} type File type.
 * @param {string} header Header to add to given file.
 * @param {string} separator The separator to use between header and file content.
 * @return {void}
 */


function updateFileContent(file, type, header, separator) {
  file.contents = new Buffer(addHeader(file.contents.toString(), type, header, separator));
}
/**
 * Stream new file content.
 *
 * @param {File} file Given input file.
 * @param {string} type The file type.
 * @param {string} header Header to add to given file.
 * @param {string} separator Separator between header and file content.
 * @return {void}
 */


function pipeFileContent(file, type, header, separator) {
  return maySkipFirstLine(type) ? transformFileStreamContent(file, type, header, separator) : prependPipeStream(file, header, separator);
}
/**
 * A very simple function that prepend header to file stream input.
 *
 * @param {File} file The original file stream.
 * @param {string} header The header to prepend to original file stream.
 * @param {string} separator The separator to use between header and file content.
 * @return {void}
 */


function prependPipeStream(file, header, separator) {
  var stream = through();
  stream.write(new Buffer(header + separator));
  file.contents = file.contents.pipe(stream);
}
/**
 * A very simple function that prepend header to file stream input.
 *
 * @param {File} file The original file stream.
 * @param {string} type File type.
 * @param {string} header The header to prepend to original file stream.
 * @param {string} separator The separator to use between header and file content.
 * @return {void}
 */


function transformFileStreamContent(file, type, header, separator) {
  file.contents = file.contents.pipe(through(function transformFunction(chunk, enc, cb) {
    var decoder = new stringDecoder.StringDecoder();
    var rawChunk = decoder.end(chunk);
    var newContent = addHeader(rawChunk, type, header, separator); // eslint-disable-next-line no-invalid-this

    this.push(newContent);
    cb();
  }));
}
/**
 * Get extension for given file.
 *
 * @param {Object} file The file.
 * @return {string} File extension.
 */


function getExtension(file) {
  var ext = path.extname(file.path);
  return ext ? ext.toLowerCase() : ext;
}
/**
 * Generate header from given template.
 *
 * @param {string} content Template of header.
 * @param {string} extension Target file extension.
 * @param {Object} pkg The `package.json` descriptor that will be injected when template will be evaluated.
 * @return {string} Interpolated header.
 */


function generateHeader(content, extension, pkg) {
  var templateFn = _.template(content);

  var template = templateFn({
    _: _,
    moment: moment,
    pkg: pkg
  });
  return commenting(template.trim(), {
    extension: extension
  });
}
/**
 * Add header to given file content.
 *
 * @param {string} content Original file content.
 * @param {string} type Original file type.
 * @param {string} header The header to add.
 * @param {string} separator The separator to use between original file content and separator.
 * @return {string} The resulting file content.
 */


function addHeader(content, type, header, separator) {
  if (!maySkipFirstLine(type)) {
    return prependHeader(content, header, separator);
  }

  var lineSeparator = '\n';
  var lines = content.split(lineSeparator);
  var firstLine = lines[0].toLowerCase();

  var trimmedFirstLine = _.trim(firstLine);

  if (!shouldSkipFirstLine(type, trimmedFirstLine)) {
    return prependHeader(content, header, separator);
  }

  var otherLines = lines.slice(1).join(lineSeparator);
  return lines[0] + separator + separator + header + separator + otherLines;
}
/**
 * Prepend header to given file content.
 *
 * @param {string} content Original file content.
 * @param {string} header Header to prepend.
 * @param {string} separator The separator between header and file content.
 * @return {string} The resulting file content.
 */


function prependHeader(content, header, separator) {
  return header + separator + content;
} // Set of checker function for each file type that may start with a prolog ling.


var prologCheckers = {
  /**
   * Check that given line is the `DOCTYPE` line.
   *
   * @param {string} line The line to check.
   * @return {boolean} `true` if given is an HTML `DOCTYPE`, `false` otherwise.
   */
  htm: function htm(line) {
    return this.html(line);
  },

  /**
   * Check that given line is the `DOCTYPE` line.
   *
   * @param {string} line The line to check.
   * @return {boolean} `true` if given is an HTML `DOCTYPE`, `false` otherwise.
   */
  html: function html(line) {
    return _.startsWith(line, '<!doctype');
  },

  /**
   * Check that given line is the `XML` line.
   *
   * @param {string} line The line to check.
   * @return {boolean} `true` if given is an HTML `XML`, `false` otherwise.
   */
  xml: function xml(line) {
    return _.startsWith(line, '<?xml');
  },

  /**
   * Check that given line is the `XML` line.
   *
   * @param {string} line The line to check.
   * @return {boolean} `true` if given is an HTML `XML`, `false` otherwise.
   */
  svg: function svg(line) {
    return this.xml(line);
  }
};
/**
 * Check if given file type (`js`, `xml`, etc.) may start with a given prolog (a.k.a declaration).
 * For example, XML/SVG files may include a prolog such as `<?xml version="1.0" encoding="UTF-8"?>` and this
 * prolog must always be the first line (before anything else, including comments).
 *
 * @param {string} type File type.
 * @return {boolean} `true` if given file type may start with a prolog, `false` otherwise.
 */

function maySkipFirstLine(type) {
  return _.has(prologCheckers, type);
}
/**
 * Check if given line should be skipped before adding header content.
 *
 * @param {string} type File type.
 * @param {string} line The first line of given file.
 * @return {boolean} `true` if given line should be skipped, `false` otherwise.
 */


function shouldSkipFirstLine(type, line) {
  return prologCheckers[type](line);
}