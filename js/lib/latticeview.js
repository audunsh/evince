import { DOMWidgetModel, DOMWidgetView } from '@jupyter-widgets/base';

import * as THREE from 'three';
//var THREE = require('three');
import { OrbitControls } from 'three/examples/jsm/Controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';


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
export class LatticeModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'LatticeModel',
            _view_name : 'LatticeView',
            _model_module : 'evince',
            _view_module : 'evince',
            _model_module_version : '0.46.0',
            _view_module_version : '0.46.0'
        };
    }
}


// Custom View. Renders the widget model.
export class LatticeView extends DOMWidgetView {
    render() {
        const scene = new THREE.Scene();
		this.scene = scene;

		let camera = new THREE.PerspectiveCamera( 75, document.activeElement.clientWidth/(document.activeElement.clientWidth*.6), 0.1, 1000 );
        
		//let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera = camera;
		this.camera.position.z = 5;

		


		

		const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
        //document.body.appendChild( VRButton.createButton( renderer ) );
        this.renderer = renderer;
        
        this.el.appendChild( VRButton.createButton( this.renderer ) );
        this.renderer.setAnimationLoop( function () {

            renderer.render( scene, camera );

        } );

        //this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
		this.renderer.setSize( .99*document.activeElement.clientWidth, .99*document.activeElement.clientWidth*.6);
        
		

        //this.renderer.setClearColor( 0xfaf8ec, 1);
        this.renderer.setClearColor( 0x0f0f2F, 1);
        this.renderer.antialias = true;
        this.renderer.xr.enabled = true;
        
        let controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls = controls;
		
		this.init_changed();
		this.el.append(this.renderer.domElement);
		
		this.pos_changed();
		this.state_changed();
		this.model.on('change:pos', this.pos_changed, this);
		this.model.on('change:init', this.init_changed, this);
		this.model.on('change:state', this.state_changed, this);


		animate();

		function animate() {
			renderer.setAnimationLoop( render );

		}

		function render() {
			renderer.render( scene, camera );

		}

        
        
        
    }
	init_changed() {
            this.pos = this.model.get('pos');
            this.masses = this.model.get('masses');
            this.colors = this.model.get('colors');
            this.box = this.model.get('box');
            this.state = this.model.get('state');
            if(this.box.length>2){
                this.camera.position.z = 2*Math.abs(this.box[2]);
                
            }
            
            let baseGeometry = new THREE.SphereBufferGeometry(.3);
            //let baseGeometry = new THREE.BoxBufferGeometry(1.0,1.0,1.0);
            let instancedGeometry = new THREE.InstancedBufferGeometry().copy(baseGeometry);
            let instanceCount = this.state.length;
            instancedGeometry.maxInstancedCount = instanceCount;
            //let material = new THREE.ShaderMaterial();
            //let mesh = new THREE.Mesh(instancedGeometry, material);
            
            
            
            
            
            let aColor = [];
            let aCurve = [];
            
            if(this.box.length==2){
                let aState = [];
            
            
                for (let i = 0; i < instanceCount; i++) {
                      aState.push(this.state[i], this.state[i]);
                    }


                let aStateFloat32 = new Float32Array(aState);


                instancedGeometry.setAttribute(
                      "aState",
                      new THREE.InstancedBufferAttribute(aStateFloat32, 2, false)
                    );
                
                for (let i = 0; i < instanceCount; i++) {
                  aCurve.push(this.pos[i][0], this.pos[i][1], 0.0);
                  //aColor.push(.3 + .001*this.colors[i][0], .3+ .001*this.colors[i][1], .3+ .001*this.colors[i][2]);
                  //aColor.push(this.colors[i][0], this.colors[i][1], this.colors[i][2]);
                }
                let aCurveFloat32 = new Float32Array(aCurve);
                instancedGeometry.setAttribute(
                  "aCurve",
                  new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
                );
                var vertexShader = `attribute vec3 aColor;
varying vec4 vColor;
//varying vec3 vPos;

// 1. Define the attributes
attribute vec4 aCurve;
attribute vec2 aState;

vec3 getColor(float stateValue){
  
  vec3 pos = vec3(0.);
  pos.x += cos(.01*stateValue );
  pos.y += 0.0; // sin(progress *PI*8.) * radius + sin(progress * PI *2.) * 30.;
  pos.z += 0.0; // progress *200. - 200./2. + offset;
  
  return pos;
}

void main(){
  vec3 transformed = position;
  
  // 2. Extract values from attribute
  //float aRadius = aCurve.x;

  
  // 3. Get position and add it to the final position
  vec3 curvePosition = vec3(aCurve.x, aCurve.y, 0.0);
   
  

  transformed += curvePosition;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  //vColor = aColor;
  //vColor = getColor(aState);
  vColor = vec4(aState.x/2.0, 2.0-aState.y, .1*aState.y, aState.y); //aState.y);
  //vPis = gl_position;
}`;             
            }
            
            if(this.box.length==3){
                let aState = [];
            
            
                for (let i = 0; i < instanceCount; i++) {
                      aState.push(this.state[i], this.state[i]);
                    }


                let aStateFloat32 = new Float32Array(aState);


                instancedGeometry.setAttribute(
                      "aState",
                      new THREE.InstancedBufferAttribute(aStateFloat32, 2, false)
                    );
                
                for (let i = 0; i < instanceCount; i++) {
                  aCurve.push(this.pos[i][0], this.pos[i][1], this.pos[i][2]);
                  //aColor.push(.3 + .001*this.colors[i][0], .3+ .001*this.colors[i][1], .3+ .001*this.colors[i][2]);
                  //aColor.push(this.colors[i][0], this.colors[i][1], this.colors[i][2]);
                }
                let aCurveFloat32 = new Float32Array(aCurve);
                instancedGeometry.setAttribute(
                  "aCurve",
                  new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
                );
                var vertexShader = `attribute vec3 aColor;
varying vec4 vColor;
//varying vec3 vPos;

// 1. Define the attributes
attribute vec4 aCurve;
attribute vec2 aState;

vec4 getColor(vec2 stateValue){
  
  vec4 pos = vec4(0.3);
  pos.x = .5*(1.0 + cos(6.0*stateValue.x));
  pos.y = .5*(1.0 + sin(stateValue.x)); // (1.0+sin(stateValue *3.14*8.0);
  pos.z = .5*(1.0 + cos(24.0*stateValue.x + 0.5));
  //pos.z += .5*(1.0+cos(3.14*stateValue +.5);
  pos.w = stateValue.y;
  
  return pos;
}

void main(){
  vec3 transformed = position;
  
  // 2. Extract values from attribute
  //float aRadius = aCurve.x;

  
  // 3. Get position and add it to the final position
  vec3 curvePosition = vec3(aCurve.x, aCurve.y, aCurve.z);
   
  

  transformed += curvePosition;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  vColor = getColor(aState);
  //vColor = vec4(aState.x/2.0, 2.0-aState.y, .1*aState.y, aState.y); //aState.y);

}`;             
            }
            
            
            
            
            let aColorFloat32 = new Float32Array(aColor);
            instancedGeometry.setAttribute(
              "aColor",
              new THREE.InstancedBufferAttribute(aColorFloat32, 3, false)
            );
            
            this.instancedGeometry = instancedGeometry;
            
            
            
            
            var fragmentShader = `varying vec4 vColor;
void main(){
  gl_FragColor = gl_FragColor + .5*vColor; //vec4(vColor, 1.0);
}`;
            
            let material = new THREE.ShaderMaterial({
              fragmentShader: fragmentShader,
              vertexShader: vertexShader,
              blending: THREE.AdditiveBlending
            });
            
            material.depthWrite = false;
            material.side = THREE.FrontSide;
            
            //console.log(THREE);
            
            
            let imesh = new THREE.InstancedMesh( instancedGeometry, material, instanceCount );
            imesh.instanceMatrix.needsUpdate = true;
            this.scene.add(imesh);
            

            
            
            
            
            
            let light = new THREE.AmbientLight( 0x202020, 5 ); // soft white light
            this.scene.add( light );
            
            const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
            directionalLight.position.set( 1, 1, 1 );
            this.scene.add( directionalLight );
        }
    
		pos_changed() {
            
            this.pos = this.model.get('pos');
            let mesh = this.scene.children[0];
            let m4 = new THREE.Matrix4();
            
            let aCurve = [];
            
            if(this.box.length>2){
            
                for (let i = 0; i < mesh.count; i++) {
                  aCurve.push(this.pos[i][0], this.pos[i][1], this.pos[i][2]);
                }
                let aCurveFloat32 = new Float32Array(aCurve);
                //console.log(mesh, mesh.geometry);
                this.scene.children[0].geometry.setAttribute(
                  "aCurve",
                  new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
                );
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
            
            
        }
        state_changed() {
            
            this.state = this.model.get('state');
            let mesh = this.scene.children[0];
            let m4 = new THREE.Matrix4();
            
            let aState = [];
            
            
            for (let i = 0; i < mesh.count; i++) {
                  aState.push(this.state[i], this.state[i]);
                }
            
            
            let aStateFloat32 = new Float32Array(aState);
            
            
            this.scene.children[0].geometry.setAttribute(
                  "aState",
                  new THREE.InstancedBufferAttribute(aStateFloat32, 2, false)
                );
            
        }
};
