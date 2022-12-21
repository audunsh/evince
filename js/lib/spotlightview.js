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
import { HemisphereLight } from 'three';

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
export class SpotlightModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'SpotlightModel',
            _view_name : 'SpotlightView',
            _model_module : 'evince',
            _view_module : 'evince',
            _model_module_version : '0.46.0',
            _view_module_version : '0.46.0'
        };
    }
}


// Custom View. Renders the widget model.
export class SpotlightView extends DOMWidgetView {
    render() {
        const scene = new THREE.Scene();
        const postprocessing = {};
        this.scene = scene;

        

		let camera = new THREE.PerspectiveCamera( 50, document.activeElement.clientWidth/(document.activeElement.clientWidth*.65), 0.1, 1000 );
        //let camera = new THREE.PerspectiveCamera( 75, this.model.get("window_scale_width")*window.innerWidth/(this.model.get("window_scale_height")*window.innerHeight), 0.1, 1000 );
        this.camera = camera;
        this.camera.position.z = 5;

        //console.log("init scene");


        

        //console.log(VRButton);
        const renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        //document.body.appendChild( VRButton.createButton( renderer ) );
        this.renderer = renderer;
        
        this.el.appendChild( VRButton.createButton( this.renderer ) );
        
        ///this.renderer.setAnimationLoop( function () {
        //
        //    renderer.render( scene, camera );
        //} );
		
		//this.renderer.domElement.width
		//console.log(this.model.get("window_scale_width"), this.el.innerWidth, this.model.get("window_scale_height"), this.el.innerWidth, this.el);
		
		

		this.renderer.setSize( this.model.get("window_scale")*document.activeElement.clientWidth,this.model.get("window_scale")*document.activeElement.clientWidth*.65);
        //this.renderer.setSize( this.model.get("window_scale_width")*window.innerWidth, this.model.get("window_scale_height")*window.innerHeight );
		//this.renderer.setSize( this.model.get("window_scale_width")*this.el.innerWidth, this.model.get("window_scale_height")*this.el.innerWidth );
        //this.renderer.setClearColor( 0xfaf8ec, 1);
        //this.renderer.setClearColor( 0x0f0f2F, 1);
		
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
        

        

        


        
        
        
        

        if(this.model.get('sao')){
            console.log("sao active");
            const saoPass = new SAOPass( this.scene, this.camera, true, true );
		
        
            saoPass.params.saoScale = this.model.get('saoScale'); //0.7
            
            saoPass.params.saoBias =this.model.get('saoBias'); //-1,1
            saoPass.params.saoIntensity = this.model.get('saoIntensity'); //-1,1
            
            /*
            saoPass.params.saoKernelRadius = this.model.get('saoKernelRadius'); //-1,1
            saoPass.params.saoMinResolution = this.model.get('saoMinResolution'); //-1,1
            
            
            saoPass.params.saoBlur = this.model.get('saoBlur'); //-1,1
            saoPass.params.saoBlurRadius = this.model.get('saoBlurRadius'); //-1,1
            saoPass.params.saoBlurStdDev = this.model.get('saoBlurStdDev'); //-1,1
            saoPass.params.saoBlurDepthCutoff = this.model.get('saoBlurDepthCutoff'); //-1,1
            */

            /*
            saoPass.renderToScreen = true;
            if(this.model.get('dof')){
                saoPass.renderToScreen = false;
            }
            if(this.model.get('fxaa')){
                saoPass.renderToScreen = false;
            }
            */
            
            console.log("sao render pass",saoPass.renderToScreen );
            composer.addPass( saoPass );
            
            
        }

        if(this.model.get('dof')){
            console.log("dof active");
            const bokehPass = new BokehPass( this.scene,this.camera, {
                focus: this.model.get('focus'),
                aperture:this.model.get('aperture') ,
                maxblur: this.model.get('max_blur'),

                width: this.model.get("window_scale")*document.activeElement.clientWidth,
                height: this.model.get("window_scale")*document.activeElement.clientWidth*.65
            } );
            
            /*
            bokehPass.renderToScreen = true;
            if(this.model.get('fxaa')){
                bokehPass.renderToScreen = false;
            }
            */
            console.log("dof render pass",bokehPass.renderToScreen );
            bokehPass.needsSwap = true;
            composer.addPass( bokehPass );
            postprocessing.bokeh = bokehPass;


        }

        if(this.model.get('fxaa')){
            console.log("fxaa active");
            const fxaaPass = new ShaderPass( FXAAShader );

            const pixelRatio = renderer.getPixelRatio();

            
            fxaaPass.uniforms[ 'resolution' ].value.set( 1 / (this.model.get("window_scale")*pixelRatio*document.activeElement.clientWidth), 1 / (this.model.get("window_scale")*pixelRatio*document.activeElement.clientWidth*.65) );


            fxaaPass.renderToScreen = false;

            console.log("fxaa render pass",fxaaPass.renderToScreen );
            
            composer.addPass( fxaaPass );   
        }
        


        
        
        

        postprocessing.composer = composer;
        

		this.renderer.autoClear = false;

        var self = this;

        window.addEventListener( 'resize', onWindowResize );


        //controllers for molecule editing
        function onWindowResize() {
            console.log("window_resize");
            camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.65);
            camera.updateProjectionMatrix();

            //renderer.setSize( document.activeElement.clientWidth, document.activeElement.clientWidth*.6 );
            self.renderer.setSize( self.model.get("window_scale")*document.activeElement.clientWidth,self.model.get("window_scale")*document.activeElement.clientWidth*.65);
        

        }
 
        


