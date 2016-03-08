// Gulp related
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var del = require('del');

// Metalsmith related
var Metalsmith = require('metalsmith');
var nunjucks = require('nunjucks');
// https://github.com/superwolff/metalsmith-layouts/issues/43
nunjucks.configure('./templates', {watch: false});
var ms_moveUp = require('metalsmith-move-up');
var ms_changed = require('metalsmith-changed');
var ms_layouts = require('metalsmith-layouts');
var ms_inPlace = require('metalsmith-in-place');
var ms_markdown = require('metalsmith-markdown');
var ms_permalinks = require('metalsmith-permalinks');
var ms_collections = require('metalsmith-collections');
var ms_helpers = require('metalsmith-discover-helpers');
var ms_filemetadata = require('metalsmith-filemetadata');
var ms_html_minifier = require('metalsmith-html-minifier');

var force_build = true;
gulp.task('metalsmith', function() {
  return Metalsmith(__dirname)
  .source('src')
  .clean(false)
  .use(ms_changed({
    force: force_build,
    extnames: {
      '.md': '.html' // build if src/file.md is newer than build/file.html
    }
  }))
  .use(ms_collections({
    pages: {
      pattern: 'pages/**/*.html'
    },
    articles: {
      pattern: 'articles/*.md',
      sortBy: 'date',
      reverse: true
    }
  }))
  // Automatically pass data to file patterns
  .use(ms_filemetadata([
    {
      pattern: 'articles/*.md',
      metadata: {
        'layout': 'post.html'
      },
      preserve: true
    },
    {
      pattern: 'pages/*.md',
      metadata: {
        'layout': 'default.html'
      },
      preserve: true
    }
  ]))
  .use(ms_inPlace({
    engine: 'nunjucks'
  }))
  .use(ms_markdown())
  .use(ms_moveUp('pages/**/*'))
  .use(ms_layouts({
    engine: 'nunjucks',
    directory: 'templates',
    default: 'default.html'
  }))
  .use(ms_permalinks({
    linksets: [{
      match: { collection: 'articles' },
      pattern: 'articles/:title',
    }]
  }))
  // .use(function(files, metalsmith, done) {
  //   console.log(handlebars.helpers);
  //   console.log('Files: ');
  //   console.log(files);
  //   console.log();
  //   console.log('Metalsmith: ');
  //   console.log(metalsmith);
  // })
  //.use(ms_html_minifier())
  .destination('build')
  .build(function(err) {
    if (err) {
      throw err;
    }
    else {
      browserSync.reload();
    }
  });
});

gulp.task('clean', function() {
  return del([
    './build/**/*'
  ]);
});

gulp.task('watch', ['browser-sync'], function() {
    gulp.watch(['./src/**/*'], ['metalsmith']).on('change', function() {
      force_build = false;
    });
    gulp.watch(['./_layouts/*', '_partials/**/*'], ['metalsmith']).on('change', function() {
      force_build = true;
    });
});

// Static server
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: "./build"
    }
  });
});
