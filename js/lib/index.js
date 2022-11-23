// Export widget models and views, and the npm package version number.
//require('./mdview.js');
//require('./braketview.js');


//module.exports = require('./braketview.js');
//module.exports['MDView'] = require('./mdview.js');
//console.log(module.exports);

//module.exports = [
//    require('./mdview.js'),
//    require('./braketview.js')
//]

/*
const braketview = require('./braketview.js');
const mdview = require('./mdview.js');
const latticeview = require('./latticeview.js');
const spotlightview = require('./spotlightview.js');
const templateview = require('./templateview.js');
//module.exports = require('./mdview.js');


//module.exports = {
//    BraketView: braketview,
//    mdview: mdview,
//  };

module.exports = {
    BraketModel: braketview.BraketModel,
    BraketView: braketview.BraketView,
	MDModel: mdview.MDModel,
	MDView: mdview.MDView,
    LatticeModel: latticeview.LatticeModel,
	LatticeView: latticeview.LatticeView,
    SpotlightModel: spotlightview.SpotlightModel,
	SpotlightView: spotlightview.SpotlightView,
    TemplateModel: templateview.TemplateModel,
	TemplateView: templateview.TemplateView,
}

module.exports['version'] = require('../package.json').version;

*/


export {BraketModel, BraketView} from './braketview';
export {SpotlightModel, SpotlightView} from './spotlightview';
export {MDModel, MDView} from './mdview';
export {TemplateModel, TemplateView} from './templateview';
export {LatticeModel, LatticeView} from './latticeview';
export {FashionModel, FashionView} from './fashionview';
export {OmoviModel, OmoviView} from './omoviview';
export {version} from '../package.json';
