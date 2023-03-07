import { DOMWidgetModel, DOMWidgetView } from '@jupyter-widgets/base';

import * as THREE from 'three';
//var THREE = require('three');
import { OrbitControls } from 'three/examples/jsm/Controls/OrbitControls.js';
//import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { HemisphereLight, MeshPhongMaterial } from 'three';


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
export class DenseModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'DenseModel',
            _view_name : 'DenseView',
            _model_module : 'evince',
            _view_module : 'evince',
            _model_module_version : '0.53.0',
            _view_module_version : '0.53.0'
        };
    }
}


// Custom View. Renders the widget model.
export class DenseView extends DOMWidgetView {
    render() {

        // initialize the THREE.Scene object, the campera and the renderer
        const scene = new THREE.Scene();
        const postprocessing = {};

		this.scene = scene;

        this.pos = this.model.get('pos');

        let camera = new THREE.PerspectiveCamera( 50, document.activeElement.clientWidth/(document.activeElement.clientWidth*.65), 0.1, 1000 );
        
        //let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera = camera;
		this.camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer();
        this.renderer = renderer;
        renderer.setPixelRatio( window.devicePixelRatio );

        // set the animation loop
        //this.renderer.setAnimationLoop( this.animationLoop );

        //this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
        this.renderer.setSize( document.activeElement.clientWidth,document.activeElement.clientWidth*.65);
        
        //this.renderer.setClearColor( 0xfaf8ec, 1);
        this.renderer.setClearColor(0x1f1e1c, 1);
        this.renderer.antialias = true;


        // init user controls for the 3D scene
        let controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls = controls;

        this.renderer.render(this.scene, this.camera);

        this.el.append(this.renderer.domElement);

        // add objects to the scene here
        //let geometry = new THREE.BufferGeometry();

        //let aCurveFloat32 = new Float32Array(this.pos.buffer); //, 3);

        //geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );

        const plane_1_geometry = new THREE.PlaneGeometry( 1, 1 );
        const plane_1_material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        let plane_1_mesh = new THREE.Mesh( plane_1_geometry, plane_1_material );

        this.scene.add(plane_1_mesh);



        let geometry = new THREE.BufferGeometry();
        // create a simple square shape. We duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.
        let vertices = new Float32Array( [
            -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,
            1.0,  1.0,  1.0,

            1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0, -1.0,  1.0
        ] );

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3, false)
        );

        //geometry.needsUpdate = true;
        //geometry.attributes.normal.needsUpdate = true;
        //geometry.attributes.color.needsUpdate = true;



        //let baseGeometry = new THREE.SphereBufferGeometry(1.0, 20, 10);
        //let material = new THREE.MeshStandardMaterial( );
        //let material = new THREE.MeshStandardMaterial({ color: 0x2B2B2B });
        //material.roughness = 0.2;
        //material.metalness = 0.2;
            

        //let material2 = new THREE.MeshPhysicalMaterial({  
        //    roughness: 0.7,   
        //    transmission: 0.5,  
        //    thickness: 0.7
        //});
        //material2.color = new THREE.Color(70,70,98);

        let material = new THREE.MeshPhysicalMaterial({
            metalness: 1.0,
            roughness: 0.27,
            metalness: 1.0,
            reflectivity: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.49
        });

        /*
        let material = new THREE.MeshPhysicalMaterial({
            roughness: 0.0,
            transmission: 0.8
        });*/

        material.needsUpdate = true;
        



        let mesh = new THREE.Mesh( geometry, material );
        mesh.needsUpdate = true;
        //mesh.color = new THREE.Color(0.7,0.7,0.98);
        //mesh.color = new THREE.Color(70,70,98);

        this.scene.add(mesh);


        let light = new THREE.DirectionalLight(0xfff0dd, 1);
        light.position.set(0, 5, 10);
        this.scene.add(light);
        
        /*
        let directionalLight = new THREE.DirectionalLight( 0x555555, .5 );
        directionalLight.position.set( 1, 1, 1 );
        this.scene.add( directionalLight );

        let alight = new THREE.AmbientLight( 0x202020, .1 ); // soft white light
        this.scene.add( alight );
        */










        this.value_changed();
        this.pos_changed();
        this.tex_changed();

        // Observe changes in the value traitlet in Python, and define
        // a custom callback.
        this.model.on('change:value', this.value_changed, this);
        this.model.on('change:pos', this.pos_changed, this);

        this.model.on('change:tex', this.tex_changed, this);


        

        const renderPass = new RenderPass( this.scene, this.camera );
        const composer = new EffectComposer( this.renderer );
        composer.addPass( renderPass );

        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = 0.5;
        bloomPass.strength = 0.5;
        bloomPass.radius = 0.5;
        //composer.addPass( bloomPass );


        const bokehPass = new BokehPass( this.scene,this.camera, {
            focus: 1.0,
            aperture:0.002 ,
            maxblur: 0.01,

            width: this.model.get("window_scale")*document.activeElement.clientWidth,
            height: this.model.get("window_scale")*document.activeElement.clientWidth*.65
        } );
        bokehPass.needsSwap = true;
        composer.addPass( bokehPass );
        postprocessing.bokeh = bokehPass;

        postprocessing.composer = composer;
        

		//this.renderer.autoClear = false;

        

        this.renderer.autoClear = false;

        animate();

		function animate() {
			renderer.setAnimationLoop( render );

		}

		function render() {
            postprocessing.composer.render(  );
			renderer.render( scene, camera );

		}


    }




    value_changed() {
        //this.el.textContent = this.model.get('value');
        console.log("value_changed");
    }

    pos_changed() {
        console.log("changed_pos");
        
        this.pos = this.model.get('pos');
        let aCurveFloat32 = new Float32Array(this.pos.buffer); //, 3);

        //this.scene.children[0].count = aCurveFloat32.length/3;

        this.scene.children[0].geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(aCurveFloat32, 3, false)
        );
        
        //this.scene.children[0].geometry.needsUpdate = true;
        //this.scene.children[0].geometry.attributes.normal.needsUpdate = true;
        //this.scene.children[0].geometry.attributes.color.needsUpdate = true;
        //.attributes.aCurve.needsUpdate = true;
        }

    tex_changed() {
            console.log("changed_texture");
            
            this.pos = this.model.get('tex');
            this.size = this.model.get('size');
            let data = new Uint8Array(this.tex.buffer); //, 3);
    

            //const texture = new THREE.DataTexture( data, this.size[0], this.size[1] );
            
            //const size = width * height;
            //const data = new Uint8Array( 4 * size );

            //texture.needsUpdate = true;


            this.scene.children[0].material.map =  new THREE.DataTexture( data, this.size[0], this.size[1] );
            this.scene.children[0].material.map.needsUpdate = true;
            
            //this.scene.children[0].count = aCurveFloat32.length/3;
    
            /*
            this.scene.children[0].geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(aCurveFloat32, 3, false)
            );
            
            this.scene.children[0].geometry.needsUpdate = true;
            */
            //.attributes.aCurve.needsUpdate = true;
            }


};
