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
export class FashionModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'FashionModel',
            _view_name : 'FashionView',
            _model_module : 'evince',
            _view_module : 'evince',
            _model_module_version : '0.46.0',
            _view_module_version : '0.46.0'
        };
    }
}


// Custom View. Renders the widget model.
export class FashionView extends DOMWidgetView {

    render() {
        super.render();
        const scene = new THREE.Scene();
        const postprocessing = {};

        let selection = [];



        //model = this.model;
        this.scene = scene;

        let selectedObject = null;
        

		let camera = new THREE.PerspectiveCamera( 75, document.activeElement.clientWidth/(document.activeElement.clientWidth*.6), 0.1, 1000 );
        //let camera = new THREE.PerspectiveCamera( 75, this.model.get("window_scale_width")*window.innerWidth/(this.model.get("window_scale_height")*window.innerHeight), 0.1, 1000 );
        this.camera = camera;
        this.camera.position.z = 5;

        this.camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.6);
        this.camera.updateProjectionMatrix();



        
        

        

        //console.log(VRButton);
        const renderer = new THREE.WebGLRenderer();
        //document.body.appendChild( VRButton.createButton( renderer ) );
        renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer = renderer;
        
        this.el.appendChild( VRButton.createButton( this.renderer ) );
		

        //var rect = this.el.getBoundingClientRect();
        //console.log(this.el.parent().getBoundingClientRect());
        //let width = (rect.right  - rect.left);
        //let height = (rect.top  - rect.bottom);
        //this.renderer.setSize(width, height);

		this.renderer.setSize( document.activeElement.clientWidth, document.activeElement.clientWidth*.6);
		
		const bg_color = new THREE.Color(this.model.get("bg_color")[0],this.model.get("bg_color")[1],this.model.get("bg_color")[2] );

		this.renderer.setClearColor(bg_color, 1);

		
        this.renderer.antialias = true;
        this.renderer.xr.enabled = true;
        
        let controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls = controls;


        

        /*
        let baseGeometry = new THREE.SphereBufferGeometry(0.1, 30, 20);
        baseGeometry.attributes.position.needsUpdate = true;

        let material = new THREE.MeshStandardMaterial( );
        //material.color = new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]);
        material.roughness = 0.2;
        material.metalness = 0.2;

        let imesh = new THREE.InstancedMesh( baseGeometry, material, 1000);
        imesh.instanceMatrix.needsUpdate = true;

        this.scene.add(imesh);
        */
        

       




        
        this.init_changed();
        this.el.append(this.renderer.domElement);
        this.el.appendChild( VRButton.createButton( renderer ) );
        this._pos_changed();
        this._bonds_changed();
        //this._count_changed();
        //this.model.on('change:pos', pos_changed); //, this);
        this.listenTo(this.model, 'change:pos', this._pos_changed, this);
        this.listenTo(this.model, 'change:bonds', this._bonds_changed, this);

        this.model.on('change:init', this.init_changed, this);

        //this.bonds_changed();
        //this.model.on('change:bonds', this._bonds_changed, this);
        //this.model.on('change:count', this._count_changed, this);
        
        //this.animate();
        
        
        const renderPass = new RenderPass( this.scene, this.camera );
        const composer = new EffectComposer( this.renderer );

        composer.addPass( renderPass );
        

        let raycaster = new THREE.Raycaster();
		let pointer = new THREE.Vector2();

        const gui = new GUI();

        const python_callback = {test: 15};

		gui.add( python_callback, 'test', 1).onChange( this._python_callback );

        

        


        
        
        
        

        if(this.model.get('sao')){
            console.log("sao active");
            console.log("sao active");
            const saoPass = new SAOPass( this.scene, this.camera, true, true );
		
        
            saoPass.params.saoScale = this.model.get('saoScale'); //0.7
            
            saoPass.params.saoBias =this.model.get('saoBias'); //-1,1
            saoPass.params.saoIntensity = this.model.get('saoIntensity'); //-1,1
            
            console.log("sao render pass",saoPass.renderToScreen );
            composer.addPass( saoPass );
            
            
        }

        if(this.model.get('dof')){
            console.log("dof active");
            const bokehPass = new BokehPass( this.scene,this.camera, {
                focus: this.model.get('focus'),
                aperture:this.model.get('aperture') ,
                maxblur: this.model.get('max_blur'),

                width: document.activeElement.clientWidth,
                height: document.activeElement.clientWidth*.6
            } );
            
            console.log("dof render pass",bokehPass.renderToScreen );
            bokehPass.needsSwap = true;
            composer.addPass( bokehPass );
            postprocessing.bokeh = bokehPass;


        }

        if(this.model.get('fxaa')){
            console.log("fxaa active");
            const fxaaPass = new ShaderPass( FXAAShader );

            const pixelRatio = renderer.getPixelRatio();

            
            fxaaPass.uniforms[ 'resolution' ].value.set( 1 / ( pixelRatio*document.activeElement.clientWidth), 1 / (pixelRatio*document.activeElement.clientWidth*.6) );


            fxaaPass.renderToScreen = false;

            console.log("fxaa render pass",fxaaPass.renderToScreen );
            
            composer.addPass( fxaaPass );   
        }
        


        
        
        

