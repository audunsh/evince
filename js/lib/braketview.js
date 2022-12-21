import { DOMWidgetModel, DOMWidgetView } from '@jupyter-widgets/base';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Controls/OrbitControls.js';
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
// differ from the defaults will be serialized.

export class BraketModel extends DOMWidgetModel {
    defaults() {
      return {
        ...super.defaults(),
        _model_name : 'BraketModel',
        _view_name : 'BraketView',
        _model_module : 'evince',
        _view_module : 'evince',
        _model_module_version : '0.46.0',
        _view_module_version : '0.46.0'
      };
    }
  }



export class BraketView extends DOMWidgetView {
    render() {
		console.log("Hello from BraketView 43.0");
        const scene = new THREE.Scene();
        this.scene = scene;

        let camera = new THREE.PerspectiveCamera( 75, document.activeElement.clientWidth/(document.activeElement.clientWidth*.6), 0.1, 1000 );
        this.camera = camera;
        camera.position.z = 5;


        //console.log(VRButton);
        const renderer = new THREE.WebGLRenderer();
        //document.body.appendChild( VRButton.createButton( renderer ) );
        this.renderer = renderer;
        //this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
		//this.renderer.setSize( document.documentElement.clientWidth*.75, document.documentElement.clientWidth*.6*.75 );

        // this should be changed in future implementations, to ensure correct behaviour in various contexts
        this.renderer.setSize( .99*document.activeElement.clientWidth, .99*document.activeElement.clientWidth*.6);
        
        // uncomment the following line for correct pixelratio (yet, slows down code significantly)
        //renderer.setPixelRatio( window.devicePixelRatio );
        
        //renderer.setClearColor( 0xfaf8ec, 1);
        //this.renderer.setClearColor( 0x0f0f2F, 1);
		//console.log(this.model.get("bg_color"));
		const bg_color = new THREE.Color(this.model.get("bg_color")[0],this.model.get("bg_color")[1],this.model.get("bg_color")[2] );

		this.renderer.setClearColor(bg_color, 1);
        this.renderer.antialias = true;
        //renderer.xr.enabled = true;
        

        if(this.model.get('vr_button')){
            this.el.appendChild( VRButton.createButton( this.renderer ) );
            this.renderer.xr.enabled = true;
            //this.renderer.setAnimationLoop( function () {
            //    this.renderer.render( this.scene, this.camera );
            //} );
        }

		
		
        
        ////this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        //const controls = new OrbitControls(this.camera, this.renderer.domElement);
        //var control = new OrbitControls(this.camera, this.renderer.domElement);
        const controls = new OrbitControls(this.camera, this.renderer.domElement);

        
        /*
        controls.addEventListener( 'change', reduce_aspect );
        controls.addEventListener( 'change', _.debounce(function() {
            renderer.setPixelRatio( window.devicePixelRatio/2 );
            render();
          }));



        function reduce_aspect(){
            renderer.setPixelRatio( window.devicePixelRatio/4 );
        }
        */
        
        //this.controls = controls;
        window.addEventListener( 'resize', onWindowResize );

        


        //controllers for molecule editing
        function onWindowResize() {
            console.log("window_resize");
            camera.aspect = document.activeElement.clientWidth/(document.activeElement.clientWidth*.6);
            camera.updateProjectionMatrix();

            renderer.setSize( document.activeElement.clientWidth, document.activeElement.clientWidth*.6 );

        }

        
        this.init_changed();
        this.el.append(this.renderer.domElement);
        //this.el.appendChild( VRButton.createButton( renderer ) );
        //this.pos_changed();
        //this.surf_changed();
        this.ao_changed();
        //this.model.on('change:pos', this.pos_changed, this);
        this.model.on('change:init', this.init_changed, this);
        //this.model.on('change:surf', this.surf_changed, this);
        this.model.on('change:ao', this.ao_changed, this);

		//console.log(this.render2);
		//console.log(this.renderer.render);
		//console.log(this.camera);
		//console.log(this.scene);

        //only if evolving in time
		animate();
        //render();

		function animate() {
			renderer.setAnimationLoop( render );

		}

		function render() {
            for(let i = 0; i < scene.children.length; i++){
                let time = performance.now()
                scene.children[i].material.uniforms.time.value += 0.01; //time;
            }
			renderer.render( scene, camera );
            //postprocessing.composer.render(  );

		}
    }


