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
const log = require('fancy-log');
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const jasmine = require('gulp-jasmine');
const babel = require('gulp-babel');
const git = require('gulp-git');
const bump = require('gulp-bump');
const del = require('del');
const runSequence = require('run-sequence');

gulp.task('clean', () => {
  return del([
    path.join(__dirname, 'dist'),
  ]);
});

gulp.task('lint', () => {
  gulp.task('lint', () => {
    const sources = [
      path.join(__dirname, '*.js'),
      path.join(__dirname, 'src', '**', '*.js'),
      path.join(__dirname, 'test', '**', '*.js'),
    ];

    return gulp.src(sources)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
  });
});

gulp.task('build', ['lint', 'clean'], () => {
  const dist = path.join(__dirname, 'dist');
  const sources = [
    path.join(__dirname, 'src', '**', '*.js'),
  ];

  return gulp.src(sources)
      .pipe(babel())
      .pipe(gulp.dest(dist));
});

gulp.task('test', ['build'], () => {
  const testFiles = path.join(__dirname, 'test', '**', '*spec.js');
  return gulp.src(testFiles).pipe(jasmine());
});

gulp.task('commit:pre', () => {
  const dist = path.join(__dirname, 'dist');
  const packageJson = path.join(__dirname, 'package.json');
  return gulp.src([packageJson, dist])
      .pipe(git.add({args: '-f'}))
      .pipe(git.commit('release: release version'));
});

gulp.task('commit:post', () => {
  const dist = path.join(__dirname, 'dist');
  return gulp.src(dist)
      .pipe(git.rm({args: '-r'}))
      .pipe(git.commit('release: prepare next release'));
});

gulp.task('tag', (done) => {
  const pkg = require('./package.json');
  const version = pkg.version;
  git.tag(`v${version}`, `release: tag version ${version}`, done);
});

['major', 'minor', 'patch'].forEach((level) => {
  gulp.task(`bump:${level}`, () => {
    return gulp.src(path.join(__dirname, 'package.json'))
        .pipe(bump({type: level}))
        .on('error', (e) => log.error(e))
        .pipe(gulp.dest(__dirname));
  });

  gulp.task(`release:${level}`, ['build'], () => {
    runSequence(`bump:${level}`, 'commit:pre', 'tag', 'commit:post');
  });
});
