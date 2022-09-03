var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var THREE = require('three');
var OrbitControls = require('three/examples/jsm/Controls/OrbitControls');

// See example.py for the kernel counterpart to this file.


// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var HelloModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'HelloModel',
        _view_name : 'HelloView',
        _model_module : 'evince',
        _view_module : 'evince',
        _model_module_version : '0.30.0',
        _view_module_version : '0.30.0',
        value : 'Hello World!'
    })
});

class TemplateModel extends widgets.DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'TemplateModel',
            _view_name : 'TemaplteView',
            _model_module : 'evince',
            _view_module : 'evince',
            _model_module_version : '0.30.0',
            _view_module_version : '0.30.0'
        };
    }
}


// Custom View. Renders the widget model.
class TemplateView extends widgets.DOMWidgetView {
    render() {

        // initialize the THREE.Scene object, the campera and the renderer
        const scene = new THREE.Scene();
		this.scene = scene;

        let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera = camera;
		this.camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer();
        this.renderer = renderer;

        // set the animation loop
        this.renderer.setAnimationLoop( function () {

            renderer.render( scene, camera );

        } );

        this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
        //this.renderer.setClearColor( 0xfaf8ec, 1);
        this.renderer.setClearColor( 0x0f0f2F, 1);
        this.renderer.antialias = true;


        // init user controls for the 3D scene
        let controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.controls = controls;







        this.value_changed();

        // Observe changes in the value traitlet in Python, and define
        // a custom callback.
        this.model.on('change:value', this.value_changed, this);
    }

    value_changed() {
        this.el.textContent = this.model.get('value');
    }
};


module.exports = {
    TemplateModel: TemplateModel,
    TemplateView: TemplateView
};