        postprocessing.composer = composer;
        

		//this.renderer.autoClear = false;
 
        //console.log("window");
        //console.log(parent.innerWidth, document.activeElement.innerWidth, document.documentElement.clientWidth, document.documentElement.offsetWidth, this.el.offsetWidth);
        
		
        
        window.addEventListener( 'pointermove', onPointerMove );
        window.addEventListener( 'pointerdown', onPointerUp );
        window.addEventListener( 'click', onClick );

        window.addEventListener( 'resize', onWindowResize );


        //controllers for molecule editing
        function onWindowResize() {
            console.log("window_resize");
            camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.6);
            camera.updateProjectionMatrix();

            renderer.setSize( document.activeElement.clientWidth, document.activeElement.clientWidth*.6 );

        }



        // generic functions synchronized to the python kernel

        // use a pointer to this
        var self = this;


        function onPointerUp(){
            //console.log("pointer_up", selectedObject.physics_typedef, selectedObject.index_in_scene);
            //var object = scene.getObjectByName( selectedObject.name );
    
            // trigger event in kernel
            //self.model.set('add_new_atom',  [selectedObject.index_in_scene, 0.0]);
            //self.model.touch();
            self.model.save_changes();
    
    
        }

        function onPointerMove(){
            //console.log("pointer_up", selectedObject.physics_typedef, selectedObject.index_in_scene);
            //var object = scene.getObjectByName( selectedObject.name );
    
            // trigger event in kernel
            //self.model.set('add_new_atom',  [selectedObject.index_in_scene, 0.0]);
            //self.model.touch();
            self.model.save_changes();
    
    
        }

        function onClick( event ) {

            /*
            if ( selectedObject ) {

                //selectedObject.material.currentColor = selectedObject.material.color.getHex();
    
                //selectedObject.material.color.set( selectedObject.material.currentColor );
                selectedObject.material.emissive.setHex( selectedObject.material.currentEmissive );
                selectedObject = null;
    
            }*/

            //console.log(document.querySelector('#threeJSRenderWrapper'));
            // console.log(document.querySelector("p").closest(".near.ancestor"));

            //window.innerHeight-

            var rect =  event.target.getBoundingClientRect();

            // Relative coordinates
            pointer.x = 2*(event.clientX - rect.left) / (rect.right  - rect.left) - 1;
            pointer.y = -2*(event.clientY - rect.top)  / (rect.bottom - rect.top) + 1;

            //pointer.x = 2*event.clientX/window.innerWidth - 1;//  / (rect.right  - rect.left);
            //pointer.y = -2*event.clientY/window.innerHeight + 1; // / (rect.bottom - rect.top);
            //console.log(pointer.x, pointer.y);

            // Data pixel coordinates
            //pointer.x = Math.floor(X*document.activeElement.clientWidth);
            //pointer.y = Math.floor(Y*document.activeElement.clientWidth*.6);


    
            //pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            //pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            //console.log("boundingbox:", event.target.getBoundingClientRect());

            //pointer.x = event.clientX - .5*(window.innerWidth - document.activeElement.clientWidth);
            
            //pointer.x = 2*pointer.x/document.activeElement.clientWidth - 1;
            //pointer.y = -2*(event.clientY / (document.activeElement.clientHeight) ) + 1;
            
            //console.log(pointer.x, pointer.y);
            //console.log(event.clientX, event.clientY);
            //console.log("pointer_moved", document.activeElement.clientWidth, window.innerWidth);
            

            //.5*(window.innerWidth - document.activeElement.clientWidth)
    
            raycaster.setFromCamera( pointer, camera );
    
            //const intersects = raycaster.intersectObject( scene, true );
            let imesh = self.scene.children[0];
            let color = new THREE.Color();
            const intersection = raycaster.intersectObject( imesh );
    
            if ( intersection.length > 0 ) {



                const instanceId = intersection[ 0 ].instanceId;

                //let selected = self.selected;

                if(selection.includes(instanceId)){
                    //imesh.setColorAt( instanceId, color.setHex( Math.random() * 0xffffff ) );
                    imesh.setColorAt(instanceId , new THREE.Color(self.colors[instanceId][0],  self.colors[instanceId][1],  self.colors[instanceId][2]));
                    const index = selection.indexOf(instanceId);
                    selection.splice(index, 1);
                }
                else{
                    imesh.setColorAt( instanceId, color.setHex(  0xffffff ) );
                    //selected[instanceId] = 1;
                    selection.push(instanceId);
                }
                console.log(selection);

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

            
			renderer.render( scene, camera );
            //postprocessing.composer.render(  );

            //self.model.set('trigger_advance',  true);
            //self.model.save_changes();


            // experimental position update
            //self.pos = self.model.get('pos');
            //console.log("self.pos", self.pos.length);
            
            
            //let aCurve = [];

            
            /*
            if(self.box.length>2){
            
                for (let i = 0; i < self.pos.length; i++) {
                    self.scene.children[i].position.set( self.pos[i][0], self.pos[i][1], self.pos[i][2] );

                }*/

            
            
            /*
            self.pos = self.model.get('pos');
            const matrix = new THREE.Matrix4();
            self.scene.children[0].count = self.pos.length; //this.model.get('count');





            for (let i = 0; i < self.pos.length; i++) {
                //console.log(this.pos[i]);
                
                matrix.setPosition(self.pos[i][0], self.pos[i][1], self.pos[i][2] );
                self.scene.children[0].setMatrixAt( i, matrix );
            }
            */
           
        



        }
        
        
        

        
        
        
    }

    

    

    

    
    




    init_changed() {
        console.log("init change");
        this.pos = this.model.get('pos');
        this.masses = this.model.get('masses');
        this.colors = this.model.get('colors');
        this.box = this.model.get('box');
        this.bonds = this.model.get('bonds');
        this.radius = this.model.get('radius');
        this.selected = this.model.get('selected');

        this.count = this.model.get('count');


        console.log("init count:", this.count);
        console.log("init pos", this.pos);
        
        //let aColor = [];
        //let aCurve = [];
        
        let baseGeometry = new THREE.SphereBufferGeometry(1.0, 30, 20);
        //baseGeometry.attributes.position.needsUpdate = true;

        let material = new THREE.MeshStandardMaterial( );
        //material.color = new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]);
        material.roughness = 0.2;
        material.metalness = 0.2;

        let imesh = new THREE.InstancedMesh( baseGeometry, material, 10000);
        imesh.count = this.pos.length;
        imesh.instanceMatrix.needsUpdate = true;
        //imesh.instanceColor.needsUpdate = true;

        this.scene.add(imesh);

        let bondGeometry = new THREE.CylinderGeometry(.4, 0.4, 1.0, 6, 4, true);
        bondGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(3.1415/2.0));


        let bondMesh = new THREE.InstancedMesh( bondGeometry, material, 10000);
        bondMesh.count = this.bonds.length;
        bondMesh.instanceMatrix.needsUpdate = true;

        this.scene.add(bondMesh);


        /*

        //create bonds
        
        */


        let light = new THREE.AmbientLight( 0xffffff, 0.8 ); // soft white light
        this.scene.add( light );
        
        const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
        directionalLight.position.set( 1, 1, 1 );
        this.scene.add( directionalLight );
        

        
        
        
        
    }

    _count_changed() {
        let imesh = this.scene.children[0];
        imesh.count = this.model.get('count');
    }

    _python_callback() {
        let imesh = this.scene.children[0];
        imesh.count = this.model.get('count');
    }
    
    _pos_changed() {
        console.log("pos changes");
        this.pos = this.model.get('pos');
        this.colors = this.model.get('colors');
        this.radius = this.model.get('radius');
        //const matrix = new THREE.Matrix4();
        //let color = new THREE.Color();

        let imesh = this.scene.children[0];
        //console.log(imesh);
        imesh.count = this.pos.length;
        let m4 = new THREE.Matrix4();

        const color = new THREE.Color();



        for (let i = 0; i < this.pos.length; i++) {
            m4.setPosition(this.pos[i][0], this.pos[i][1], this.pos[i][2] );

            imesh.setMatrixAt( i, m4 );
            //imesh.setColorAt( i, color.setHex( Math.random() * 0xffffff ) );
            imesh.setColorAt(i , new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]));
        }
        imesh.instanceMatrix.needsUpdate = true;
        imesh.instanceColor.needsUpdate = true;

    }

    _bonds_changed() {
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

            //m4_scale.makeScale(direction.length(),1.0,1.0);



            m4_rot.lookAt( new THREE.Vector3(0,0,0), direction, new THREE.Vector3(0,1,0));
            //m4_rot.lookAt(new THREE.Vector3(0,0,0), direction, new THREE.Vector3(1,0,1));

            //m4.setPosition(.5*(pY[0]+ pX[0]), .5*(pY[1]+ pX[1]),.5*(pY[2]+ pX[2]));

            
            dummy.position.set(.5*(pY[0]+ pX[0]), .5*(pY[1]+ pX[1]),.5*(pY[2]+ pX[2]) );

            dummy.scale.set(1.0, 1.0, direction.length());

            // create one and reuse it
            //quaternion.setFromUnitVectors( direction.normalize(), new THREE.Vector3(1,0,0) );
            //m4_rot.makeRotationFromQuaternion( quaternion );
            
            dummy.setRotationFromMatrix(m4_rot);

            

            

            dummy.updateMatrix();

            

            bmesh.setMatrixAt( i, dummy.matrix );

            bmesh.setColorAt(i , new THREE.Color(.5*this.colors[this.bonds[i][0]][0],  .5*this.colors[this.bonds[i][0]][1], .5*this.colors[this.bonds[i][0]][2]));



        
        }
        bmesh.instanceMatrix.needsUpdate = true;
        

    }
};
