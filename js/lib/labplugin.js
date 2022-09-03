import {BraketModel, BraketView, version} from './index';
import {IJupyterWidgetRegistry} from '@jupyter-widgets/base';


export const BraketViewPlugin = {
  id: 'evince:plugin',
  requires: [IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'evince',
          version: version,
          exports: { BraketModel, BraketView }
      });
  },
  autoStart: true
};

export default BraketViewPlugin;