		animate();

		function animate() {
			renderer.setAnimationLoop( render );

		}

		function render() {
			//renderer.render( scene, camera );

            postprocessing.composer.render(  );



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
                    self.scene.children[0].children[i].position.set( self.pos[i][0], self.pos[i][1], self.pos[i][2] );

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
                    var mesh = self.scene.children[1].children[i];

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
                self.scene.children[0].children[i].geometry.setAttribute(
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
        
        //if(this.box.length>2){
        //    this.camera.position.z = 2*Math.abs(this.box[2]);
        //    //console.log("3d initt");
        //}
        
        
        ///let instancedGeometry = new THREE.InstancedBufferGeometry().copy(baseGeometry);
        //let instanceCount = this.pos.length;
        //instancedGeometry.maxInstancedCount = instanceCount;
        //let material = new THREE.ShaderMaterial();
        //let mesh = new THREE.Mesh(instancedGeometry, material);

        //let parameters = { color: 0xff1100 };
		//const cubeMaterial = new THREE.MeshBasicMaterial( parameters );

        
        
        
        
        
        let aColor = [];
        let aCurve = [];
        
        
        

        const atoms = new THREE.Group();
        const bonds = new THREE.Group();

        for (let i = 0; i < this.pos.length; i++) {
            // aCurve.push(this.pos[i][0], this.pos[i][1], this.pos[i][2]);
            //aColor.push(.3 + .001*this.colors[i][0], .3+ .001*this.colors[i][1], .3+ .001*this.colors[i][2]);
            //aColor.push(this.colors[i][0], this.colors[i][1], this.colors[i][2]);
            
            //let mcolor = new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]);
            let baseGeometry = new THREE.SphereBufferGeometry(this.radius[i], 30, 20);
			baseGeometry.attributes.position.needsUpdate = true;
            let material = new THREE.MeshStandardMaterial( );
            material.color = new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]);
            material.roughness = 0.2;
            material.metalness = 0.2;
            if(this.model.get('transparent_bubbles')){
                material.opacity = .2;
                material.transparent = true;
            }
            let mesh = new THREE.Mesh( baseGeometry, material );
            mesh.position.set( this.pos[i][0], this.pos[i][1], this.pos[i][2] );
            //mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            atoms.add( mesh );
        }
        this.scene.add( atoms ); 

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
            //var geometry = new THREE.CylinderGeometry(.4, 0.4, direction.length(), 6, 4, true);
            var geometry = new THREE.CylinderGeometry(.4, 0.4, 1.0, 6, 4, true);
            // shift it so one end rests on the origin
            //geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, direction.length() / 2, 0));
            //geometry.position = new THREE.Vector3( .5*(pY[0]+ pX[0]), .5*(pY[1]+ pX[1]), .5*(pY[2]+ pX[2]));
            
            


