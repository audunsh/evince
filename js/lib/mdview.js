import { DOMWidgetModel, DOMWidgetView, ISerializers, IWidgetManager} from '@jupyter-widgets/base';

import * as THREE from 'three';
import { FrontSide } from 'three';
import { OrbitControls } from 'three/examples/jsm/Controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';


/*
function deserialize_numpy_array(data, manager) {
    if(data == null)
        return null;
    console.log("binary array")
    window.last_data = data
    var ar = new Float32Array(data.data.buffer)
    window.last_array = ar
    return {data:ar, shape:data.shape, nested:data.nested}
}

function serialize_numpy_array(data, m) {
    console.log("serialize")
    return data;//[0,9]
}





serializers: _.extend({
    x: { deserialize: deserialize_numpy_array, serialize: serialize_numpy_array  },
    x2: { deserialize: deserialize_numpy_array, serialize: serialize_numpy_array },
}, widgets.WidgetModel.serializers)
*/


export class MDModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'MDModel',
			_view_name : 'MDView',
			_model_module : 'evince',
			_view_module : 'evince',
			_model_module_version : '0.47.0',
			_view_module_version : '0.47.0'
        };
    }
}


// Custom View. Renders the widget model.
export class MDView extends DOMWidgetView {
    
    render() {
        super.render();
        const scene = new THREE.Scene();
        this.scene = scene;

        let raycaster = new THREE.Raycaster();
		//let pointer = new THREE.Vector2();
        let selectedObject = null;
        this.raycaster = raycaster;
        //this.pointer = null;
        const mouse = new THREE.Vector2( 1, 1 );
        this.mouse = mouse;
        this.selectedObject = selectedObject;
        

		let camera = new THREE.PerspectiveCamera( 75, document.activeElement.clientWidth/(document.activeElement.clientWidth*.6), 0.1, 1000 );
        
        //let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera = camera;
        this.camera.position.z = 5;
        this.camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.6);
        this.camera.updateProjectionMatrix();

        //console.log("init scene");


        

        //console.log(VRButton);
        const renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        //document.body.appendChild( VRButton.createButton( renderer ) );
        this.renderer = renderer;
        
        this.el.appendChild( VRButton.createButton( this.renderer ) );
        
        // the purpose of this line has been forgotten (was XR-compliant code)
        //this.renderer.setAnimationLoop( function () {
        //    renderer.render( scene, camera );
        //} );

        //this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
		this.renderer.setSize( document.activeElement.clientWidth, document.activeElement.clientWidth*.6);
        
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
        this.colors_changed();
        this.radius_changed();
        this.count_changed();

        this.model.on('change:pos', this.pos_changed, this);
        this.model.on('change:colors', this.colors_changed, this);
        this.model.on('change:radius', this.radius_changed, this);
        this.model.on('change:count', this.count_changed, this);

        //window.addEventListener( 'mousemove', onMouseMove , this);
        //document.addEventListener( 'mousemove', onMouseMove );
        



        this.model.on('change:init', this.init_changed, this);

        var self = this;

        function onMouseMove( event ) {

            event.preventDefault();

            self.controls.update();

            var rect =  event.target.getBoundingClientRect();

            self.mouse.x = 2*(event.clientX - rect.left) / (rect.right  - rect.left) - 1;
            self.mouse.y = -2*(event.clientY - rect.top)  / (rect.bottom - rect.top) + 1;



            self.raycaster.setFromCamera( self.mouse, self.camera );

            let mesh = self.scene.children[0];

            const intersection = self.raycaster.intersectObject( mesh );

            //console.log(mesh);
            //console.log(raycaster);
            console.log(self.mouse.x, self.mouse.y, intersection.length);

            if ( intersection.length > 0 ) {

                const instanceId = intersection[ 0 ].instanceId;

                //mesh.getColorAt( instanceId, color );
                console.log("intersected", instanceId);

                /*if ( color.equals( white ) ) {

                    mesh.setColorAt( instanceId, color.setHex( Math.random() * 0xffffff ) );

                    mesh.instanceColor.needsUpdate = true;

                }*/

            }

            

        }
        

        //this.animate();


		animate();

		function animate() {
            renderer.setAnimationLoop( render );

            

            


			
            


		}
        

