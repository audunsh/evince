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
const braketview = require('./braketview.js');
const mdview = require('./mdview.js');
const latticeview = require('./latticeview.js');
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
}

module.exports['version'] = require('../package.json').version;