            // rotate it the right way for lookAt to work
            geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(3.1415/2.0));
            
            
            // Make a mesh with the geometry
            var mesh = new THREE.Mesh(geometry, material);

            mesh.scale.z = direction.length();
            
            // Position it where we want
            //mesh.position.copy(pointX);
            mesh.position.x = .5*(pY[0]+ pX[0]);
            mesh.position.y = .5*(pY[1]+ pX[1]);
            mesh.position.z = .5*(pY[2]+ pX[2]);
            //mesh.position = new THREE.Vector3( .5*(pY[0]+ pX[0]), .5*(pY[1]+ pX[1]), .5*(pY[2]+ pX[2]));
            // And make it point to where we want
            mesh.lookAt(pointY);
            bonds.add(mesh);

        








            /*

            let lmat = new THREE.LineBasicMaterial( { color: 0x999999 } );
            lmat.linewidth = 5;

            let points = [];
            points.push( new THREE.Vector3(pos_a[0], pos_a[1], pos_a[2]) );
            points.push( new THREE.Vector3(pos_b[0], pos_b[1], pos_b[2]) );

            let lgeom = new THREE.BufferGeometry().setFromPoints( points );

            let line = new THREE.Line( lgeom, lmat );
            this.scene.add(line);
            */



            //const geometry = new THREE.CylinderGeometry( 1, 1, 20, 32 );
            //const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
            //const cylinder = new THREE.Mesh( geometry, material );
            //scene.add( cylinder );
        }

        this.scene.add( bonds ); 

        
        
        
        let light = new THREE.AmbientLight( 0xffffff, 0.8 ); // soft white light
        this.scene.add( light );
        
        const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
        directionalLight.position.set( 1, 1, 1 );
        this.scene.add( directionalLight );
    }

    remove_atom() {
        gonners = this.model.get("atoms_for_deletion");
        for (let i = 0; i < gonners.length; i++){
            this.scene.children[0].children[gonners[i]].remove();
            for(let j = 0; j< this.bonds.length; j++){
                if(this.bonds[j][0]==gonners[i]){
                    this.scene.children[1].children[j].remove();
                }
                if(this.bonds[j][1]==gonners[i]){
                    this.scene.children[1].children[j].remove();
                }
            }
        }

        


    }
    
    pos_changed() {
        
        this.pos = this.model.get('pos');
        //let mesh = this.scene.children[0];
        let m4 = new THREE.Matrix4();
        

        /*
        let aCurve = [];

        
        
        if(this.box.length>2){
        
            for (let i = 0; i < this.pos.length; i++) {
                //let pos_i = this.pos[i];
                //let children_i = this.scene.children[i];
                //children_i.position.x = pos_i[0];
                //children_i.position.y = pos_i[1];
                //children_i.position.z = pos_i[2];
                this.scene.children[i].position.set( this.pos[i][0], this.pos[i][1], this.pos[i][2] );

                //this.scene.children[i].position = new THREE.Vector3(this.pos[i][0], this.pos[i][1],  this.pos[i][2]);
            }


            
            for(let i = 0; i< this.bonds.length; i++){
                let pX = this.pos[this.bonds[i][0]];
                let pY = this.pos[this.bonds[i][1]];
    
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
                var mesh = this.scene.children[i +this.pos.length ];

                mesh.scale.z = direction.length();
                
                //mesh.geometry.height = direction.length();

                mesh.position.x = .5*(pY[0]+ pX[0]);
                mesh.position.y = .5*(pY[1]+ pX[1]);
                mesh.position.z = .5*(pY[2]+ pX[2]);

                mesh.lookAt(pointY);
                //this.scene.add(mesh);
            
    
    
            }
            

        }
        if(this.box.length==2){
            for (let i = 0; i < this.pos.length; i++) {
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
