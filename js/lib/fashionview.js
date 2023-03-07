import { DOMWidgetModel, DOMWidgetView } from '@jupyter-widgets/base';

import * as THREE from 'three';
//var THREE = require('three');
import { OrbitControls } from 'three/examples/jsm/Controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { ConeBufferGeometry } from 'three';

// See fashionview.py for the kernel counterpart to this file.


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
export class FashionModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'FashionModel',
            _view_name : 'FashionView',
            _model_module : 'evince',
            _view_module : 'evince',
            _model_module_version : '0.53.0',
            _view_module_version : '0.53.0'
        };
    }
}


// Custom View. Renders the widget model.
export class FashionView extends DOMWidgetView {

    render() {
        super.render();
        const scene = new THREE.Scene();
        const postprocessing = {};

        this.scene = scene;

        // list to contain selected atoms (synchronized with Python-kernel)
        let selection = [];



        

        let selectedObject = null;
        

		let camera = new THREE.PerspectiveCamera( 75, document.activeElement.clientWidth/(document.activeElement.clientWidth*.6), 0.1, 1000 );
        this.camera = camera;
        this.camera.position.z = 5;

        this.camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.6);
        this.camera.updateProjectionMatrix();
        
        const renderer = new THREE.WebGLRenderer();
        
        renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer = renderer;
        
        this.el.appendChild( VRButton.createButton( this.renderer ) );
		


		this.renderer.setSize( document.activeElement.clientWidth, document.activeElement.clientWidth*.6);
		
		const bg_color = new THREE.Color(this.model.get("bg_color")[0],this.model.get("bg_color")[1],this.model.get("bg_color")[2] );

		this.renderer.setClearColor(bg_color, 1);

		
        this.renderer.antialias = true;
        this.renderer.xr.enabled = true;
        
        let controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls = controls;


        
        

       




        
        this.init_changed();
        this.el.append(this.renderer.domElement);
        this.el.appendChild( VRButton.createButton( renderer ) );
        this._pos_changed();
        this._bonds_changed();

        this.listenTo(this.model, 'change:pos', this._pos_changed, this);
        this.listenTo(this.model, 'change:bonds', this._bonds_changed, this);

        this.model.on('change:init', this.init_changed, this);
        
        
        const renderPass = new RenderPass( this.scene, this.camera );
        const composer = new EffectComposer( this.renderer );

        composer.addPass( renderPass );
        

        let raycaster = new THREE.Raycaster();
		let pointer = new THREE.Vector2();

        const gui = new GUI();

        let options  = this.model.get('options');

        let synchronized_text  = this.model.get('synchronized_text');


        // note: self.model.save_changes() has to be called in order to trigger kernel events (unsure as to why)
        
        gui.add( {python_display : function() { console.log( 0 ); self.model.set('kernel_task', 0); self.model.save_changes();}}, "python_display" ).name("info");   // Text Field

        
        // Chainable methods
        for(let i=0;i<options.length;i++){
            //gui.add( python_callback, 'function', i ).name( options[i] );
            gui.add({pythonback : function() { console.log( i ); self.model.set('kernel_task', i); self.model.save_changes();}}, 'pythonback').name( options[i] );

            
        }

        

        

        


        /* 
        Various post-processing effects

        sao - Screen space ambient occlusion
        source  : https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/SAOPass.js
        overview: https://people.mpi-inf.mpg.de/~ritschel/SSDO/index.html

        dof - depth of field
        source  : https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/BokehPass.js
        overview: https://people.mpi-inf.mpg.de/~ritschel/SSDO/index.html

        fxaa - fast approximate anti-aliasing
        source   - https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/FXAAShader.js
        overview - 10.1109/ICCRD54409.2022.9730249
        */
        
        
        