    init_changed() {
        this.pos = this.model.get('pos');
        this.masses = this.model.get('masses');
        this.colors = this.model.get('colors');
        //this.box = this.model.get('box');
        
        //this.camera.position.z = 2*Math.abs(this.box[2]);
    
        /*
        for (let i =0; i < this.pos.length; i++){
            let material = new THREE.MeshStandardMaterial( { color:  "rgb(" + [this.colors[i][0], this.colors[i][1], this.colors[i][2]].join(",") + ")"}  );
            material.metalness = .1;
            let geometry = new THREE.SphereGeometry(.1*this.masses[i]);
            let new_cube = new THREE.Mesh( geometry, material );

            new_cube.position.x = this.pos[i][0];
            new_cube.position.y = this.pos[i][1];
            new_cube.position.z = this.pos[i][2];


            this.scene.add( new_cube );

            geometry.dispose();
            material.dispose();
        
            
            
        }
		*/
        
        
        //let light = new THREE.AmbientLight( 0x202020, 5 ); // soft white light
        //this.scene.add( light );
        
        //const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
        //directionalLight.position.set( 1, 1, 1 );
        //this.scene.add( directionalLight );
    }
    
    pos_changed() {
        
        this.pos = this.model.get('pos');
        
        for (let i =0; i < this.pos.length; i++){
            let pos_i = this.pos[i];
            let children_i = this.scene.children[i]
            children_i.position.x = pos_i[0];
            children_i.position.y = pos_i[1];
            children_i.position.z = pos_i[2];
            
        }
    }

