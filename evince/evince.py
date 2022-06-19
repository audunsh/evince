# Evince - behold all the beautiful molecules!
# Audun Skau Hansen (2022)

import evince.models as models
import evince.processing as processing
import evince.system as system
import evince.mdview as mdview
import evince.latticeview as latticeview

from evince.mdview import MDView
from evince.latticeview import LatticeView


import numpy as np
from IPython.display import Javascript

def enable_notebook():
    """
    Activate Evince on the Juptyer frontend
    """
    s = """require.undef('mdview');
require.undef('latticeview');
require.config({paths: {three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three"}});



define('mdview', ['@jupyter-widgets/base','three' ], function(widgets, THREE, object) {
    
    /**
     * @author qiao / https://github.com/qiao
     * @author mrdoob / http://mrdoob.com
     * @author alteredq / http://alteredqualia.com/
     * @author WestLangley / http://github.com/WestLangley
     * @author erich666 / http://erichaines.com
     */
    /*global THREE, console */

    // This set of controls performs orbiting, dollying (zooming), and panning. It maintains
    // the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
    // supported.
    //
    //    Orbit - left mouse / touch: one finger move
    //    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
    //    Pan - right mouse, or arrow keys / touch: three finter swipe
    //
    // This is a drop-in replacement for (most) TrackballControls used in examples.
    // That is, include this js file and wherever you see:
    //    	controls = new THREE.TrackballControls( camera );
    //      controls.target.z = 150;
    // Simple substitute "OrbitControls" and the control should work as-is.

    THREE.OrbitControls = function ( object, domElement ) {

        this.object = object;
        this.domElement = ( domElement !== undefined ) ? domElement : document;

        // API

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the control orbits around
        // and where it pans with respect to.
        this.target = new THREE.Vector3();

        // center is old, deprecated; use "target" instead
        this.center = this.target;

        // This option actually enables dollying in and out; left as "zoom" for
        // backwards compatibility
        this.noZoom = false;
        this.zoomSpeed = 1.0;

        // Limits to how far you can dolly in and out
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // Set to true to disable this control
        this.noRotate = false;
        this.rotateSpeed = 1.0;

        // Set to true to disable this control
        this.noPan = false;
        this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

        // Set to true to automatically rotate around the target
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // Set to true to disable use of the keys
        this.noKeys = false;

        // The four arrow keys
        this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

        ////////////
        // internals

        var scope = this;

        var EPS = 0.000001;

        var rotateStart = new THREE.Vector2();
        var rotateEnd = new THREE.Vector2();
        var rotateDelta = new THREE.Vector2();

        var panStart = new THREE.Vector2();
        var panEnd = new THREE.Vector2();
        var panDelta = new THREE.Vector2();
        var panOffset = new THREE.Vector3();

        var offset = new THREE.Vector3();

        var dollyStart = new THREE.Vector2();
        var dollyEnd = new THREE.Vector2();
        var dollyDelta = new THREE.Vector2();

        var phiDelta = 0;
        var thetaDelta = 0;
        var scale = 1;
        var pan = new THREE.Vector3();

        var lastPosition = new THREE.Vector3();
        var lastQuaternion = new THREE.Quaternion();

        var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

        var state = STATE.NONE;

        // for reset

        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();

        // so camera.up is the orbit axis

        var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
        var quatInverse = quat.clone().inverse();

        // events

        var changeEvent = { type: 'change' };
        var startEvent = { type: 'start'};
        var endEvent = { type: 'end'};

        this.rotateLeft = function ( angle ) {

            if ( angle === undefined ) {

                angle = getAutoRotationAngle();

            }

            thetaDelta -= angle;

        };

        this.rotateUp = function ( angle ) {

            if ( angle === undefined ) {

                angle = getAutoRotationAngle();

            }

            phiDelta -= angle;

        };

        // pass in distance in world space to move left
        this.panLeft = function ( distance ) {

            var te = this.object.matrix.elements;

            // get X column of matrix
            panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
            panOffset.multiplyScalar( - distance );

            pan.add( panOffset );

        };

        // pass in distance in world space to move up
        this.panUp = function ( distance ) {

            var te = this.object.matrix.elements;

            // get Y column of matrix
            panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
            panOffset.multiplyScalar( distance );

            pan.add( panOffset );

        };

        // pass in x,y of change desired in pixel space,
        // right and down are positive
        this.pan = function ( deltaX, deltaY ) {

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if ( scope.object.fov !== undefined ) {

                // perspective
                var position = scope.object.position;
                var offset = position.clone().sub( scope.target );
                var targetDistance = offset.length();

                // half of the fov is center to top of screen
                targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

                // we actually don't use screenWidth, since perspective camera is fixed to screen height
                scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
                scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

            } else if ( scope.object.top !== undefined ) {

                // orthographic
                scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
                scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

            } else {

                // camera neither orthographic or perspective
                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

            }

        };

        this.dollyIn = function ( dollyScale ) {

            if ( dollyScale === undefined ) {

                dollyScale = getZoomScale();

            }

            scale /= dollyScale;

        };

        this.dollyOut = function ( dollyScale ) {

            if ( dollyScale === undefined ) {

                dollyScale = getZoomScale();

            }

            scale *= dollyScale;

        };

        this.update = function () {

            var position = this.object.position;

            offset.copy( position ).sub( this.target );

            // rotate offset to "y-axis-is-up" space
            offset.applyQuaternion( quat );

            // angle from z-axis around y-axis

            var theta = Math.atan2( offset.x, offset.z );

            // angle from y-axis

            var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

            if ( this.autoRotate ) {

                this.rotateLeft( getAutoRotationAngle() );

            }

            theta += thetaDelta;
            phi += phiDelta;

            // restrict phi to be between desired limits
            phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

            // restrict phi to be betwee EPS and PI-EPS
            phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

            var radius = offset.length() * scale;

            // restrict radius to be between desired limits
            radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

            // move target to panned location
            this.target.add( pan );

            offset.x = radius * Math.sin( phi ) * Math.sin( theta );
            offset.y = radius * Math.cos( phi );
            offset.z = radius * Math.sin( phi ) * Math.cos( theta );

            // rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion( quatInverse );

            position.copy( this.target ).add( offset );

            this.object.lookAt( this.target );

            thetaDelta = 0;
            phiDelta = 0;
            scale = 1;
            pan.set( 0, 0, 0 );

            // update condition is:
            // min(camera displacement, camera rotation in radians)^2 > EPS
            // using small-angle approximation cos(x/2) = 1 - x^2 / 8

            if ( lastPosition.distanceToSquared( this.object.position ) > EPS
                || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS ) {

                this.dispatchEvent( changeEvent );

                lastPosition.copy( this.object.position );
                lastQuaternion.copy (this.object.quaternion );

            }

        };


        this.reset = function () {

            state = STATE.NONE;

            this.target.copy( this.target0 );
            this.object.position.copy( this.position0 );

            this.update();

        };

        function getAutoRotationAngle() {

            return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

        }

        function getZoomScale() {

            return Math.pow( 0.95, scope.zoomSpeed );

        }

        function onMouseDown( event ) {

            if ( scope.enabled === false ) return;
            event.preventDefault();

            if ( event.button === 0 ) {
                if ( scope.noRotate === true ) return;

                state = STATE.ROTATE;

                rotateStart.set( event.clientX, event.clientY );

            } else if ( event.button === 1 ) {
                if ( scope.noZoom === true ) return;

                state = STATE.DOLLY;

                dollyStart.set( event.clientX, event.clientY );

            } else if ( event.button === 2 ) {
                if ( scope.noPan === true ) return;

                state = STATE.PAN;

                panStart.set( event.clientX, event.clientY );

            }

            document.addEventListener( 'mousemove', onMouseMove, false );
            document.addEventListener( 'mouseup', onMouseUp, false );
            scope.dispatchEvent( startEvent );

        }

        function onMouseMove( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if ( state === STATE.ROTATE ) {

                if ( scope.noRotate === true ) return;

                rotateEnd.set( event.clientX, event.clientY );
                rotateDelta.subVectors( rotateEnd, rotateStart );

                // rotating across whole screen goes 360 degrees around
                scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

                // rotating up and down along whole screen attempts to go 360, but limited to 180
                scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

                rotateStart.copy( rotateEnd );

            } else if ( state === STATE.DOLLY ) {

                if ( scope.noZoom === true ) return;

                dollyEnd.set( event.clientX, event.clientY );
                dollyDelta.subVectors( dollyEnd, dollyStart );

                if ( dollyDelta.y > 0 ) {

                    scope.dollyIn();

                } else {

                    scope.dollyOut();

                }

                dollyStart.copy( dollyEnd );

            } else if ( state === STATE.PAN ) {

                if ( scope.noPan === true ) return;

                panEnd.set( event.clientX, event.clientY );
                panDelta.subVectors( panEnd, panStart );

                scope.pan( panDelta.x, panDelta.y );

                panStart.copy( panEnd );

            }

            scope.update();

        }

        function onMouseUp( /* event */ ) {

            if ( scope.enabled === false ) return;

            document.removeEventListener( 'mousemove', onMouseMove, false );
            document.removeEventListener( 'mouseup', onMouseUp, false );
            scope.dispatchEvent( endEvent );
            state = STATE.NONE;

        }

        function onMouseWheel( event ) {

            if ( scope.enabled === false || scope.noZoom === true ) return;

            event.preventDefault();
            event.stopPropagation();

            var delta = 0;

            if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

                delta = event.wheelDelta;

            } else if ( event.detail !== undefined ) { // Firefox

                delta = - event.detail;

            }

            if ( delta > 0 ) {

                scope.dollyOut();

            } else {

                scope.dollyIn();

            }

            scope.update();
            scope.dispatchEvent( startEvent );
            scope.dispatchEvent( endEvent );

        }

        function onKeyDown( event ) {

            if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;

            switch ( event.keyCode ) {

                case scope.keys.UP:
                    scope.pan( 0, scope.keyPanSpeed );
                    scope.update();
                    break;

                case scope.keys.BOTTOM:
                    scope.pan( 0, - scope.keyPanSpeed );
                    scope.update();
                    break;

                case scope.keys.LEFT:
                    scope.pan( scope.keyPanSpeed, 0 );
                    scope.update();
                    break;

                case scope.keys.RIGHT:
                    scope.pan( - scope.keyPanSpeed, 0 );
                    scope.update();
                    break;

            }

        }

        function touchstart( event ) {

            if ( scope.enabled === false ) return;

            switch ( event.touches.length ) {

                case 1:	// one-fingered touch: rotate

                    if ( scope.noRotate === true ) return;

                    state = STATE.TOUCH_ROTATE;

                    rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    break;

                case 2:	// two-fingered touch: dolly

                    if ( scope.noZoom === true ) return;

                    state = STATE.TOUCH_DOLLY;

                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    var distance = Math.sqrt( dx * dx + dy * dy );
                    dollyStart.set( 0, distance );
                    break;

                case 3: // three-fingered touch: pan

                    if ( scope.noPan === true ) return;

                    state = STATE.TOUCH_PAN;

                    panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    break;

                default:

                    state = STATE.NONE;

            }

            scope.dispatchEvent( startEvent );

        }

        function touchmove( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();
            event.stopPropagation();

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            switch ( event.touches.length ) {

                case 1: // one-fingered touch: rotate

                    if ( scope.noRotate === true ) return;
                    if ( state !== STATE.TOUCH_ROTATE ) return;

                    rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    rotateDelta.subVectors( rotateEnd, rotateStart );

                    // rotating across whole screen goes 360 degrees around
                    scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
                    // rotating up and down along whole screen attempts to go 360, but limited to 180
                    scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

                    rotateStart.copy( rotateEnd );

                    scope.update();
                    break;

                case 2: // two-fingered touch: dolly

                    if ( scope.noZoom === true ) return;
                    if ( state !== STATE.TOUCH_DOLLY ) return;

                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    var distance = Math.sqrt( dx * dx + dy * dy );

                    dollyEnd.set( 0, distance );
                    dollyDelta.subVectors( dollyEnd, dollyStart );

                    if ( dollyDelta.y > 0 ) {

                        scope.dollyOut();

                    } else {

                        scope.dollyIn();

                    }

                    dollyStart.copy( dollyEnd );

                    scope.update();
                    break;

                case 3: // three-fingered touch: pan

                    if ( scope.noPan === true ) return;
                    if ( state !== STATE.TOUCH_PAN ) return;

                    panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    panDelta.subVectors( panEnd, panStart );

                    scope.pan( panDelta.x, panDelta.y );

                    panStart.copy( panEnd );

                    scope.update();
                    break;

                default:

                    state = STATE.NONE;

            }

        }

        function touchend( /* event */ ) {

            if ( scope.enabled === false ) return;

            scope.dispatchEvent( endEvent );
            state = STATE.NONE;

        }

        this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
        this.domElement.addEventListener( 'mousedown', onMouseDown, false );
        this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
        this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

        this.domElement.addEventListener( 'touchstart', touchstart, false );
        this.domElement.addEventListener( 'touchend', touchend, false );
        this.domElement.addEventListener( 'touchmove', touchmove, false );

        window.addEventListener( 'keydown', onKeyDown, false );

        // force an update at start
        this.update();

    };

    THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
    
    


    var mdview = widgets.DOMWidgetView.extend({
        render: function() {
            const scene = new THREE.Scene();
            this.scene = scene;

            let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
            this.camera = camera;
            this.camera.position.z = 5;

            console.log("init scene");


            

            //console.log(VRButton);
            const renderer = new THREE.WebGLRenderer();
            //document.body.appendChild( VRButton.createButton( renderer ) );
            this.renderer = renderer;
            renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
            renderer.setClearColor( 0xfaf8ec, 1);
            renderer.antialias = true;
            //renderer.xr.enabled = true;
            
            let controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
            this.controls = controls;
            
            this.init_changed();
            this.el.append(this.renderer.domElement);
            //this.el.appendChild( VRButton.createButton( renderer ) );
            this.pos_changed();
            this.model.on('change:pos', this.pos_changed, this);
            this.model.on('change:init', this.init_changed, this);
            

            this.animate();
            
            
            
        },
        animate: function() {
            requestAnimationFrame( this.animate.bind(this) );
            this.renderer.render( this.scene, this.camera );
        },
        init_changed: function() {
            console.log("init change");
            this.pos = this.model.get('pos');
            this.masses = this.model.get('masses');
            this.colors = this.model.get('colors');
            this.box = this.model.get('box');
            if(this.box.length>2){
                this.camera.position.z = 2*Math.abs(this.box[2]);
                console.log("3d initt");
            }
            
            
            for (let i =0; i < this.pos.length; i++){
                let material = new THREE.MeshStandardMaterial( { color:  "rgb(" + [this.colors[i][0], this.colors[i][1], this.colors[i][2]].join(",") + ")"}  );
                material.metalness = .1;
                let geometry = new THREE.SphereGeometry(.1*this.masses[i]);
                let new_cube = new THREE.Mesh( geometry, material );



                new_cube.position.x = this.pos[i][0];
                new_cube.position.y = this.pos[i][1];
                if(this.box.length>2){
                    new_cube.position.z = this.pos[i][2];
                }

                



                this.scene.add( new_cube );

                geometry.dispose();
                material.dispose();
                
                
                
            }
            
            //draw walls
            if(this.box.length>2){
                // Draw 3D boundary conditions


                if(this.box[0]>0){
                    let geometry = new THREE.PlaneGeometry( 2*Math.abs(this.box[1]), 2*Math.abs(this.box[2]) );
                    let material = new THREE.MeshBasicMaterial( {color: "rgba(30,30,30)", side: THREE.BackSide} );
                    material.opacity = .01;
                    material.transparent = true;
                    material.blending = THREE.SubtractiveBlending;
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
                    let material = new THREE.MeshBasicMaterial( {color: "rgba(20,20,20)", side: THREE.BackSide} );
                    material.opacity = .01;
                    material.transparent = true;
                    material.blending = THREE.SubtractiveBlending;
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
                    let material = new THREE.MeshBasicMaterial( {color: "rgba(25,25,25)", side: THREE.BackSide} );
                    material.opacity = .01;
                    material.transparent = true;
                    material.blending = THREE.SubtractiveBlending;
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
            
            
                /*let geometry = new THREE.PlaneGeometry( msg.content.data[ 0 ], msg.content.data[ 1 ] );    
                let material = new THREE.MeshBasicMaterial( {color: "rgba(" + [msg.content.data[ 8 ], msg.content.data[ 9 ], msg.content.data[ 10 ]].join(",") + ")", side: THREE.BackSide} );
                
                material.opacity = .1;
                material.transparent = true;
                material.blending = THREE.SubtractiveBlending;


                let plane = new THREE.Mesh( geometry, material );
                plane.position.x = msg.content.data[ 2 ];
                plane.position.y = msg.content.data[ 3 ];
                plane.position.z = msg.content.data[ 4 ];

                plane.rotation.x = msg.content.data[ 5 ];
                plane.rotation.y = msg.content.data[ 6 ];
                plane.rotation.z = msg.content.data[ 7 ];


                scene.add( plane );*/
                
                
                //draw box 
                let points = [];
                points.push(new THREE.Vector3( this.box[0], this.box[1], this.box[2]));
                points.push(new THREE.Vector3( this.box[0], -this.box[1], this.box[2]));
                points.push(new THREE.Vector3( -this.box[0], -this.box[1], this.box[2]));
                points.push(new THREE.Vector3( -this.box[0], this.box[1], this.box[2]));
                points.push(new THREE.Vector3( this.box[0], this.box[1], this.box[2]));
                let geometry = new THREE.BufferGeometry().setFromPoints( points );
                let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( this.box[0], this.box[1], -this.box[2]));
                points.push(new THREE.Vector3( this.box[0], -this.box[1], -this.box[2]));
                points.push(new THREE.Vector3( -this.box[0], -this.box[1], -this.box[2]));
                points.push(new THREE.Vector3( -this.box[0], this.box[1], -this.box[2]));
                points.push(new THREE.Vector3( this.box[0], this.box[1], -this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( this.box[0], this.box[1], -this.box[2]));
                points.push(new THREE.Vector3( this.box[0], this.box[1], this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( this.box[0], -this.box[1], -this.box[2]));
                points.push(new THREE.Vector3( this.box[0], -this.box[1], this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( -this.box[0], this.box[1], -this.box[2]));
                points.push(new THREE.Vector3( -this.box[0], this.box[1], this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( -this.box[0], -this.box[1], -this.box[2]));
                points.push(new THREE.Vector3( -this.box[0], -this.box[1], this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
            }
            
            
            
            
            let light = new THREE.AmbientLight( 0x202020, 5 ); // soft white light
            this.scene.add( light );
            
            const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
            directionalLight.position.set( 1, 1, 1 );
            this.scene.add( directionalLight );
        },
        
        pos_changed: function() {
            
            this.pos = this.model.get('pos');
            
            for (let i =0; i < this.pos.length; i++){
                let pos_i = this.pos[i];
                let children_i = this.scene.children[i];
                children_i.position.x = pos_i[0];
                children_i.position.y = pos_i[1];
                if(this.box.length>2){
                    children_i.position.z = pos_i[2];
                }
                
            }
        }
        
        
    });
    
    
    
    
        
    return {MDView: mdview};
});




define('latticeview', ['@jupyter-widgets/base','three' ], function(widgets, THREE, object) {
    
    /**
     * @author qiao / https://github.com/qiao
     * @author mrdoob / http://mrdoob.com
     * @author alteredq / http://alteredqualia.com/
     * @author WestLangley / http://github.com/WestLangley
     * @author erich666 / http://erichaines.com
     */
    /*global THREE, console */

    // This set of controls performs orbiting, dollying (zooming), and panning. It maintains
    // the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
    // supported.
    //
    //    Orbit - left mouse / touch: one finger move
    //    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
    //    Pan - right mouse, or arrow keys / touch: three finter swipe
    //
    // This is a drop-in replacement for (most) TrackballControls used in examples.
    // That is, include this js file and wherever you see:
    //    	controls = new THREE.TrackballControls( camera );
    //      controls.target.z = 150;
    // Simple substitute "OrbitControls" and the control should work as-is.

    THREE.OrbitControls = function ( object, domElement ) {

        this.object = object;
        this.domElement = ( domElement !== undefined ) ? domElement : document;

        // API

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the control orbits around
        // and where it pans with respect to.
        this.target = new THREE.Vector3();

        // center is old, deprecated; use "target" instead
        this.center = this.target;

        // This option actually enables dollying in and out; left as "zoom" for
        // backwards compatibility
        this.noZoom = false;
        this.zoomSpeed = 1.0;

        // Limits to how far you can dolly in and out
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // Set to true to disable this control
        this.noRotate = false;
        this.rotateSpeed = 1.0;

        // Set to true to disable this control
        this.noPan = false;
        this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

        // Set to true to automatically rotate around the target
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // Set to true to disable use of the keys
        this.noKeys = false;

        // The four arrow keys
        this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

        ////////////
        // internals

        var scope = this;

        var EPS = 0.000001;

        var rotateStart = new THREE.Vector2();
        var rotateEnd = new THREE.Vector2();
        var rotateDelta = new THREE.Vector2();

        var panStart = new THREE.Vector2();
        var panEnd = new THREE.Vector2();
        var panDelta = new THREE.Vector2();
        var panOffset = new THREE.Vector3();

        var offset = new THREE.Vector3();

        var dollyStart = new THREE.Vector2();
        var dollyEnd = new THREE.Vector2();
        var dollyDelta = new THREE.Vector2();

        var phiDelta = 0;
        var thetaDelta = 0;
        var scale = 1;
        var pan = new THREE.Vector3();

        var lastPosition = new THREE.Vector3();
        var lastQuaternion = new THREE.Quaternion();

        var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

        var state = STATE.NONE;

        // for reset

        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();

        // so camera.up is the orbit axis

        var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
        var quatInverse = quat.clone().inverse();

        // events

        var changeEvent = { type: 'change' };
        var startEvent = { type: 'start'};
        var endEvent = { type: 'end'};

        this.rotateLeft = function ( angle ) {

            if ( angle === undefined ) {

                angle = getAutoRotationAngle();

            }

            thetaDelta -= angle;

        };

        this.rotateUp = function ( angle ) {

            if ( angle === undefined ) {

                angle = getAutoRotationAngle();

            }

            phiDelta -= angle;

        };

        // pass in distance in world space to move left
        this.panLeft = function ( distance ) {

            var te = this.object.matrix.elements;

            // get X column of matrix
            panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
            panOffset.multiplyScalar( - distance );

            pan.add( panOffset );

        };

        // pass in distance in world space to move up
        this.panUp = function ( distance ) {

            var te = this.object.matrix.elements;

            // get Y column of matrix
            panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
            panOffset.multiplyScalar( distance );

            pan.add( panOffset );

        };

        // pass in x,y of change desired in pixel space,
        // right and down are positive
        this.pan = function ( deltaX, deltaY ) {

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if ( scope.object.fov !== undefined ) {

                // perspective
                var position = scope.object.position;
                var offset = position.clone().sub( scope.target );
                var targetDistance = offset.length();

                // half of the fov is center to top of screen
                targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

                // we actually don't use screenWidth, since perspective camera is fixed to screen height
                scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
                scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

            } else if ( scope.object.top !== undefined ) {

                // orthographic
                scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
                scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

            } else {

                // camera neither orthographic or perspective
                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

            }

        };

        this.dollyIn = function ( dollyScale ) {

            if ( dollyScale === undefined ) {

                dollyScale = getZoomScale();

            }

            scale /= dollyScale;

        };

        this.dollyOut = function ( dollyScale ) {

            if ( dollyScale === undefined ) {

                dollyScale = getZoomScale();

            }

            scale *= dollyScale;

        };

        this.update = function () {

            var position = this.object.position;

            offset.copy( position ).sub( this.target );

            // rotate offset to "y-axis-is-up" space
            offset.applyQuaternion( quat );

            // angle from z-axis around y-axis

            var theta = Math.atan2( offset.x, offset.z );

            // angle from y-axis

            var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

            if ( this.autoRotate ) {

                this.rotateLeft( getAutoRotationAngle() );

            }

            theta += thetaDelta;
            phi += phiDelta;

            // restrict phi to be between desired limits
            phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

            // restrict phi to be betwee EPS and PI-EPS
            phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

            var radius = offset.length() * scale;

            // restrict radius to be between desired limits
            radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

            // move target to panned location
            this.target.add( pan );

            offset.x = radius * Math.sin( phi ) * Math.sin( theta );
            offset.y = radius * Math.cos( phi );
            offset.z = radius * Math.sin( phi ) * Math.cos( theta );

            // rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion( quatInverse );

            position.copy( this.target ).add( offset );

            this.object.lookAt( this.target );

            thetaDelta = 0;
            phiDelta = 0;
            scale = 1;
            pan.set( 0, 0, 0 );

            // update condition is:
            // min(camera displacement, camera rotation in radians)^2 > EPS
            // using small-angle approximation cos(x/2) = 1 - x^2 / 8

            if ( lastPosition.distanceToSquared( this.object.position ) > EPS
                || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS ) {

                this.dispatchEvent( changeEvent );

                lastPosition.copy( this.object.position );
                lastQuaternion.copy (this.object.quaternion );

            }

        };


        this.reset = function () {

            state = STATE.NONE;

            this.target.copy( this.target0 );
            this.object.position.copy( this.position0 );

            this.update();

        };

        function getAutoRotationAngle() {

            return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

        }

        function getZoomScale() {

            return Math.pow( 0.95, scope.zoomSpeed );

        }

        function onMouseDown( event ) {

            if ( scope.enabled === false ) return;
            event.preventDefault();

            if ( event.button === 0 ) {
                if ( scope.noRotate === true ) return;

                state = STATE.ROTATE;

                rotateStart.set( event.clientX, event.clientY );

            } else if ( event.button === 1 ) {
                if ( scope.noZoom === true ) return;

                state = STATE.DOLLY;

                dollyStart.set( event.clientX, event.clientY );

            } else if ( event.button === 2 ) {
                if ( scope.noPan === true ) return;

                state = STATE.PAN;

                panStart.set( event.clientX, event.clientY );

            }

            document.addEventListener( 'mousemove', onMouseMove, false );
            document.addEventListener( 'mouseup', onMouseUp, false );
            scope.dispatchEvent( startEvent );

        }

        function onMouseMove( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if ( state === STATE.ROTATE ) {

                if ( scope.noRotate === true ) return;

                rotateEnd.set( event.clientX, event.clientY );
                rotateDelta.subVectors( rotateEnd, rotateStart );

                // rotating across whole screen goes 360 degrees around
                scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

                // rotating up and down along whole screen attempts to go 360, but limited to 180
                scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

                rotateStart.copy( rotateEnd );

            } else if ( state === STATE.DOLLY ) {

                if ( scope.noZoom === true ) return;

                dollyEnd.set( event.clientX, event.clientY );
                dollyDelta.subVectors( dollyEnd, dollyStart );

                if ( dollyDelta.y > 0 ) {

                    scope.dollyIn();

                } else {

                    scope.dollyOut();

                }

                dollyStart.copy( dollyEnd );

            } else if ( state === STATE.PAN ) {

                if ( scope.noPan === true ) return;

                panEnd.set( event.clientX, event.clientY );
                panDelta.subVectors( panEnd, panStart );

                scope.pan( panDelta.x, panDelta.y );

                panStart.copy( panEnd );

            }

            scope.update();

        }

        function onMouseUp( /* event */ ) {

            if ( scope.enabled === false ) return;

            document.removeEventListener( 'mousemove', onMouseMove, false );
            document.removeEventListener( 'mouseup', onMouseUp, false );
            scope.dispatchEvent( endEvent );
            state = STATE.NONE;

        }

        function onMouseWheel( event ) {

            if ( scope.enabled === false || scope.noZoom === true ) return;

            event.preventDefault();
            event.stopPropagation();

            var delta = 0;

            if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

                delta = event.wheelDelta;

            } else if ( event.detail !== undefined ) { // Firefox

                delta = - event.detail;

            }

            if ( delta > 0 ) {

                scope.dollyOut();

            } else {

                scope.dollyIn();

            }

            scope.update();
            scope.dispatchEvent( startEvent );
            scope.dispatchEvent( endEvent );

        }

        function onKeyDown( event ) {

            if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;

            switch ( event.keyCode ) {

                case scope.keys.UP:
                    scope.pan( 0, scope.keyPanSpeed );
                    scope.update();
                    break;

                case scope.keys.BOTTOM:
                    scope.pan( 0, - scope.keyPanSpeed );
                    scope.update();
                    break;

                case scope.keys.LEFT:
                    scope.pan( scope.keyPanSpeed, 0 );
                    scope.update();
                    break;

                case scope.keys.RIGHT:
                    scope.pan( - scope.keyPanSpeed, 0 );
                    scope.update();
                    break;

            }

        }

        function touchstart( event ) {

            if ( scope.enabled === false ) return;

            switch ( event.touches.length ) {

                case 1:	// one-fingered touch: rotate

                    if ( scope.noRotate === true ) return;

                    state = STATE.TOUCH_ROTATE;

                    rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    break;

                case 2:	// two-fingered touch: dolly

                    if ( scope.noZoom === true ) return;

                    state = STATE.TOUCH_DOLLY;

                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    var distance = Math.sqrt( dx * dx + dy * dy );
                    dollyStart.set( 0, distance );
                    break;

                case 3: // three-fingered touch: pan

                    if ( scope.noPan === true ) return;

                    state = STATE.TOUCH_PAN;

                    panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    break;

                default:

                    state = STATE.NONE;

            }

            scope.dispatchEvent( startEvent );

        }

        function touchmove( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();
            event.stopPropagation();

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            switch ( event.touches.length ) {

                case 1: // one-fingered touch: rotate

                    if ( scope.noRotate === true ) return;
                    if ( state !== STATE.TOUCH_ROTATE ) return;

                    rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    rotateDelta.subVectors( rotateEnd, rotateStart );

                    // rotating across whole screen goes 360 degrees around
                    scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
                    // rotating up and down along whole screen attempts to go 360, but limited to 180
                    scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

                    rotateStart.copy( rotateEnd );

                    scope.update();
                    break;

                case 2: // two-fingered touch: dolly

                    if ( scope.noZoom === true ) return;
                    if ( state !== STATE.TOUCH_DOLLY ) return;

                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    var distance = Math.sqrt( dx * dx + dy * dy );

                    dollyEnd.set( 0, distance );
                    dollyDelta.subVectors( dollyEnd, dollyStart );

                    if ( dollyDelta.y > 0 ) {

                        scope.dollyOut();

                    } else {

                        scope.dollyIn();

                    }

                    dollyStart.copy( dollyEnd );

                    scope.update();
                    break;

                case 3: // three-fingered touch: pan

                    if ( scope.noPan === true ) return;
                    if ( state !== STATE.TOUCH_PAN ) return;

                    panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    panDelta.subVectors( panEnd, panStart );

                    scope.pan( panDelta.x, panDelta.y );

                    panStart.copy( panEnd );

                    scope.update();
                    break;

                default:

                    state = STATE.NONE;

            }

        }

        function touchend( /* event */ ) {

            if ( scope.enabled === false ) return;

            scope.dispatchEvent( endEvent );
            state = STATE.NONE;

        }

        this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
        this.domElement.addEventListener( 'mousedown', onMouseDown, false );
        this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
        this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

        this.domElement.addEventListener( 'touchstart', touchstart, false );
        this.domElement.addEventListener( 'touchend', touchend, false );
        this.domElement.addEventListener( 'touchmove', touchmove, false );

        window.addEventListener( 'keydown', onKeyDown, false );

        // force an update at start
        this.update();

    };

    THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
    
    


    var latticeview = widgets.DOMWidgetView.extend({
        render: function() {
            const scene = new THREE.Scene();
            this.scene = scene;

            let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
            this.camera = camera;
            camera.position.z = 5;

            


            

            //console.log(VRButton);
            const renderer = new THREE.WebGLRenderer();
            //document.body.appendChild( VRButton.createButton( renderer ) );
            this.renderer = renderer;
            renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
            renderer.setClearColor( 0xfaf8ec, 1);
            renderer.antialias = true;
            //renderer.xr.enabled = true;
            
            let controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
            this.controls = controls;
            
            this.init_changed();
            this.el.append(this.renderer.domElement);
            //this.el.appendChild( VRButton.createButton( renderer ) );
            this.state_changed();
            this.model.on('change:state', this.state_changed, this);
            this.model.on('change:init', this.init_changed, this);
            

            this.animate();
            
            
            
        },
        animate: function() {
            requestAnimationFrame( this.animate.bind(this) );
            this.renderer.render( this.scene, this.camera );
        },
        init_changed: function() {
            this.pos = this.model.get('pos');
            this.masses = this.model.get('masses');
            this.colors = this.model.get('colors');
            this.opacities = this.model.get('opacities');
            
            //var colors = [];
            //this.colors =  colors;
            //for (let i=0; i<this.color.length; i++){
            //    this.colors.push([this.color[i][0], this.color[i][1], this.color[i][2]]);
            //    
            //}
            
            
            
            this.box = this.model.get('box');
            this.state = this.model.get('state');
            
            this.camera.position.z = 2*Math.abs(this.box[2]);
            
            for (let i =0; i < this.pos.length; i++){
                let color_i = this.colors[this.state[i]];
                //console.log(color_i, this.state[i]);
                let material = new THREE.MeshStandardMaterial( { color:  "rgb(0,0,0)"}  );
                
                material.color.r = color_i[0];
                material.color.g = color_i[1];
                material.color.b = color_i[2];
                
                material.metalness = .1;
                material.transparent = true;
                material.opacity = this.opacities[this.state[i]];
                //let geometry = new THREE.SphereGeometry(.1*this.masses[i]);
                //let new_cube = new THREE.Mesh( geometry, material );
                
                //let geometry = new THREE.BoxGeometry(1,1,1);
                let geometry = new THREE.SphereGeometry(.5)
                let new_cube = new THREE.Mesh( geometry, material );



                new_cube.position.x = this.pos[i][0];
                new_cube.position.y = this.pos[i][1];
                if(this.box.length>2){
                    new_cube.position.z = this.pos[i][2];
                }
                

                



                this.scene.add( new_cube );

                geometry.dispose();
                material.dispose();
                
                
                
            }
            
            //draw walls
            if(this.box.length>2){
                // Draw 3D boundary conditions

                
                //draw box 
                let points = [];
                points.push(new THREE.Vector3( .5*this.box[0], .5*this.box[1], .5*this.box[2]));
                points.push(new THREE.Vector3( .5*this.box[0], -.5*this.box[1], .5*this.box[2]));
                points.push(new THREE.Vector3( -.5*this.box[0], -.5*this.box[1], .5*this.box[2]));
                points.push(new THREE.Vector3( -.5*this.box[0], .5*this.box[1], .5*this.box[2]));
                points.push(new THREE.Vector3( .5*this.box[0], .5*this.box[1], .5*this.box[2]));
                let geometry = new THREE.BufferGeometry().setFromPoints( points );
                let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( .5*this.box[0], .5*this.box[1], -.5*this.box[2]));
                points.push(new THREE.Vector3( .5*this.box[0], -.5*this.box[1], -.5*this.box[2]));
                points.push(new THREE.Vector3( -.5*this.box[0], -.5*this.box[1], -.5*this.box[2]));
                points.push(new THREE.Vector3( -.5*this.box[0], .5*this.box[1], -.5*this.box[2]));
                points.push(new THREE.Vector3( .5*this.box[0], .5*this.box[1], -.5*this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( .5*this.box[0], .5*this.box[1], -.5*this.box[2]));
                points.push(new THREE.Vector3( .5*this.box[0], .5*this.box[1], .5*this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( .5*this.box[0], -.5*this.box[1], -.5*this.box[2]));
                points.push(new THREE.Vector3( .5*this.box[0], -.5*this.box[1], .5*this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( -.5*this.box[0], .5*this.box[1], -.5*this.box[2]));
                points.push(new THREE.Vector3( -.5*this.box[0], .5*this.box[1], .5*this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
                
                points = [];
                points.push(new THREE.Vector3( -.5*this.box[0], -.5*this.box[1], -.5*this.box[2]));
                points.push(new THREE.Vector3( -.5*this.box[0], -.5*this.box[1], .5*this.box[2]));
                geometry = new THREE.BufferGeometry().setFromPoints( points );
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
                this.scene.add(line);
            }
            
            
            
            
            
            let light = new THREE.AmbientLight( 0x202020, 5 ); // soft white light
            this.scene.add( light );
            
            const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
            directionalLight.position.set( 1, 1, 1 );
            this.scene.add( directionalLight );
        },
        
        state_changed: function() {
            
            this.state = this.model.get('state');
            this.colors = this.model.get('colors');
            
            for (let i =0; i < this.state.length; i++){
                let state_i = this.state[i];
                let color_i = this.colors[state_i];
                
                let children_i = this.scene.children[i];
                //console.log(this.color[state_i]);
                children_i.material.color.r = color_i[0];
                children_i.material.color.g = color_i[1];
                children_i.material.color.b = color_i[2];
                children_i.material.opacity = this.opacities[state_i];
                
            }
        }
        
        
    });
    
    
    
    
        
    return {LatticeView: latticeview};
});
    """
    return Javascript(s)