        if(this.model.get('sao')){
            const saoPass = new SAOPass( this.scene, this.camera, true, true );
		
            saoPass.params.saoScale = this.model.get('saoScale'); //0.7
            saoPass.params.saoBias =this.model.get('saoBias'); //-1,1
            saoPass.params.saoIntensity = this.model.get('saoIntensity'); //-1,1
            saoPass.params.saoKernelRadius = this.model.get('saoKernelRadius');

            saoPass.params.saoMinResolution = this.model.get('saoMinResolution');
            saoPass.params.saoBlur = this.model.get('saoBlur');
            saoPass.params.saoBlurRadius = this.model.get('saoBlurRadius');
            saoPass.params.saoBlurStdDev = this.model.get('saoBlurStdDev');
            saoPass.params.saoBlurDepthCutoff = this.model.get('saoBlurDepthCutoff');
            

            
            
            
            composer.addPass( saoPass );
            
            
        }

        if(this.model.get('dof')){
            const bokehPass = new BokehPass( this.scene,this.camera, {
                focus: this.model.get('focus'),
                aperture:this.model.get('aperture') ,
                maxblur: this.model.get('max_blur'),

                width: document.activeElement.clientWidth,
                height: document.activeElement.clientWidth*.6
            } );
            
            
            bokehPass.needsSwap = true;
            composer.addPass( bokehPass );
            postprocessing.bokeh = bokehPass;


        }

        if(this.model.get('fxaa')){
            const fxaaPass = new ShaderPass( FXAAShader );

            const pixelRatio = renderer.getPixelRatio();

            
            fxaaPass.uniforms[ 'resolution' ].value.set( 1 / ( pixelRatio*document.activeElement.clientWidth), 1 / (pixelRatio*document.activeElement.clientWidth*.6) );


            fxaaPass.renderToScreen = false;

            
            composer.addPass( fxaaPass );   
        }
        


        
        
        

        postprocessing.composer = composer;
        

		
        // event listeners for user interaction
        window.addEventListener( 'pointermove', onPointerMove );
        window.addEventListener( 'pointerdown', onPointerUp );
        window.addEventListener( 'click', onClick );

        // event listener for automatic window size
        window.addEventListener( 'resize', onWindowResize );