    surf_changed() {
        
        this.surf = this.model.get('surf');
        
        
        for (let i =0; i < this.surf.length; i++){
            
            var vertex_shader = `uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            varying vec3 pos;
            varying vec3 tex;

            void main() {
                vUv = uv;
                pos = vec3(position.x, position.y, position.z);
                tex = vec3(position.x+time, position.y, position.z);
                //pos = vec3(position.x + time * resolution.x, position.y + time * resolution.y, position.z);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
            }`;

            var fragment_shader = `uniform vec3 user_color;
            uniform float time;

            varying vec2 vUv;
            varying vec3 pos;
            varying vec3 tex;
            varying float q;

            void main() {

                vec2 p = vUv;
                //float q = vUv[0]*vUv[0] + vUv[1]*vUv[1];
                float q = tex[0]*tex[0] + tex[1]*tex[1] + tex[2]*tex[2];

                //gl_FragColor = vec4(.5*(1+sin(118.5*q*q))*exp(-6.0*q), 0.0, 0.0, 0.8);


                //gl_FragColor = gl_FragColor + vec4(.1*tex[2]*(tex[1]*tex[1]-tex[0]*tex[0])*exp(-0.3*q), cos(tex[0])*exp(-0.3*q), 0.5, 1.2);
                gl_FragColor = gl_FragColor + .01*vec4(2.0* tex[2]*(tex[1]*tex[1]-tex[0]*tex[0])*exp(-0.1*q), 0.2, 0.5, 0.5);



                //gl_FragColor = vec4(exp(-4.0*q), 0.0, 0.0, 0.5);

            }`;
            
            var fragment_shader = `uniform vec3 user_color;
uniform float time;

varying vec2 vUv;
varying vec3 pos;
varying vec3 tex;
varying float q;

void main() {

vec2 p = vUv;
float q = tex[0]*tex[0] + tex[1]*tex[1] + tex[2]*tex[2];

    gl_FragColor = gl_FragColor + .01*vec4(.5 + 1.7369481664870148*sqrt(15)*pow(3.141592653589793, -0.75)*tex[2]*(pow(tex[0], 2) - pow(tex[1], 2))*exp(-pow(tex[0], 2) - pow(tex[1], 2) - pow(tex[2], 2)), 0.2, 0.5, 0.5);
}`;

            let material = new THREE.ShaderMaterial( {

                uniforms: {

                    time: { value: 0.0 },
                    resolution: { value: new THREE.Vector2() }

                },

                vertexShader: vertex_shader,

                fragmentShader: fragment_shader,
                
                side: THREE.DoubleSide,
                
                blending : THREE.SubtractiveBlending,

            } );
            material.depthWrite = false;
            
            let geometry = new THREE.BufferGeometry();
            geometry.setIndex( this.surf[1] );
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( this.surf[0], 3 ) );
            
            //let material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
            let mesh = new THREE.Mesh( geometry, material );
            
            //this.scene.add(mesh);

            
        }
        
    }

    ao_changed() {
        
        this.ao = this.model.get('ao');

		// if surface view enabled, make 2D visualization projection
		this.surface_view = this.model.get('surface_view');
		
        
        var fragment_shader = this.model.get('fragment_shader');

		if(this.surface_view){
			var vertex_shader = `uniform float time;
uniform vec2 resolution;
varying vec2 vUv;
varying vec3 pos;
varying vec3 tex;

void main() {
	vUv = uv;
	pos = vec3(position.x, position.y, position.z);
	tex = vec3(position.x, position.y, position.z);
	//pos = vec3(position.x + time * resolution.x, position.y + time * resolution.y, position.z);
	gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}`;

			let material = new THREE.ShaderMaterial( {

				uniforms: {

					time: { value: 0.0 },
					resolution: { value: new THREE.Vector2() }

				},

				vertexShader: vertex_shader,

				fragmentShader: fragment_shader,

				side: THREE.DoubleSide,

				blending : THREE.SubtractiveBlending,

			} );
			material.depthWrite = false;
			if(this.model.get("additive")){
				material.blending = THREE.AdditiveBlending;
			}

			//console.log(this.surf[0], this.surf[1]);

			//let index = THREE.BufferAttribute( Array.from(this.surf[i][0] ) );

			//let geometry = THREE.BufferGeometry( {'position':this.surf[i][1], 'index':index} );



			let geometry = new THREE.PlaneGeometry( 10000, 10000 );
			let mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = 0.0;
			mesh.position.y = 0.0;
			mesh.position.z = 0.0;

			this.scene.add(mesh);

		}
		else{
        	var vertex_shader = `uniform float time;
uniform vec2 resolution;
varying vec2 vUv;
varying vec3 pos;
varying vec3 tex;

void main() {
	vUv = uv;
	pos = vec3(position.x, position.y, position.z);
	tex = vec3(position.x, position.y, position.z);
	//pos = vec3(position.x + time * resolution.x, position.y + time * resolution.y, position.z);
	gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}`;

			var vertexShader = `// Define the attributes
varying vec3 vColor;
varying vec3 tex;
varying vec2 vUv;

attribute vec3 aRadius;
attribute vec3 aCurve;

void main(){
//vec3 transformed = position*aRadius.x*length(cameraPosition);
vec3 transformed = position*aRadius.x*length(cameraPosition); //n
//vec3 transformed = position*aRadius.x*length(modelViewMatrix[3])*2.0; 

//tex = vec3(transformed.x, transformed.y, transformed.z) + cameraPosition; // + 3.0*cameraPosition; 
tex = vec3(transformed.x, transformed.y, transformed.z) + 3.0*cameraPosition; //n

// 3. Get position and add it to the final position
//vec3 curvePosition = vec3(aCurve.x, aCurve.y, aCurve.z);

//transformed += curvePosition;

gl_Position = projectionMatrix * modelViewMatrix * vec4(tex, 1.0);

//vColor = aColor;
//vPis = gl_position;
}`; 

			let baseGeometry = new THREE.SphereBufferGeometry(1.0);
			let instancedGeometry = new THREE.InstancedBufferGeometry().copy(baseGeometry);
			let instanceCount = this.model.get("n_concentric");
            console.log("number of concetric spheres:", instanceCount);
			instancedGeometry.maxInstancedCount = instanceCount;

			let aRadius = []; //array to contain size
			let aCurve = []; //array to contain position

			for (let i = 0; i < instanceCount; i++) {
				aCurve.push(0.0, 0.0, 0.0);
				//aColor.push(.3 + .001*this.colors[i][0], .3+ .001*this.colors[i][1], .3+ .001*this.colors[i][2]);
				//aRadius.push((i**1.1+.1)*0.03, 0.0, 0.0); //no camera scaling
                //aRadius.push((i**1.1 + 1.0)*0.03, 0.0, 0.0); //no camera scaling
				
                aRadius.push(2.0*(i/instanceCount)**1.5 + 3.0 - 1.0, 0.0, 0.0); // offset impl
                
                //aRadius.push(2.0*(i/instanceCount)**0.5 + 0.1, 0.0, 0.0);
                //r = (2*(t/N)**1.5  + dist-0.9)*c_length
			}

			let aCurveFloat32 = new Float32Array(aCurve);
			instancedGeometry.setAttribute(
			"aCurve",
			new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
			);

			let aRadiusFloat32 = new Float32Array(aRadius);
			instancedGeometry.setAttribute(
			"aRadius",
			new THREE.InstancedBufferAttribute(aRadiusFloat32, 3, false)
			);
			
			this.instancedGeometry = instancedGeometry;
			
			let material = new THREE.ShaderMaterial({
				fragmentShader: fragment_shader,
				vertexShader: vertexShader,
				uniforms: {

					time: { value: 0.0 },
					resolution: { value: new THREE.Vector2() }

				},
				side: THREE.BackSide,

				blending : THREE.SubtractiveBlending,
			});
			if(this.model.get("additive")){
				material.blending = THREE.AdditiveBlending;
			}


			material.depthWrite = false;

			let imesh = new THREE.InstancedMesh( instancedGeometry, material, instanceCount );
			imesh.instanceMatrix.needsUpdate = true;
			this.scene.add(imesh);
	}
		
    }
}