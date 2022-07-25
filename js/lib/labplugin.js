var plugin = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'evince:plugin',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'evince',
          version: plugin.version,
          exports: plugin
      });
  },
  autoStart: true
};

