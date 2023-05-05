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
export class PointModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name: 'PointModel',
            _view_name: 'PointView',
            _model_module: 'evince',
            _view_module: 'evince',
            _model_module_version: '0.56.0',
            _view_module_version: '0.56.0'
        };
    }
}


// Custom View. Renders the widget model.
export class PointView extends DOMWidgetView {
    render() {

        // initialize the THREE.Scene object, the campera and the renderer
        const scene = new THREE.Scene();
        this.scene = scene;

        let camera = new THREE.PerspectiveCamera(75, document.activeElement.clientWidth / (document.activeElement.clientWidth * .6), 0.1, 1000);

        //let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera = camera;
        this.camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer();
        this.renderer = renderer;
        renderer.setPixelRatio(window.devicePixelRatio);

        // set the animation loop
        //this.renderer.setAnimationLoop( this.animationLoop );

        //this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
        this.renderer.setSize(.99 * document.activeElement.clientWidth, .99 * document.activeElement.clientWidth * .6);

        //this.renderer.setClearColor( 0xfaf8ec, 1);
        const bg_color = new THREE.Color(this.model.get("background_color")[0], this.model.get("background_color")[1], this.model.get("background_color")[2]);

        this.renderer.setClearColor(bg_color, 1);
        //this.renderer.setClearColor(0x0f0f2F, 1);
        this.renderer.antialias = true;


        // init user controls for the 3D scene
        let controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls = controls;

        this.renderer.render(this.scene, this.camera);

        this.el.append(this.renderer.domElement);

        // add objects to the scene here

        const particles = 500000;

        const geometry = new THREE.BufferGeometry();

        const positions = [];
        const colors = [];

        const color = new THREE.Color();

        const n = 1000, n2 = n / 2; // particles spread in the cube

        for (let i = 0; i < particles; i++) {

            // positions

            const x = Math.random() * n - n2;
            const y = Math.random() * n - n2;
            const z = Math.random() * n - n2;

            positions.push(x, y, z);

            // colors

            const vx = (x / n) + 0.5;
            const vy = (y / n) + 0.5;
            const vz = (z / n) + 0.5;

            color.setRGB(vx, vy, vz);

            colors.push(color.r, color.g, color.b);

        }

        //geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        //geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

        //console.log(this.pos.size);

        //
        this.col = this.model.get('col');
        let colorFloat32 = new Float32Array(this.col.buffer); //, 3);

        //console.log(colorFloat32.length / 3);

        geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(colorFloat32, 3, false)
        );


        this.pos = this.model.get('pos');
        let positionFloat32 = new Float32Array(this.pos.buffer); //, 3);
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positionFloat32, 3, false)
        );

        geometry.computeBoundingSphere();

        geometry.needsUpdate = true;
        //geometry.attributes.position.needsUpdate = true;

        const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true });



        let points = new THREE.Points(geometry, material);
        this.scene.add(points);









        this.value_changed();
        this.pos_changed();

        // Observe changes in the value traitlet in Python, and define
        // a custom callback.
        this.model.on('change:value', this.value_changed, this);

        this.model.on('change:pos', this.pos_changed, this);
        this.model.on('change:col', this.color_changed, this);


        animate();

        function animate() {
            renderer.setAnimationLoop(render);

        }

        //var self = this;

        function render() {



            renderer.render(scene, camera);

        }


    }




    value_changed() {
        //this.el.textContent = this.model.get('value');
        console.log("value_changed");
    }

    pos_changed() {
        //console.log("changed_pos");
        //console.log(this.scene.children[0].geometry.attributes);
        //console.log(this.scene.children[0].geometry.attributes.position.count);




        this.pos = this.model.get('pos');
        let positionFloat32 = new Float32Array(this.pos.buffer); //, 3);



        //this.scene.children[0].geometry.addAttribute('position', new THREE.Float32BufferAttribute(positionFloat32, 3));

        console.log(this.scene.children[0].material);

        this.scene.children[0].geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positionFloat32, 3, false)
        );


        this.scene.children[0].geometry.attributes.position.needsUpdate = true;
        //this.scene.children[0].geometry.needsUpdate = true;

        //console.log(positionFloat32);

        //this.scene.children[0].count = aCurveFloat32.length/3;

        //console.log(this.scene.children[0].geometry.attributes.position);





    }

    color_changed() {
        //console.log("changed_pos");

        this.col = this.model.get('col');
        let colorFloat32 = new Float32Array(this.col.buffer); //, 3);

        //this.scene.children[0].count = aCurveFloat32.length/3;

        this.scene.children[0].geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(colorFloat32, 3, false)
        );

        this.scene.children[0].geometry.attributes.color.needsUpdate = true;
    }
};
