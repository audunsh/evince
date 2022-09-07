import { DOMWidgetModel, DOMWidgetView } from '@jupyter-widgets/base';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';



export class MDModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'MDModel',
			_view_name : 'MDView',
			_model_module : 'evince',
			_view_module : 'evince',
			_model_module_version : '0.35.0',
			_view_module_version : '0.35.0'
        };
    }
}







// Custom View. Renders the widget model.
export class MDView extends DOMWidgetView {
    render() {
        const scene = new THREE.Scene();
        this.scene = scene;
        

		let camera = new THREE.PerspectiveCamera( 75, document.activeElement.clientWidth/(document.activeElement.clientWidth*.6), 0.1, 1000 );
        
        //let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera = camera;
        this.camera.position.z = 5;

        //console.log("init scene");


        

        //console.log(VRButton);
        const renderer = new THREE.WebGLRenderer();
        //document.body.appendChild( VRButton.createButton( renderer ) );
        this.renderer = renderer;
        
        this.el.appendChild( VRButton.createButton( this.renderer ) );
        this.renderer.setAnimationLoop( function () {

            renderer.render( scene, camera );

        } );

        //this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
		this.renderer.setSize( .99*document.activeElement.clientWidth, .99*document.activeElement.clientWidth*.6);
        
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
        //this.el.appendChild( VRButton.createButton( renderer ) );
        this.pos_changed();
        this.model.on('change:pos', this.pos_changed, this);
        this.model.on('change:init', this.init_changed, this);
        

        //this.animate();


		animate();

		function animate() {
			renderer.setAnimationLoop( render );

		}

		function render() {
			renderer.render( scene, camera );
            //postprocessing.composer.render(  );

		}

        
        
        
    }

