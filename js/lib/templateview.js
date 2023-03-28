import { DOMWidgetModel, DOMWidgetView } from '@jupyter-widgets/base';

import * as THREE from 'three';
//var THREE = require('three');
import { OrbitControls } from 'three/examples/jsm/Controls/OrbitControls.js';
//import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';


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
export class TemplateModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'TemplateModel',
            _view_name : 'TemplateView',
            _model_module : 'evince',
            _view_module : 'evince',
            _model_module_version : '0.55.0',
            _view_module_version : '0.55.0'
        };
    }
}


// Custom View. Renders the widget model.
export class TemplateView extends DOMWidgetView {
    render() {

        // initialize the THREE.Scene object, the campera and the renderer
        const scene = new THREE.Scene();
		this.scene = scene;

        let camera = new THREE.PerspectiveCamera( 75, document.activeElement.clientWidth/(document.activeElement.clientWidth*.6), 0.1, 1000 );
        
        //let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera = camera;
		this.camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer();
        this.renderer = renderer;
        renderer.setPixelRatio( window.devicePixelRatio );

        // set the animation loop
        //this.renderer.setAnimationLoop( this.animationLoop );

        //this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
        this.renderer.setSize( .99*document.activeElement.clientWidth, .99*document.activeElement.clientWidth*.6);
        
        //this.renderer.setClearColor( 0xfaf8ec, 1);
        this.renderer.setClearColor( 0x0f0f2F, 1);
        this.renderer.antialias = true;


        // init user controls for the 3D scene
        let controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls = controls;

        this.renderer.render(this.scene, this.camera);

        this.el.append(this.renderer.domElement);

        // add objects to the scene here

        let baseGeometry = new THREE.SphereBufferGeometry(1.0, 20, 10);
        let material = new THREE.MeshStandardMaterial( );
        material.roughness = 0.2;
        material.metalness = 0.2;
        let mesh = new THREE.Mesh( baseGeometry, material );

        this.scene.add(mesh);








        this.value_changed();

        // Observe changes in the value traitlet in Python, and define
        // a custom callback.
        this.model.on('change:value', this.value_changed, this);

        animate();

		function animate() {
			renderer.setAnimationLoop( render );

		}

		function render() {
			renderer.render( scene, camera );

		}


    }




    value_changed() {
        //this.el.textContent = this.model.get('value');
        console.log("value_changed");
    }
};
