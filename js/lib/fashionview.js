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
            _model_module_version : '0.45.0',
            _view_module_version : '0.45.0'
        };
    }
}


// Custom View. Renders the widget model.
export class FashionView extends DOMWidgetView {

    render() {
        super.render();
        const scene = new THREE.Scene();
        const postprocessing = {};


        //model = this.model;
        this.scene = scene;

        let selectedObject = null;
        

		let camera = new THREE.PerspectiveCamera( 75, document.activeElement.clientWidth/(document.activeElement.clientWidth*.6), 0.1, 1000 );
        //let camera = new THREE.PerspectiveCamera( 75, this.model.get("window_scale_width")*window.innerWidth/(this.model.get("window_scale_height")*window.innerHeight), 0.1, 1000 );
        this.camera = camera;
        this.camera.position.z = 5;

        this.camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.6);
        this.camera.updateProjectionMatrix();



        

        //console.log("init scene");


        

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
        
        this.init_changed();
        this.el.append(this.renderer.domElement);
        this.el.appendChild( VRButton.createButton( renderer ) );
        this.pos_changed();
        this.model.on('change:pos', this.pos_changed, this);
        this.model.on('change:init', this.init_changed, this);
        

        //this.animate();
        
        
        const renderPass = new RenderPass( this.scene, this.camera );
        const composer = new EffectComposer( this.renderer );

        composer.addPass( renderPass );
        

        let raycaster = new THREE.Raycaster();
		let pointer = new THREE.Vector2();

        

        


        
        
        
        

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

        window.addEventListener( 'resize', onWindowResize );


        //controllers for molecule editing
        function onWindowResize() {
            console.log("window_resize");
            camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.6);
            camera.updateProjectionMatrix();

