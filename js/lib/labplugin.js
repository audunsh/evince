import {BraketModel, BraketView, version} from './index';
import {MDModel, MDView} from './index';
import {SpotlightModel, SpotlightView} from './index';
import {LatticeModel, LatticeView} from './index';
import {FashionModel, FashionView} from './index';
import {IJupyterWidgetRegistry} from '@jupyter-widgets/base';


//obsolete
/*
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

export const SpotlightViewPlugin = {
  id: 'evince:plugin',
  requires: [IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'evince',
          version: version,
          exports: { SpotlightModel, SpotlightView }
      });
  },
  autoStart: true
};*/

export const MDViewPlugin = {
  id: 'evince:plugin',
  requires: [IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'evince',
          version: version,
          exports: { MDModel, MDView, SpotlightModel, SpotlightView, BraketModel, BraketView,LatticeModel, LatticeView , FashionModel, FashionView, MorpheusModel, MorpheusView, DenseModel, DenseView}
      });
  },
  autoStart: true
};

export default MDViewPlugin;