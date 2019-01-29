'use strict';

// @include common.js
// @include client.js
// @include monaco-editor/dev/vs/loader.js
// @include monaco-editor/flame/editor.js

var env = {};
var ui = {
   loading: dom('#p_loading'),
   app: {
      self: dom('#p_app'),
   },
   editor: new FlameEditor(dom('#editor_container'))
};

require.config({ paths: {
   'vs': './js/monaco-editor/dev/vs',
   'flame': './js/monaco-editor/flame'
}});

function ui_loading() {
   ui.loading.classList.remove('hide');
   ui.app.self.classList.add('hide');
}

function ui_loaded() {
   ui.loading.classList.add('hide');
   ui.app.self.classList.remove('hide');
}

function before_login() {
   ui_loading();
}

function init_app() {
   reload_on_hashchange();
   load_code();
}

function error_file_not_found() {
   ui.loading.classList.remove('hide');
   ui.app.self.classList.add('hide');
   ui.loading.querySelector('#loading_text').innerHTML = '<strong>File Not Found!</storng>';
}

function load_code() {
   var hash = window.location.hash.substring(1).split('/');
   hash = {
      project: hash[1],
      path: '/' + hash.slice(2).join('/')
   };
   if (!hash.project || !hash.path) return error_file_not_found();
   var isdir = hash.path.charAt(hash.path.length-1) === '/';
   if (!isdir) {
      client.browse.get_file(
         env, hash.project, hash.path
      ).then(function (result) {
         if (!result) return error_file_not_found();
         ui.app.self.classList.remove('hide');
         ui.editor.resize();
         ui.editor.create(result.path, result.text);
         ui.editor.on_content_ready(ui_loaded);
      }, function () {
         error_file_not_found();
      });
   } else {
      client.browse.get_dir(
         env, hash.project, hash.path
      ).then(function (result) {
         if (!result) return error_file_not_found();
         ui.app.self.classList.remove('hide');
         ui.editor.resize();
         ui.editor.create(result.path + '.json', JSON.stringify(result.items));
         ui.editor.on_content_ready(ui_loaded);
      }, function () {
         error_file_not_found();
      })
   }
}

login_and_start(env, before_login, init_app, encode_url_for_login('view.html'));