            renderer.setSize( document.activeElement.clientWidth, document.activeElement.clientWidth*.6 );

        }


        // use a pointer to this
        var self = this;

        function onPointerUp(){
            console.log("pointer_up", selectedObject.physics_typedef, selectedObject.index_in_scene);
            //var object = scene.getObjectByName( selectedObject.name );
    
            // trigger event in kernel
            self.model.set('add_new_atom',  [selectedObject.index_in_scene, 0.0]);
            //self.model.touch();
            self.model.save_changes();
    
    
        }

        function onPointerMove( event ) {

            if ( selectedObject ) {

                //selectedObject.material.currentColor = selectedObject.material.color.getHex();
    
                //selectedObject.material.color.set( selectedObject.material.currentColor );
                selectedObject.material.emissive.setHex( selectedObject.material.currentEmissive );
                selectedObject = null;
    
            }

            //console.log(document.querySelector('#threeJSRenderWrapper'));
            // console.log(document.querySelector("p").closest(".near.ancestor"));

            //window.innerHeight-

            var rect =  event.target.getBoundingClientRect();

            // Relative coordinates
            pointer.x = 2*(event.clientX - rect.left) / (rect.right  - rect.left) - 1;
            pointer.y = -2*(event.clientY - rect.top)  / (rect.bottom - rect.top) + 1;

            //pointer.x = 2*event.clientX/window.innerWidth - 1;//  / (rect.right  - rect.left);
            //pointer.y = -2*event.clientY/window.innerHeight + 1; // / (rect.bottom - rect.top);
            console.log(pointer.x, pointer.y);

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
    
            const intersects = raycaster.intersectObject( scene, true );
    
            if ( intersects.length > 0 ) {
    
                const res = intersects.filter( function ( res ) {
    
                    return res && res.object;
    
                } )[ 0 ];
    
                if ( res && res.object ) {
    
                    selectedObject = res.object;
                    //selectedObject.material.currentColor = selectedObject.material.color.getHex();
                    //selectedObject.material.color.set( '#f00' );

                    selectedObject.material.currentEmissive = selectedObject.material.emissive.getHex();
                    selectedObject.material.emissive.setHex( 0x666666 );
                    //selectedObject.material.color.set( selectedObject.material.currentColor*2 );
    
                }
    
            }
            
    
        }

		animate();

		function animate() {
			renderer.setAnimationLoop( render );
            //renderer.render( scene, camera );
			//requestAnimationFrame( animate );

		}

		function render() {

            
			//renderer.render( scene, camera );
            postprocessing.composer.render(  );

            //self.model.set('trigger_advance',  true);
            //self.model.save_changes();


            // experimental position update
            self.pos = self.model.get('pos');
            //let mesh = this.scene.children[0];
            let m4 = new THREE.Matrix4();
            
            let aCurve = [];

            
            
            if(self.box.length>2){
            
                for (let i = 0; i < self.pos.length; i++) {
                    //let pos_i = this.pos[i];
                    //let children_i = this.scene.children[i];
                    //children_i.position.x = pos_i[0];
                    //children_i.position.y = pos_i[1];
                    //children_i.position.z = pos_i[2];
                    self.scene.children[i].position.set( self.pos[i][0], self.pos[i][1], self.pos[i][2] );

                    //this.scene.children[i].position = new THREE.Vector3(this.pos[i][0], this.pos[i][1],  this.pos[i][2]);
                }


                
                for(let i = 0; i< self.bonds.length; i++){
                    let pX = self.pos[self.bonds[i][0]];
                    let pY = self.pos[self.bonds[i][1]];
        
                    let pointX = new THREE.Vector3(pX[0], pX[1], pX[2]);
                    let pointY = new THREE.Vector3(pY[0], pY[1], pY[2]);
        
                    // edge from X to Y
                    var direction = new THREE.Vector3().subVectors(pointY, pointX);
                    //let material = new THREE.MeshStandardMaterial({ color: 0x2B2B2B });
                    // Make the geometry (of "direction" length)
                    //material.roughness = 0.2;
                    //material.metalness = 0.2;
                    //var geometry = new THREE.CylinderGeometry(.4, 0.4, direction.length(), 6, 4, true);
                    // shift it so one end rests on the origin
                    //geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, direction.length() / 2, 0));
                    //geometry.position = new THREE.Vector3( .5*(pY[0]+ pX[0]), .5*(pY[1]+ pX[1]), .5*(pY[2]+ pX[2]));
                    
                    
        
        
                    // rotate it the right way for lookAt to work
                    //geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(3.1415/2.0));
                    
                    
                    // Make a mesh with the geometry
                    var mesh = self.scene.children[i +self.pos.length ];

                    mesh.scale.z = direction.length();
                    
                    //mesh.geometry.height = direction.length();

                    mesh.position.x = .5*(pY[0]+ pX[0]);
                    mesh.position.y = .5*(pY[1]+ pX[1]);
                    mesh.position.z = .5*(pY[2]+ pX[2]);

                    mesh.lookAt(pointY);
                    //this.scene.add(mesh);
                
        
        
                }
                

            }
            if(self.box.length==2){
                for (let i = 0; i < self.pos.length; i++) {
                aCurve.push(self.pos[i][0], self.pos[i][1]);
                }
                let aCurveFloat32 = new Float32Array(aCurve);
                //console.log(mesh, mesh.geometry);
                self.scene.children[0].geometry.setAttribute(
                "aCurve",
                new THREE.InstancedBufferAttribute(aCurveFloat32, 2, false)
                );
                
            }

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
        
        let aColor = [];
        let aCurve = [];
        
        
        

        for (let i = 0; i < this.pos.length; i++) {
            let baseGeometry = new THREE.SphereBufferGeometry(this.radius[i], 30, 20);
			baseGeometry.attributes.position.needsUpdate = true;
            
            let material = new THREE.MeshStandardMaterial( );
            material.color = new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]);
            material.roughness = 0.2;
            material.metalness = 0.2;
            let mesh = new THREE.Mesh( baseGeometry, material );
            mesh.position.set( this.pos[i][0], this.pos[i][1], this.pos[i][2] );
            //mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.index_in_scene = i;
            mesh.physics_typedef = "atom";
            this.scene.add( mesh );
        }

        //create bonds
        for(let i = 0; i< this.bonds.length; i++){
            let pX = this.pos[this.bonds[i][0]];
            let pY = this.pos[this.bonds[i][1]];

            let pointX = new THREE.Vector3(pX[0], pX[1], pX[2]);
            let pointY = new THREE.Vector3(pY[0], pY[1], pY[2]);

            // edge from X to Y
            var direction = new THREE.Vector3().subVectors(pointY, pointX);
            let material = new THREE.MeshStandardMaterial({ color: 0x2B2B2B });
            // Make the geometry (of "direction" length)
            material.roughness = 0.2;
            material.metalness = 0.2;
            var geometry = new THREE.CylinderGeometry(.4, 0.4, 1.0, 6, 4, true);
            
            


            // rotate it the right way for lookAt to work
            geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(3.1415/2.0));
            
            
            // Make a mesh with the geometry
            var mesh = new THREE.Mesh(geometry, material);

            mesh.scale.z = direction.length();

            // identifiers for later usage
            mesh.index_in_scene = i;
            mesh.physics_typedef = "bond";
            
            // Position it where we want
            mesh.position.x = .5*(pY[0]+ pX[0]);
            mesh.position.y = .5*(pY[1]+ pX[1]);
            mesh.position.z = .5*(pY[2]+ pX[2]);

            // And make it point to where we want
            mesh.lookAt(pointY);
            this.scene.add(mesh);
        
        }

        

        
        
        
        let light = new THREE.AmbientLight( 0xffffff, 0.8 ); // soft white light
        this.scene.add( light );
        
        const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
        directionalLight.position.set( 1, 1, 1 );
        this.scene.add( directionalLight );
    }
    
    pos_changed() {
        //this.model.set()
        
        this.pos = this.model.get('pos');

        /* 
        let mesh = this.scene.children[0];
        let m4 = new THREE.Matrix4();
        
        let aCurve = [];

        
        
        if(this.box.length>2){
        
            for (let i = 0; i < this.pos.length; i++) {
                this.scene.children[i].position.set( this.pos[i][0], this.pos[i][1], this.pos[i][2] );
            }

            
        }
        if(this.box.length==2){
            for (let i = 0; i < mesh.count; i++) {
              aCurve.push(this.pos[i][0], this.pos[i][1]);
            }
            let aCurveFloat32 = new Float32Array(aCurve);
            //console.log(mesh, mesh.geometry);
            this.scene.children[0].geometry.setAttribute(
              "aCurve",
              new THREE.InstancedBufferAttribute(aCurveFloat32, 2, false)
            );
            
        }
        */
        
        
       
    }
};