        //controllers for system editing
        function onWindowResize() {
            // when browser window is resized
            camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.6);
            camera.updateProjectionMatrix();
            renderer.setSize( document.activeElement.clientWidth, document.activeElement.clientWidth*.6 );
        }



        // functions synchronized to the python kernel

        // use a pointer to 'this' to access the instance inside the functions
        var self = this;


        function onPointerUp(){
            self.model.save_changes();
        }

        function onPointerMove(){
            self.model.save_changes();
        }

        function onClick( event ) {

            // pointer needs to refer coordinates within the view
            var rect =  event.target.getBoundingClientRect();

            // Relative coordinates
            pointer.x = 2*(event.clientX - rect.left) / (rect.right  - rect.left) - 1;
            pointer.y = -2*(event.clientY - rect.top)  / (rect.bottom - rect.top) + 1;

    
            raycaster.setFromCamera( pointer, camera );
    
            // check all objects in sceene for intersection with pointer
            let imesh = self.scene.children[0];
            let color = new THREE.Color();
            const intersection = raycaster.intersectObject( imesh );
    
            if ( intersection.length > 0 ) {

                // pointer/cursor intersects object

                const instanceId = intersection[ 0 ].instanceId;

                if(selection.includes(instanceId)){
                    imesh.setColorAt(instanceId , new THREE.Color(self.colors[instanceId][0],  self.colors[instanceId][1],  self.colors[instanceId][2]));
                    const index = selection.indexOf(instanceId);
                    selection.splice(index, 1);
                }
                else{
                    imesh.setColorAt( instanceId, color.setHex(  0xffffff ) );
                    
                    selection.push(instanceId);
                }

                self.model.set('selection',  selection.concat());
                self.model.save_changes();
                self.touch();
                
                
                
                imesh.instanceColor.needsUpdate = true;
                
    
            }
            
    
        }

		animate();

		function animate() {
			renderer.setAnimationLoop( render );

		}

		function render() {

            
			//renderer.render( scene, camera );
            postprocessing.composer.render(  );


        }
        
        
        

        
        
        
    }

    

    

    

    
    




    init_changed() {
        /*
        Initialize model
        */

        // 
        this.pos = this.model.get('pos');
        this.colors = this.model.get('colors');
        this.box = this.model.get('box');
        this.bonds = this.model.get('bonds');
        this.radius = this.model.get('radius');
        this.selected = this.model.get('selected');

        this.count = this.model.get('count');



        
        
        let baseGeometry = new THREE.SphereBufferGeometry(1.0, 30, 20);
        
        let material = new THREE.MeshStandardMaterial( );
        
        material.roughness = 0.2;
        material.metalness = 0.2;

        let imesh = new THREE.InstancedMesh( baseGeometry, material, 10000);
        imesh.count = this.pos.length;
        imesh.instanceMatrix.needsUpdate = true;

        this.scene.add(imesh);

        let bondGeometry = new THREE.CylinderGeometry(.4, 0.4, 1.0, 6, 4, true);
        bondGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(3.1415/2.0));


        let bondMesh = new THREE.InstancedMesh( bondGeometry, material, 10000);
        bondMesh.count = this.bonds.length;
        bondMesh.instanceMatrix.needsUpdate = true;

        this.scene.add(bondMesh);



        let light = new THREE.AmbientLight( 0xffffff, 0.8 ); // soft white light
        this.scene.add( light );
        
        const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
        directionalLight.position.set( 1, 1, 1 );
        this.scene.add( directionalLight );
        

        
        
        
        
    }

    _count_changed() {
        // when number of atoms is changed, update the count of the instanced mesh
        let imesh = this.scene.children[0];
        imesh.count = this.model.get('count');
    }

    _python_callback(i) {
        // dummy function for testing communication between kernel and frontend
        console.log(i);
    }
    
    _pos_changed() {
        // update position of atoms
        // (triggered when 'pos' is changed on kernel side)
        this.pos = this.model.get('pos');
        this.colors = this.model.get('colors');
        this.radius = this.model.get('radius');
        this.selection = this.model.get('selection');
        
        let imesh = this.scene.children[0];
        
        imesh.count = this.pos.length;
        let m4 = new THREE.Matrix4();

        const color = new THREE.Color();



        for (let i = 0; i < this.pos.length; i++) {
            m4.setPosition(this.pos[i][0], this.pos[i][1], this.pos[i][2] );

            imesh.setMatrixAt( i, m4 );
            
            imesh.setColorAt(i , new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]));
        }

        for( let i=0; i< this.selection.length; i++){

            imesh.setColorAt( this.selection[i], color.setHex(  0xffffff ) );
        }

        imesh.instanceMatrix.needsUpdate = true;
        imesh.instanceColor.needsUpdate = true;
        this._bonds_changed();

    }

    _bonds_changed() {
        // connect atoms with indices given in 'bonds'
        // using a black cylinder
        this.pos = this.model.get('pos');
        this.bonds = this.model.get('bonds');
        this.colors = this.model.get('colors');

        let m4_rot = new THREE.Matrix4();
        let m4_trans = new THREE.Matrix4();
        let m4_scale = new THREE.Matrix4();


        let dummy = new THREE.Object3D();

        let quaternion = new THREE.Quaternion(); 



        let bmesh = this.scene.children[1];
        console.log(this.bonds);

        

        
        bmesh.count = this.bonds.length;

        

        for(let i = 0; i< this.bonds.length; i++){
            let pX = this.pos[this.bonds[i][0]];
            let pY = this.pos[this.bonds[i][1]];

            let pointX = new THREE.Vector3(pX[0], pX[1], pX[2]);
            let pointY = new THREE.Vector3(pY[0], pY[1], pY[2]);

            var direction = new THREE.Vector3().subVectors(pointY, pointX);

            m4_rot.lookAt( new THREE.Vector3(0,0,0), direction, new THREE.Vector3(0,1,0));
            
            dummy.position.set(.5*(pY[0]+ pX[0]), .5*(pY[1]+ pX[1]),.5*(pY[2]+ pX[2]) );

            dummy.scale.set(1.0, 1.0, direction.length());
            
            dummy.setRotationFromMatrix(m4_rot);

            dummy.updateMatrix();

            bmesh.setMatrixAt( i, dummy.matrix );

            bmesh.setColorAt(i , new THREE.Color(.5*this.colors[this.bonds[i][0]][0],  .5*this.colors[this.bonds[i][0]][1], .5*this.colors[this.bonds[i][0]][2]));
        
        }
        bmesh.instanceMatrix.needsUpdate = true;
        

    }
};