		function render() {

            //console.log("intersected", mouse.x);

            //controls.update();

            
            





            //self.pos_changed();
            //self.radius_changed();
            //self.colors_changed();
            
            
            
            /*
            self.pos = self.model.get('pos');
            self.masses = self.model.get('masses');
            //console.log(typeof this.pos);
            let mesh = self.scene.children[0];
            //mesh.setDrawRange(self.pos.length);
            //mesh.geometry.setDrawRange(0, self.pos.length);
            //mesh.count = self.pos.length;
            
            //console.log(self.masses.length);
            let m4 = new THREE.Matrix4();
            
            let aCurve = [];
            
            
            
            if(self.box.length>2){


            
                //for (let i = 0; i < mesh.count; i++) {
                //  aCurve.push(this.pos[i][0], this.pos[i][1], this.pos[i][2]);
                //}

                let aCurveFloat32 = new Float32Array(self.model.get('pos').buffer); //, 4);
                mesh.count = aCurveFloat32.length/3;
                self.scene.children[0].geometry.setAttribute(
                "aCurve",
                new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
                );

                
                let aRadiusFloat32 = new Float32Array(self.model.get('radius').buffer); //, 3);
                self.scene.children[0].geometry.setAttribute(
                    "aRadius",
                    new THREE.InstancedBufferAttribute(aRadiusFloat32, 1, false)
                );    
                //self.scene.children[0].geometry.attributes.aRadius.needsUpdate = true;

                //let aColorFloat32 = new Float32Array(self.model.get('colors').buffer); //, 3);
                //self.scene.children[0].geometry.setAttribute(
                //    "aColor",
                //    new THREE.InstancedBufferAttribute(aColorFloat32, 3, false)
                //);
                //self.scene.children[0].geometry.attributes.aColor.needsUpdate = true;
                


            }
            if(self.box.length==2){
                //for (let i = 0; i < mesh.count; i++) {
                //  aCurve.push(this.pos[i][0], this.pos[i][1]);
                //}
                let aCurveFloat32 = new Float32Array(self.pos.flat(), 2);
                
                //let aCurveFloat32 = new Float32Array(aCurve);
                //console.log(mesh, mesh.geometry);
                self.scene.children[0].geometry.setAttribute(
                "aCurve",
                new THREE.InstancedBufferAttribute(aCurveFloat32, 2, false)
                );
                
            }
            */
            
            
            //self.scene.children[0].geometry.attributes.aCurve.needsUpdate = true;
            //self.scene.children[0].geometry.attributes.aColor.needsUpdate = true;
            //self.scene.children[0].geometry.attributes.aRadius.needsUpdate = true;
            





			renderer.render( scene, camera );
            //postprocessing.composer.render(  );

		}

        
        
        
    }

    init_changed() {
        //console.log("init change");
        this.pos = this.model.get('pos');
        this.masses = this.model.get('masses');
        this.radius = this.model.get('radius');
        this.colors = this.model.get('colors');
        this.box = this.model.get('box');
        this.count = this.model.get('count');
        if(this.box.length>2){
            this.camera.position.z = 2*Math.abs(this.box[2]);
            //console.log("3d initt");
        }
        
        let baseGeometry = new THREE.SphereBufferGeometry(.3);
        let instancedGeometry = new THREE.InstancedBufferGeometry().copy(baseGeometry);
        let instanceCount = this.model.get('max_instances');
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
              new THREE.InstancedBufferAttribute(aCurveFloat32, 2, false)
            );

            /*
            let aCurveFloat32 = new Float32Array(this.pos.flat(), 2);
            //console.log(mesh, mesh.geometry);
            //console.log(typeof aCurve);
            //console.log(typeof this.pos[0]);
            instancedGeometry.setAttribute(
                "aCurve",
                new THREE.InstancedBufferAttribute(aCurveFloat32, 2, false)
            )*/




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

            //console.log(this.pos);

            /*
            let aCurveFloat32 = new Float32Array(this.pos.flat(), 3);
            //console.log(aCurveFloat32);
            
            //console.log(mesh, mesh.geometry);
            //console.log(typeof aCurve);
            //console.log(typeof this.pos[0]);
            instancedGeometry.setAttribute(
                "aCurve",
                new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
            )*/

            
            /*
            for (let i = 0; i < instanceCount; i++) {
              aCurve.push(this.pos[i][0], this.pos[i][1], this.pos[i][2]);
              //aColor.push(.3 + .001*this.colors[i][0], .3+ .001*this.colors[i][1], .3+ .001*this.colors[i][2]);
              aColor.push(this.colors[i][0], this.colors[i][1], this.colors[i][2]);
            }
            */
            



            let aCurveFloat32 = new Float32Array(this.pos.buffer); //, 3);
            instancedGeometry.setAttribute(
              "aCurve",
              new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
            );

            

            let aRadiusFloat32 = new Float32Array(this.radius.buffer); //, 3);
            instancedGeometry.setAttribute(
              "aRadius",
              new THREE.InstancedBufferAttribute(aRadiusFloat32, 1, false)
            );


            let aColorFloat32 = new Float32Array(this.colors.buffer); //, 3);
            instancedGeometry.setAttribute(
              "aColor",
              new THREE.InstancedBufferAttribute(aColorFloat32, 3, false)
            );
            

            



            var vertexShader = `attribute vec3 aColor;
varying vec3 vColor;
//varying vec3 vPos;

attribute vec4 aCurve;
attribute float aRadius;

void main(){
vec3 transformed = position*aRadius;


// Get position and add it to the final position
vec3 curvePosition = vec3(aCurve.x, aCurve.y, aCurve.z);
transformed += curvePosition;

gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
vColor = aColor*(.7 + .3*normal[0]);
}`;            
        }
        
        
        
        
        
        /*
        let aColorFloat32 = new Float32Array(this.colors.flat(), 3);
        instancedGeometry.setAttribute(
          "aColor",
          new THREE.InstancedBufferAttribute(aColorFloat32, 3, false)
        );
        */
        
        this.instancedGeometry = instancedGeometry;
        
        
        
        
        var fragmentShader = `varying vec3 vColor;
void main(){
gl_FragColor = gl_FragColor + vec4(vColor, 1.0);
}`;
        console.log(this.box.length); 
        console.log(fragmentShader);
        console.log(vertexShader);
        
        let material = new THREE.ShaderMaterial({
          fragmentShader: fragmentShader,
          vertexShader: vertexShader
        });

		//let material = new THREE.MeshBasicMaterial( { color: 0xffaa00, transparent: false, blending: THREE.SubtractiveBlending } ) ; //new THREE.MeshNormalMaterial();
        
        //console.log(THREE);
        
        instancedGeometry.needsUpdate = true;
        
        let imesh = new THREE.InstancedMesh( instancedGeometry, material, instanceCount );

        imesh.count = this.model.get('count');
        //imesh.instanceMatrix.needsUpdate = true;

        //imesh.geometry.attributes.needsUpdate = true;
        //imesh.geometry.attributes[1].needsUpdate = true;
        //imesh.geometry.attributes[2].needsUpdate = true;
        
        //Object.values(imesh.attributes).forEach((attribute) => {
        //    attribute.needsUpdate = true
        //  })
        this.scene.add(imesh);

        //this.scene.children[0].geometry.attributes.aCurve.needsUpdate = true;
        //this.scene.children[0].geometry.attributes.aColor.needsUpdate = true;
        //this.scene.children[0].geometry.attributes.aRadius.needsUpdate = true;


        

        
        
        
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

    count_changed(){
        this.scene.children[0].count = this.model.get('count');
    }
    
    pos_changed() {
        //console.log("changed_pos");
        
        this.pos = this.model.get('pos');
        let aCurveFloat32 = new Float32Array(this.pos.buffer); //, 3);

        //this.scene.children[0].count = aCurveFloat32.length/3;

        this.scene.children[0].geometry.setAttribute(
            "aCurve",
            new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
        );
        
        //this.scene.children[0].geometry.attributes.aCurve.needsUpdate = true;
        }

    radius_changed() {
        let aRadiusFloat32 = new Float32Array(this.model.get('radius').buffer); //, 3);
        this.scene.children[0].geometry.setAttribute(
            "aRadius",
            new THREE.InstancedBufferAttribute(aRadiusFloat32, 1, false)
        );    
        //this.scene.children[0].geometry.attributes.aRadius.needsUpdate = true;
    }

    colors_changed(){
        
        let aColorFloat32 = new Float32Array(this.model.get('colors').buffer); //, 3);
        this.scene.children[0].geometry.setAttribute(
              "aColor",
              new THREE.InstancedBufferAttribute(aColorFloat32, 3, false)
        );
        
        //this.scene.children[0].geometry.attributes.aColor.needsUpdate = true;
    }
    
    
};

