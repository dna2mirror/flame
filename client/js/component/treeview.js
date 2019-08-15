'use strict';

// @include common.js
// @include client.js
// @require env (window.env -> username, uuid)

(function (window, document) {
   function FlameTreeNode(name, metadata) {
      this.metadata = metadata;
      this.dom = document.createElement('div');
      this.buildDom({ name: name });
   }
   FlameTreeNode.prototype = {
      buildDom: function (options) {
         if (!options) options = {};
         while(this.dom.children.length) {
            this.dom.removeChild(this.dom.children[0]);
         }
         this.component = {
            updown: document.createElement('a'),
            title: document.createElement('span'),
            view: document.createElement('div'),
            children: []
         };
         var name = options.name || '(unamed)';
         set_text_component(this.component.title, name);
         if (name.endsWith('/')) {
            set_text_component(this.component.updown, ' + ');
            this.component.title.classList.add('treeview-diritem');
         } else {
            set_text_component(this.component.updown, '   ');
            this.component.title.classList.add('treeview-item');
         }
         this.component.updown.classList.add('treeview-icon');
         this.component.view.style.paddingLeft = '10px';
         this.component.view.style.display = 'none';
         var div = document.createElement('div');
         div.classList.add('treeview-nowrap');
         div.appendChild(this.component.updown);
         div.appendChild(this.component.title);
         this.dom.setAttribute('data-name', name);
         this.dom.appendChild(div);
         this.dom.appendChild(this.component.view);
      }
   };

   function get_tree_path(root, dom) {
      var path = [];
      while (dom && dom !== root) {
         path.push(dom);
         dom = dom.parentNode;
      }
      path = path.map((x) => x.getAttribute('data-name')).filter((x) => !!x);
      path.reverse();
      return path;
   }
   function tree_node_loading(root_dom, dom, fn) {
      return new Promise((r, e) => {
         var updown_dom = dom.children[0].children[0];
         var children_panel = dom.children[1];
         if (children_panel.getAttribute('data-status') === 'complete') {
            children_panel.style.display = 'block';
            set_text_component(updown_dom, ' - ');
            r(children_panel);
            return;
         }
         children_panel.setAttribute('data-status', 'loading');
         var path = get_tree_path(root_dom, updown_dom).join('');
         var parts = path.split('/');
         var project = parts[0];
         var dirpath = '/' + parts.slice(1).join('/');
         client.browse.get_dir(env, project, dirpath).then(function (res) {
            if (fn && !fn()) return r(null);
            if (!res || !res.items) return r(null);
            children_panel.style.display = 'none';
            reset_component(children_panel);
            res.items.forEach(function (item) {
               if (!item.name) return;
               var node = new FlameTreeNode(item.name);
               children_panel.appendChild(node.dom);
            });
            children_panel.style.display = 'block';
            children_panel.setAttribute('data-status', 'complete');
            set_text_component(updown_dom, ' - ');
            r(children_panel);
         }, function () {
            if (fn && !fn()) return e();
            set_text_component(updown_dom, ' + ');
            e();
         });
         set_text_component(updown_dom, ' o ');
      });
   }
   function FlameTreeView(dom) {
      this.dom = dom;

      var _this = this;
      this.dom.addEventListener('click', function (evt) {
         var target = evt.target;
         if (target.classList.contains('treeview-item')) {
            var path = get_tree_path(_this.dom, target).join('');
            window.location.hash = '/' + path;
            return;
         }
         if (target.classList.contains('treeview-diritem')) {
            target = target.parentNode.children[0];
         }
         if (target.classList.contains('treeview-icon')) {
            var children_panel = target.parentNode.parentNode.children[1];
            if (children_panel.getAttribute('data-status') === 'loading') {
               return;
            }
            if (children_panel.style.display === 'block') {
               children_panel.style.display = 'none';
               set_text_component(target, ' + ');
            } else if (children_panel.getAttribute('data-status') === 'complete') {
               children_panel.style.display = 'block';
               set_text_component(target, ' - ');
            } else {
               tree_node_loading(_this.dom, target.parentNode.parentNode);
            }
         }
      });
   }
   FlameTreeView.prototype = {
      resize: function () {
         var container = get_dom_parent_by_class_name(this.dom, 'content-container');
         var height = Math.floor(window.innerHeight - (container?container.offsetTop:0) - 40);
         this.dom.parentNode.style.height = height + 'px';
      },
      expand: function () {
         var hash = window.location.hash;
         var parts = hash.substring(1).split('/');
         // #/project/path
         var project = parts[1];
         var i = 1;
         if (!parts[parts.length - 1]) parts.pop();
         var need_new_node = true;
         // fold all items
         for (var j = 0, n = this.dom.children.length; j < n; j++) {
            var project_item = this.dom.children[j];
            if (project_item.children[1].style.display === 'block') {
               project_item.children[1].style.display = 'none';
               set_text_component(project_item.children[0].children[0], ' + ');
            }
         }
         for (var j = 0, n = this.dom.children.length; j < n; j++) {
            if (this.dom.children[j].getAttribute('data-name') === project + '/') {
               need_new_node = false;
               break;
            }
         }
         if (need_new_node) {
            var node = new FlameTreeNode(project + '/');
            this.dom.appendChild(node.dom);
         }
         expand_one(this.dom, this.dom, parts, i);

         function expand_one(root, dom, list, i) {
            if (hash !== window.location.hash) return;
            var name = list[i] + '/';
            if (!name) return;
            for (var j = 0, n = dom.children.length; j < n; j++) {
               var childom = dom.children[j];
               if (childom.getAttribute('data-name') !== name) continue;
               tree_node_loading(
                  root, childom, function () { return hash === window.location.hash }
               ).then(function (dom) {
                  if (!dom) return;
                  expand_one(root, dom, list, i+1);
               }, function (err) {
                  console.log('cannot load tree view ...', err);
               });
               break;
            }
         }
      }
   };
   window.FlameTreeView = FlameTreeView;
})(window, document);