    init_changed() {
        console.log("init change");
        this.pos = this.model.get('pos');
        this.masses = this.model.get('masses');
        this.colors = this.model.get('colors');
        this.box = this.model.get('box');
        if(this.box.length>2){
            this.camera.position.z = 2*Math.abs(this.box[2]);
            //console.log("3d initt");
        }
        
        let baseGeometry = new THREE.SphereBufferGeometry(.3);
        let instancedGeometry = new THREE.InstancedBufferGeometry().copy(baseGeometry);
        let instanceCount = this.pos.length;
        instancedGeometry.maxInstancedCount = instanceCount;
        //let material = new THREE.ShaderMaterial();
        //let mesh = new THREE.Mesh(instancedGeometry, material);
        
        
        
        
        
        let aColor = [];
        let aCurve = [];
        
        if(this.box.length==2){
            for (let i = 0; i < instanceCount; i++) {
              aCurve.push(this.pos[i][0], this.pos[i][1]);
              //aColor.push(.3 + .001*this.colors[i][0], .3+ .001*this.colors[i][1], .3+ .001*this.colors[i][2]);
              aColor.push(this.colors[i][0], this.colors[i][1], this.colors[i][2]);
            }
            let aCurveFloat32 = new Float32Array(aCurve);
            instancedGeometry.setAttribute(
              "aCurve",
              new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
            );
            var vertexShader = `attribute vec3 aColor;
varying vec3 vColor;
//varying vec3 vPos;

// 1. Define the attributes
attribute vec4 aCurve;

void main(){
vec3 transformed = position;

// 2. Extract values from attribute
//float aRadius = aCurve.x;


// 3. Get position and add it to the final position
vec3 curvePosition = vec3(aCurve.x, aCurve.y, 0.0);

transformed += curvePosition;

gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
vColor = aColor;
//vPis = gl_position;
}`;             
        }
        
        if(this.box.length==3){
            for (let i = 0; i < instanceCount; i++) {
              aCurve.push(this.pos[i][0], this.pos[i][1], this.pos[i][2]);
              //aColor.push(.3 + .001*this.colors[i][0], .3+ .001*this.colors[i][1], .3+ .001*this.colors[i][2]);
              aColor.push(this.colors[i][0], this.colors[i][1], this.colors[i][2]);
            }
            let aCurveFloat32 = new Float32Array(aCurve);
            instancedGeometry.setAttribute(
              "aCurve",
              new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
            );
            var vertexShader = `attribute vec3 aColor;
varying vec3 vColor;
//varying vec3 vPos;

// 1. Define the attributes
attribute vec4 aCurve;

void main(){
vec3 transformed = position;

// 2. Extract values from attribute
//float aRadius = aCurve.x;


// 3. Get position and add it to the final position
vec3 curvePosition = vec3(aCurve.x, aCurve.y, aCurve.z);

transformed += curvePosition;

gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
vColor = aColor;
//vPis = gl_position;
}`;             
        }
        
        
        
        
        let aColorFloat32 = new Float32Array(aColor);
        instancedGeometry.setAttribute(
          "aColor",
          new THREE.InstancedBufferAttribute(aColorFloat32, 3, false)
        );
        
        this.instancedGeometry = instancedGeometry;
        
        
        
        
        var fragmentShader = `varying vec3 vColor;
void main(){
gl_FragColor = gl_FragColor + vec4(vColor, 1.0);
}`;
        
        let material = new THREE.ShaderMaterial({
          fragmentShader: fragmentShader,
          vertexShader: vertexShader
        });

		//let material = new THREE.MeshBasicMaterial( { color: 0xffaa00, transparent: false, blending: THREE.SubtractiveBlending } ) ; //new THREE.MeshNormalMaterial();
        
        //console.log(THREE);
        
        
        let imesh = new THREE.InstancedMesh( instancedGeometry, material, instanceCount );
        imesh.instanceMatrix.needsUpdate = true;
        this.scene.add(imesh);
        

        
        
        
        //draw walls
        if(this.box.length>2){
            // Draw 3D boundary conditions


            if(this.box[0]>0){
                let geometry = new THREE.PlaneGeometry( 2*Math.abs(this.box[1]), 2*Math.abs(this.box[2]) );
                let material = new THREE.MeshBasicMaterial( {color: "rgba(10,10,5)", side: THREE.BackSide} );
                material.opacity = .2;
                material.transparent = true;
				material.blending = THREE.SubtractiveBlending;
				if(this.model.get("additive")){
					material.blending = THREE.AdditiveBlending;
				}
                
                let plane = new THREE.Mesh( geometry, material );
                
                plane.rotation.x = 0;
                plane.position.x = this.box[0];
                plane.rotation.y = .5*3.1415;
                plane.rotation.x = .5*3.1415;
                this.scene.add(plane);
                
                
                plane = new THREE.Mesh( geometry, material );
                plane.rotation.x = 0;
                plane.position.x = -this.box[0];
                plane.rotation.y = -.5*3.1415;
                plane.rotation.x = .5*3.1415;
                this.scene.add(plane);
                
            }
            
            if(this.box[1]>0){
                let geometry = new THREE.PlaneGeometry( 2*Math.abs(this.box[0]), 2*Math.abs(this.box[2]) );
                let material = new THREE.MeshBasicMaterial( {color: "rgba(20,20,10)", side: THREE.BackSide} );
                material.opacity = .2;
                material.transparent = true;
                material.blending = THREE.SubtractiveBlending;
				if(this.model.get("additive")){
					material.blending = THREE.AdditiveBlending;
				}
                let plane = new THREE.Mesh( geometry, material );
                
                plane.rotation.y = 0;
                plane.position.y = -this.box[1];
                plane.rotation.x = .5*3.1415;
                plane.rotation.z = 0;
                this.scene.add(plane);
                
                
                plane = new THREE.Mesh( geometry, material );
                plane.rotation.y = 0;
                plane.position.y = this.box[1];
                plane.rotation.x = -.5*3.1415;
                plane.rotation.z = 0;
                this.scene.add(plane);
                
            }
            
            
            if(this.box[2]>0){
                let geometry = new THREE.PlaneGeometry( 2*Math.abs(this.box[0]), 2*Math.abs(this.box[1]) );
                let material = new THREE.MeshBasicMaterial( {color: "rgba(35,35,25)", side: THREE.BackSide} );
                material.opacity = .2;
                material.transparent = true;
                material.blending = THREE.SubtractiveBlending;
				if(this.model.get("additive")){
					material.blending = THREE.AdditiveBlending;
				}
                let plane = new THREE.Mesh( geometry, material );
                
                
                //plane.rotation.z = .5*3.1415;
                plane.position.z = this.box[2];
                
                //plane.rotation.z = 0;
                this.scene.add(plane);
                
                
                plane = new THREE.Mesh( geometry, material );
                plane.rotation.x = 3.1415;
                //plane.rotation.y = .5*3.1415;
                plane.position.z = -this.box[2];
                
                
                //plane.rotation.z = 0;
                this.scene.add(plane);
                
            }
        
            //draw box 
            let points = [];
            points.push(new THREE.Vector3( this.box[0], this.box[1], this.box[2]));
            points.push(new THREE.Vector3( this.box[0], -this.box[1], this.box[2]));
            points.push(new THREE.Vector3( -this.box[0], -this.box[1], this.box[2]));
            points.push(new THREE.Vector3( -this.box[0], this.box[1], this.box[2]));
            points.push(new THREE.Vector3( this.box[0], this.box[1], this.box[2]));
            let geometry = new THREE.BufferGeometry().setFromPoints( points );
            let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x777777 }));
            this.scene.add(line);
            
            points = [];
            points.push(new THREE.Vector3( this.box[0], this.box[1], -this.box[2]));
            points.push(new THREE.Vector3( this.box[0], -this.box[1], -this.box[2]));
            points.push(new THREE.Vector3( -this.box[0], -this.box[1], -this.box[2]));
            points.push(new THREE.Vector3( -this.box[0], this.box[1], -this.box[2]));
            points.push(new THREE.Vector3( this.box[0], this.box[1], -this.box[2]));
            geometry = new THREE.BufferGeometry().setFromPoints( points );
            line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x777777 }));
            this.scene.add(line);
            
            points = [];
            points.push(new THREE.Vector3( this.box[0], this.box[1], -this.box[2]));
            points.push(new THREE.Vector3( this.box[0], this.box[1], this.box[2]));
            geometry = new THREE.BufferGeometry().setFromPoints( points );
            line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x777777 }));
            this.scene.add(line);
            
            points = [];
            points.push(new THREE.Vector3( this.box[0], -this.box[1], -this.box[2]));
            points.push(new THREE.Vector3( this.box[0], -this.box[1], this.box[2]));
            geometry = new THREE.BufferGeometry().setFromPoints( points );
            line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x777777 }));
            this.scene.add(line);
            
            points = [];
            points.push(new THREE.Vector3( -this.box[0], this.box[1], -this.box[2]));
            points.push(new THREE.Vector3( -this.box[0], this.box[1], this.box[2]));
            geometry = new THREE.BufferGeometry().setFromPoints( points );
            line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x777777 }));
            this.scene.add(line);
            
            points = [];
            points.push(new THREE.Vector3( -this.box[0], -this.box[1], -this.box[2]));
            points.push(new THREE.Vector3( -this.box[0], -this.box[1], this.box[2]));
            geometry = new THREE.BufferGeometry().setFromPoints( points );
            line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x777777 }));
            this.scene.add(line);
        }
        
        
        
        
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
    
    
};

