var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var THREE = require('three');
//import * as THREE from 'three';
//import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
//import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
//import OrbitControls from 'three/examples/jsm/Controls/OrbitControls.js';
//THREE.OrbitControls = OrbitControls;


( function () {

	/**
 * Unpack RGBA depth shader
 * - show RGBA encoded depth as monochrome color
 */
	const UnpackDepthRGBAShader = {
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'opacity': {
				value: 1.0
			}
		},
		vertexShader:
  /* glsl */
  `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
		fragmentShader:
  /* glsl */
  `
		uniform float opacity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;
		#include <packing>
		void main() {
			float depth = 1.0 - unpackRGBAToDepth( texture2D( tDiffuse, vUv ) );
			gl_FragColor = vec4( vec3( depth ), opacity );
		}`
	};

	THREE.UnpackDepthRGBAShader = UnpackDepthRGBAShader;

} )();

( function () {

	/**
 * NVIDIA FXAA by Timothy Lottes
 * https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
 * - WebGL port by @supereggbert
 * http://www.glge.org/demos/fxaa/
 * Further improved by Daniel Sturk
 */

	const FXAAShader = {
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'resolution': {
				value: new THREE.Vector2( 1 / 1024, 1 / 512 )
			}
		},
		vertexShader:
  /* glsl */
  `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
		fragmentShader: `
	precision highp float;
	uniform sampler2D tDiffuse;
	uniform vec2 resolution;
	varying vec2 vUv;
	// FXAA 3.11 implementation by NVIDIA, ported to WebGL by Agost Biro (biro@archilogic.com)
	//----------------------------------------------------------------------------------
	// File:        es3-kepler\FXAA\assets\shaders/FXAA_DefaultES.frag
	// SDK Version: v3.00
	// Email:       gameworks@nvidia.com
	// Site:        http://developer.nvidia.com/
	//
	// Copyright (c) 2014-2015, NVIDIA CORPORATION. All rights reserved.
	//
	// Redistribution and use in source and binary forms, with or without
	// modification, are permitted provided that the following conditions
	// are met:
	//  * Redistributions of source code must retain the above copyright
	//    notice, this list of conditions and the following disclaimer.
	//  * Redistributions in binary form must reproduce the above copyright
	//    notice, this list of conditions and the following disclaimer in the
	//    documentation and/or other materials provided with the distribution.
	//  * Neither the name of NVIDIA CORPORATION nor the names of its
	//    contributors may be used to endorse or promote products derived
	//    from this software without specific prior written permission.
	//
	// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ''AS IS'' AND ANY
	// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
	// PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
	// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
	// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
	// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
	// PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
	// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	//
	//----------------------------------------------------------------------------------
	#ifndef FXAA_DISCARD
			//
			// Only valid for PC OpenGL currently.
			// Probably will not work when FXAA_GREEN_AS_LUMA = 1.
			//
			// 1 = Use discard on pixels which don't need AA.
			//     For APIs which enable concurrent TEX+ROP from same surface.
			// 0 = Return unchanged color on pixels which don't need AA.
			//
			#define FXAA_DISCARD 0
	#endif
	/*--------------------------------------------------------------------------*/
	#define FxaaTexTop(t, p) texture2D(t, p, -100.0)
	#define FxaaTexOff(t, p, o, r) texture2D(t, p + (o * r), -100.0)
	/*--------------------------------------------------------------------------*/
	#define NUM_SAMPLES 5
	// assumes colors have premultipliedAlpha, so that the calculated color contrast is scaled by alpha
	float contrast( vec4 a, vec4 b ) {
			vec4 diff = abs( a - b );
			return max( max( max( diff.r, diff.g ), diff.b ), diff.a );
	}
	/*============================================================================
									FXAA3 QUALITY - PC
	============================================================================*/
	/*--------------------------------------------------------------------------*/
	vec4 FxaaPixelShader(
			vec2 posM,
			sampler2D tex,
			vec2 fxaaQualityRcpFrame,
			float fxaaQualityEdgeThreshold,
			float fxaaQualityinvEdgeThreshold
	) {
			vec4 rgbaM = FxaaTexTop(tex, posM);
			vec4 rgbaS = FxaaTexOff(tex, posM, vec2( 0.0, 1.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaE = FxaaTexOff(tex, posM, vec2( 1.0, 0.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaN = FxaaTexOff(tex, posM, vec2( 0.0,-1.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaW = FxaaTexOff(tex, posM, vec2(-1.0, 0.0), fxaaQualityRcpFrame.xy);
			// . S .
			// W M E
			// . N .
			bool earlyExit = max( max( max(
					contrast( rgbaM, rgbaN ),
					contrast( rgbaM, rgbaS ) ),
					contrast( rgbaM, rgbaE ) ),
					contrast( rgbaM, rgbaW ) )
					< fxaaQualityEdgeThreshold;
			// . 0 .
			// 0 0 0
			// . 0 .
			#if (FXAA_DISCARD == 1)
					if(earlyExit) FxaaDiscard;
			#else
					if(earlyExit) return rgbaM;
			#endif
			float contrastN = contrast( rgbaM, rgbaN );
			float contrastS = contrast( rgbaM, rgbaS );
			float contrastE = contrast( rgbaM, rgbaE );
			float contrastW = contrast( rgbaM, rgbaW );
			float relativeVContrast = ( contrastN + contrastS ) - ( contrastE + contrastW );
			relativeVContrast *= fxaaQualityinvEdgeThreshold;
			bool horzSpan = relativeVContrast > 0.;
			// . 1 .
			// 0 0 0
			// . 1 .
			// 45 deg edge detection and corners of objects, aka V/H contrast is too similar
			if( abs( relativeVContrast ) < .3 ) {
					// locate the edge
					vec2 dirToEdge;
					dirToEdge.x = contrastE > contrastW ? 1. : -1.;
					dirToEdge.y = contrastS > contrastN ? 1. : -1.;
					// . 2 .      . 1 .
					// 1 0 2  ~=  0 0 1
					// . 1 .      . 0 .
					// tap 2 pixels and see which ones are "outside" the edge, to
					// determine if the edge is vertical or horizontal
					vec4 rgbaAlongH = FxaaTexOff(tex, posM, vec2( dirToEdge.x, -dirToEdge.y ), fxaaQualityRcpFrame.xy);
					float matchAlongH = contrast( rgbaM, rgbaAlongH );
					// . 1 .
					// 0 0 1
					// . 0 H
					vec4 rgbaAlongV = FxaaTexOff(tex, posM, vec2( -dirToEdge.x, dirToEdge.y ), fxaaQualityRcpFrame.xy);
					float matchAlongV = contrast( rgbaM, rgbaAlongV );
					// V 1 .
					// 0 0 1
					// . 0 .
					relativeVContrast = matchAlongV - matchAlongH;
					relativeVContrast *= fxaaQualityinvEdgeThreshold;
					if( abs( relativeVContrast ) < .3 ) { // 45 deg edge
							// 1 1 .
							// 0 0 1
							// . 0 1
							// do a simple blur
							return mix(
									rgbaM,
									(rgbaN + rgbaS + rgbaE + rgbaW) * .25,
									.4
							);
					}
					horzSpan = relativeVContrast > 0.;
			}
			if(!horzSpan) rgbaN = rgbaW;
			if(!horzSpan) rgbaS = rgbaE;
			// . 0 .      1
			// 1 0 1  ->  0
			// . 0 .      1
			bool pairN = contrast( rgbaM, rgbaN ) > contrast( rgbaM, rgbaS );
			if(!pairN) rgbaN = rgbaS;
			vec2 offNP;
			offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;
			offNP.y = ( horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;
			bool doneN = false;
			bool doneP = false;
			float nDist = 0.;
			float pDist = 0.;
			vec2 posN = posM;
			vec2 posP = posM;
			int iterationsUsed = 0;
			int iterationsUsedN = 0;
			int iterationsUsedP = 0;
			for( int i = 0; i < NUM_SAMPLES; i++ ) {
					iterationsUsed = i;
					float increment = float(i + 1);
					if(!doneN) {
							nDist += increment;
							posN = posM + offNP * nDist;
							vec4 rgbaEndN = FxaaTexTop(tex, posN.xy);
							doneN = contrast( rgbaEndN, rgbaM ) > contrast( rgbaEndN, rgbaN );
							iterationsUsedN = i;
					}
					if(!doneP) {
							pDist += increment;
							posP = posM - offNP * pDist;
							vec4 rgbaEndP = FxaaTexTop(tex, posP.xy);
							doneP = contrast( rgbaEndP, rgbaM ) > contrast( rgbaEndP, rgbaN );
							iterationsUsedP = i;
					}
					if(doneN || doneP) break;
			}
			if ( !doneP && !doneN ) return rgbaM; // failed to find end of edge
			float dist = min(
					doneN ? float( iterationsUsedN ) / float( NUM_SAMPLES - 1 ) : 1.,
					doneP ? float( iterationsUsedP ) / float( NUM_SAMPLES - 1 ) : 1.
			);
			// hacky way of reduces blurriness of mostly diagonal edges
			// but reduces AA quality
			dist = pow(dist, .5);
			dist = 1. - dist;
			return mix(
					rgbaM,
					rgbaN,
					dist * .5
			);
	}
	void main() {
			const float edgeDetectionQuality = .2;
			const float invEdgeDetectionQuality = 1. / edgeDetectionQuality;
			gl_FragColor = FxaaPixelShader(
					vUv,
					tDiffuse,
					resolution,
					edgeDetectionQuality, // [0,1] contrast needed, otherwise early discard
					invEdgeDetectionQuality
			);
	}
	`
	};

	THREE.FXAAShader = FXAAShader;

} )();

( function () {

	/**
 * TODO
 */

	const DepthLimitedBlurShader = {
		defines: {
			'KERNEL_RADIUS': 4,
			'DEPTH_PACKING': 1,
			'PERSPECTIVE_CAMERA': 1
		},
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'size': {
				value: new THREE.Vector2( 512, 512 )
			},
			'sampleUvOffsets': {
				value: [ new THREE.Vector2( 0, 0 ) ]
			},
			'sampleWeights': {
				value: [ 1.0 ]
			},
			'tDepth': {
				value: null
			},
			'cameraNear': {
				value: 10
			},
			'cameraFar': {
				value: 1000
			},
			'depthCutoff': {
				value: 10
			}
		},
		vertexShader:
  /* glsl */
  `
		#include <common>
		uniform vec2 size;
		varying vec2 vUv;
		varying vec2 vInvSize;
		void main() {
			vUv = uv;
			vInvSize = 1.0 / size;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
		fragmentShader:
  /* glsl */
  `
		#include <common>
		#include <packing>
		uniform sampler2D tDiffuse;
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform float depthCutoff;
		uniform vec2 sampleUvOffsets[ KERNEL_RADIUS + 1 ];
		uniform float sampleWeights[ KERNEL_RADIUS + 1 ];
		varying vec2 vUv;
		varying vec2 vInvSize;
		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}
		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
			#else
			return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
			#endif
		}
		void main() {
			float depth = getDepth( vUv );
			if( depth >= ( 1.0 - EPSILON ) ) {
				discard;
			}
			float centerViewZ = -getViewZ( depth );
			bool rBreak = false, lBreak = false;
			float weightSum = sampleWeights[0];
			vec4 diffuseSum = texture2D( tDiffuse, vUv ) * weightSum;
			for( int i = 1; i <= KERNEL_RADIUS; i ++ ) {
				float sampleWeight = sampleWeights[i];
				vec2 sampleUvOffset = sampleUvOffsets[i] * vInvSize;
				vec2 sampleUv = vUv + sampleUvOffset;
				float viewZ = -getViewZ( getDepth( sampleUv ) );
				if( abs( viewZ - centerViewZ ) > depthCutoff ) rBreak = true;
				if( ! rBreak ) {
					diffuseSum += texture2D( tDiffuse, sampleUv ) * sampleWeight;
					weightSum += sampleWeight;
				}
				sampleUv = vUv - sampleUvOffset;
				viewZ = -getViewZ( getDepth( sampleUv ) );
				if( abs( viewZ - centerViewZ ) > depthCutoff ) lBreak = true;
				if( ! lBreak ) {
					diffuseSum += texture2D( tDiffuse, sampleUv ) * sampleWeight;
					weightSum += sampleWeight;
				}
			}
			gl_FragColor = diffuseSum / weightSum;
		}`
	};
	const BlurShaderUtils = {
		createSampleWeights: function ( kernelRadius, stdDev ) {

			const weights = [];

			for ( let i = 0; i <= kernelRadius; i ++ ) {

				weights.push( gaussian( i, stdDev ) );

			}

			return weights;

		},
		createSampleOffsets: function ( kernelRadius, uvIncrement ) {

			const offsets = [];

			for ( let i = 0; i <= kernelRadius; i ++ ) {

				offsets.push( uvIncrement.clone().multiplyScalar( i ) );

			}

			return offsets;

		},
		configure: function ( material, kernelRadius, stdDev, uvIncrement ) {

			material.defines[ 'KERNEL_RADIUS' ] = kernelRadius;
			material.uniforms[ 'sampleUvOffsets' ].value = BlurShaderUtils.createSampleOffsets( kernelRadius, uvIncrement );
			material.uniforms[ 'sampleWeights' ].value = BlurShaderUtils.createSampleWeights( kernelRadius, stdDev );
			material.needsUpdate = true;

		}
	};

	function gaussian( x, stdDev ) {

		return Math.exp( - ( x * x ) / ( 2.0 * ( stdDev * stdDev ) ) ) / ( Math.sqrt( 2.0 * Math.PI ) * stdDev );

	}

	THREE.BlurShaderUtils = BlurShaderUtils;
	THREE.DepthLimitedBlurShader = DepthLimitedBlurShader;

} )();

( function () {

	/**
 * TODO
 */

	const SAOShader = {
		defines: {
			'NUM_SAMPLES': 7,
			'NUM_RINGS': 4,
			'NORMAL_TEXTURE': 0,
			'DIFFUSE_TEXTURE': 0,
			'DEPTH_PACKING': 1,
			'PERSPECTIVE_CAMERA': 1
		},
		uniforms: {
			'tDepth': {
				value: null
			},
			'tDiffuse': {
				value: null
			},
			'tNormal': {
				value: null
			},
			'size': {
				value: new THREE.Vector2( 512, 512 )
			},
			'cameraNear': {
				value: 1
			},
			'cameraFar': {
				value: 100
			},
			'cameraProjectionMatrix': {
				value: new THREE.Matrix4()
			},
			'cameraInverseProjectionMatrix': {
				value: new THREE.Matrix4()
			},
			'scale': {
				value: 1.0
			},
			'intensity': {
				value: 0.1
			},
			'bias': {
				value: 0.5
			},
			'minResolution': {
				value: 0.0
			},
			'kernelRadius': {
				value: 100.0
			},
			'randomSeed': {
				value: 0.0
			}
		},
		vertexShader:
  /* glsl */
  `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
		fragmentShader:
  /* glsl */
  `
		#include <common>
		varying vec2 vUv;
		#if DIFFUSE_TEXTURE == 1
		uniform sampler2D tDiffuse;
		#endif
		uniform sampler2D tDepth;
		#if NORMAL_TEXTURE == 1
		uniform sampler2D tNormal;
		#endif
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraInverseProjectionMatrix;
		uniform float scale;
		uniform float intensity;
		uniform float bias;
		uniform float kernelRadius;
		uniform float minResolution;
		uniform vec2 size;
		uniform float randomSeed;
		// RGBA depth
		#include <packing>
		vec4 getDefaultColor( const in vec2 screenPosition ) {
			#if DIFFUSE_TEXTURE == 1
			return texture2D( tDiffuse, vUv );
			#else
			return vec4( 1.0 );
			#endif
		}
		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}
		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
			#else
			return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
			#endif
		}
		vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
			float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
			vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
			clipPosition *= clipW; // unprojection.
			return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
		}
		vec3 getViewNormal( const in vec3 viewPosition, const in vec2 screenPosition ) {
			#if NORMAL_TEXTURE == 1
			return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
			#else
			return normalize( cross( dFdx( viewPosition ), dFdy( viewPosition ) ) );
			#endif
		}
		float scaleDividedByCameraFar;
		float minResolutionMultipliedByCameraFar;
		float getOcclusion( const in vec3 centerViewPosition, const in vec3 centerViewNormal, const in vec3 sampleViewPosition ) {
			vec3 viewDelta = sampleViewPosition - centerViewPosition;
			float viewDistance = length( viewDelta );
			float scaledScreenDistance = scaleDividedByCameraFar * viewDistance;
			return max(0.0, (dot(centerViewNormal, viewDelta) - minResolutionMultipliedByCameraFar) / scaledScreenDistance - bias) / (1.0 + pow2( scaledScreenDistance ) );
		}
		// moving costly divides into consts
		const float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
		const float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );
		float getAmbientOcclusion( const in vec3 centerViewPosition ) {
			// precompute some variables require in getOcclusion.
			scaleDividedByCameraFar = scale / cameraFar;
			minResolutionMultipliedByCameraFar = minResolution * cameraFar;
			vec3 centerViewNormal = getViewNormal( centerViewPosition, vUv );
			// jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
			float angle = rand( vUv + randomSeed ) * PI2;
			vec2 radius = vec2( kernelRadius * INV_NUM_SAMPLES ) / size;
			vec2 radiusStep = radius;
			float occlusionSum = 0.0;
			float weightSum = 0.0;
			for( int i = 0; i < NUM_SAMPLES; i ++ ) {
				vec2 sampleUv = vUv + vec2( cos( angle ), sin( angle ) ) * radius;
				radius += radiusStep;
				angle += ANGLE_STEP;
				float sampleDepth = getDepth( sampleUv );
				if( sampleDepth >= ( 1.0 - EPSILON ) ) {
					continue;
				}
				float sampleViewZ = getViewZ( sampleDepth );
				vec3 sampleViewPosition = getViewPosition( sampleUv, sampleDepth, sampleViewZ );
				occlusionSum += getOcclusion( centerViewPosition, centerViewNormal, sampleViewPosition );
				weightSum += 1.0;
			}
			if( weightSum == 0.0 ) discard;
			return occlusionSum * ( intensity / weightSum );
		}
		void main() {
			float centerDepth = getDepth( vUv );
			if( centerDepth >= ( 1.0 - EPSILON ) ) {
				discard;
			}
			float centerViewZ = getViewZ( centerDepth );
			vec3 viewPosition = getViewPosition( vUv, centerDepth, centerViewZ );
			float ambientOcclusion = getAmbientOcclusion( viewPosition );
			gl_FragColor = getDefaultColor( vUv );
			gl_FragColor.xyz *=  1.0 - ambientOcclusion;
		}`
	};

	THREE.SAOShader = SAOShader;

} )();

( function () {

	class Pass {

		constructor() {

			// if set to true, the pass is processed by the composer
			this.enabled = true; // if set to true, the pass indicates to swap read and write buffer after rendering

			this.needsSwap = true; // if set to true, the pass clears its buffer before rendering

			this.clear = false; // if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.

			this.renderToScreen = false;

		}

		setSize() {}

		render() {

			console.error( 'THREE.Pass: .render() must be implemented in derived pass.' );

		}

	} // Helper for passes that need to fill the viewport with a single quad.


	const _camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 ); // https://github.com/mrdoob/three.js/pull/21358


	const _geometry = new THREE.BufferGeometry();

	_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );

	_geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );

	class FullScreenQuad {

		constructor( material ) {

			this._mesh = new THREE.Mesh( _geometry, material );

		}

		dispose() {

			this._mesh.geometry.dispose();

		}

		render( renderer ) {

			renderer.render( this._mesh, _camera );

		}

		get material() {

			return this._mesh.material;

		}

		set material( value ) {

			this._mesh.material = value;

		}

	}

	THREE.FullScreenQuad = FullScreenQuad;
	THREE.Pass = Pass;

} )();

( function () {

	/**
 * SAO implementation inspired from bhouston previous SAO work
 */

	class SAOPass extends THREE.Pass {

		constructor( scene, camera, useDepthTexture = false, useNormals = false, resolution = new THREE.Vector2( 256, 256 ) ) {

			super();
			this.scene = scene;
			this.camera = camera;
			this.clear = true;
			this.needsSwap = false;
			this.supportsDepthTextureExtension = useDepthTexture;
			this.supportsNormalTexture = useNormals;
			this.originalClearColor = new THREE.Color();
			this._oldClearColor = new THREE.Color();
			this.oldClearAlpha = 1;
			this.params = {
				output: 0,
				saoBias: 0.5,
				saoIntensity: 0.18,
				saoScale: 1,
				saoKernelRadius: 100,
				saoMinResolution: 0,
				saoBlur: true,
				saoBlurRadius: 8,
				saoBlurStdDev: 4,
				saoBlurDepthCutoff: 0.01
			};
			this.resolution = new THREE.Vector2( resolution.x, resolution.y );
			this.saoRenderTarget = new THREE.WebGLRenderTarget( this.resolution.x, this.resolution.y );
			this.blurIntermediateRenderTarget = this.saoRenderTarget.clone();
			this.beautyRenderTarget = this.saoRenderTarget.clone();
			this.normalRenderTarget = new THREE.WebGLRenderTarget( this.resolution.x, this.resolution.y, {
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter
			} );
			this.depthRenderTarget = this.normalRenderTarget.clone();
			let depthTexture;

			if ( this.supportsDepthTextureExtension ) {

				depthTexture = new THREE.DepthTexture();
				depthTexture.type = THREE.UnsignedShortType;
				this.beautyRenderTarget.depthTexture = depthTexture;
				this.beautyRenderTarget.depthBuffer = true;

			}

			this.depthMaterial = new THREE.MeshDepthMaterial();
			this.depthMaterial.depthPacking = THREE.RGBADepthPacking;
			this.depthMaterial.blending = THREE.NoBlending;
			this.normalMaterial = new THREE.MeshNormalMaterial();
			this.normalMaterial.blending = THREE.NoBlending;

			if ( THREE.SAOShader === undefined ) {

				console.error( 'THREE.SAOPass relies on THREE.SAOShader' );

			}

			this.saoMaterial = new THREE.ShaderMaterial( {
				defines: Object.assign( {}, THREE.SAOShader.defines ),
				fragmentShader: THREE.SAOShader.fragmentShader,
				vertexShader: THREE.SAOShader.vertexShader,
				uniforms: THREE.UniformsUtils.clone( THREE.SAOShader.uniforms )
			} );
			this.saoMaterial.extensions.derivatives = true;
			this.saoMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
			this.saoMaterial.defines[ 'NORMAL_TEXTURE' ] = this.supportsNormalTexture ? 1 : 0;
			this.saoMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
			this.saoMaterial.uniforms[ 'tDepth' ].value = this.supportsDepthTextureExtension ? depthTexture : this.depthRenderTarget.texture;
			this.saoMaterial.uniforms[ 'tNormal' ].value = this.normalRenderTarget.texture;
			this.saoMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
			this.saoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.copy( this.camera.projectionMatrixInverse );
			this.saoMaterial.uniforms[ 'cameraProjectionMatrix' ].value = this.camera.projectionMatrix;
			this.saoMaterial.blending = THREE.NoBlending;

			if ( THREE.DepthLimitedBlurShader === undefined ) {

				console.error( 'THREE.SAOPass relies on THREE.DepthLimitedBlurShader' );

			}

			this.vBlurMaterial = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( THREE.DepthLimitedBlurShader.uniforms ),
				defines: Object.assign( {}, THREE.DepthLimitedBlurShader.defines ),
				vertexShader: THREE.DepthLimitedBlurShader.vertexShader,
				fragmentShader: THREE.DepthLimitedBlurShader.fragmentShader
			} );
			this.vBlurMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
			this.vBlurMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
			this.vBlurMaterial.uniforms[ 'tDiffuse' ].value = this.saoRenderTarget.texture;
			this.vBlurMaterial.uniforms[ 'tDepth' ].value = this.supportsDepthTextureExtension ? depthTexture : this.depthRenderTarget.texture;
			this.vBlurMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
			this.vBlurMaterial.blending = THREE.NoBlending;
			this.hBlurMaterial = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( THREE.DepthLimitedBlurShader.uniforms ),
				defines: Object.assign( {}, THREE.DepthLimitedBlurShader.defines ),
				vertexShader: THREE.DepthLimitedBlurShader.vertexShader,
				fragmentShader: THREE.DepthLimitedBlurShader.fragmentShader
			} );
			this.hBlurMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
			this.hBlurMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
			this.hBlurMaterial.uniforms[ 'tDiffuse' ].value = this.blurIntermediateRenderTarget.texture;
			this.hBlurMaterial.uniforms[ 'tDepth' ].value = this.supportsDepthTextureExtension ? depthTexture : this.depthRenderTarget.texture;
			this.hBlurMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
			this.hBlurMaterial.blending = THREE.NoBlending;

			if ( THREE.CopyShader === undefined ) {

				console.error( 'THREE.SAOPass relies on THREE.CopyShader' );

			}

			this.materialCopy = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( THREE.CopyShader.uniforms ),
				vertexShader: THREE.CopyShader.vertexShader,
				fragmentShader: THREE.CopyShader.fragmentShader,
				blending: THREE.NoBlending
			} );
			this.materialCopy.transparent = true;
			this.materialCopy.depthTest = false;
			this.materialCopy.depthWrite = false;
			this.materialCopy.blending = THREE.CustomBlending;
			this.materialCopy.blendSrc = THREE.DstColorFactor;
			this.materialCopy.blendDst = THREE.ZeroFactor;
			this.materialCopy.blendEquation = THREE.AddEquation;
			this.materialCopy.blendSrcAlpha = THREE.DstAlphaFactor;
			this.materialCopy.blendDstAlpha = THREE.ZeroFactor;
			this.materialCopy.blendEquationAlpha = THREE.AddEquation;

			if ( THREE.UnpackDepthRGBAShader === undefined ) {

				console.error( 'THREE.SAOPass relies on THREE.UnpackDepthRGBAShader' );

			}

			this.depthCopy = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( THREE.UnpackDepthRGBAShader.uniforms ),
				vertexShader: THREE.UnpackDepthRGBAShader.vertexShader,
				fragmentShader: THREE.UnpackDepthRGBAShader.fragmentShader,
				blending: THREE.NoBlending
			} );
			this.fsQuad = new THREE.FullScreenQuad( null );

		}

		render( renderer, writeBuffer, readBuffer
			/*, deltaTime, maskActive*/
		) {

			// Rendering readBuffer first when rendering to screen
			if ( this.renderToScreen ) {

				this.materialCopy.blending = THREE.NoBlending;
				this.materialCopy.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
				this.materialCopy.needsUpdate = true;
				this.renderPass( renderer, this.materialCopy, null );

			}

			if ( this.params.output === 1 ) {

				return;

			}

			renderer.getClearColor( this._oldClearColor );
			this.oldClearAlpha = renderer.getClearAlpha();
			const oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;
			renderer.setRenderTarget( this.depthRenderTarget );
			renderer.clear();
			this.saoMaterial.uniforms[ 'bias' ].value = this.params.saoBias;
			this.saoMaterial.uniforms[ 'intensity' ].value = this.params.saoIntensity;
			this.saoMaterial.uniforms[ 'scale' ].value = this.params.saoScale;
			this.saoMaterial.uniforms[ 'kernelRadius' ].value = this.params.saoKernelRadius;
			this.saoMaterial.uniforms[ 'minResolution' ].value = this.params.saoMinResolution;
			this.saoMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
			this.saoMaterial.uniforms[ 'cameraFar' ].value = this.camera.far; // this.saoMaterial.uniforms['randomSeed'].value = Math.random();

			const depthCutoff = this.params.saoBlurDepthCutoff * ( this.camera.far - this.camera.near );
			this.vBlurMaterial.uniforms[ 'depthCutoff' ].value = depthCutoff;
			this.hBlurMaterial.uniforms[ 'depthCutoff' ].value = depthCutoff;
			this.vBlurMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
			this.vBlurMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
			this.hBlurMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
			this.hBlurMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
			this.params.saoBlurRadius = Math.floor( this.params.saoBlurRadius );

			if ( this.prevStdDev !== this.params.saoBlurStdDev || this.prevNumSamples !== this.params.saoBlurRadius ) {

				THREE.BlurShaderUtils.configure( this.vBlurMaterial, this.params.saoBlurRadius, this.params.saoBlurStdDev, new THREE.Vector2( 0, 1 ) );
				THREE.BlurShaderUtils.configure( this.hBlurMaterial, this.params.saoBlurRadius, this.params.saoBlurStdDev, new THREE.Vector2( 1, 0 ) );
				this.prevStdDev = this.params.saoBlurStdDev;
				this.prevNumSamples = this.params.saoBlurRadius;

			} // Rendering scene to depth texture


			renderer.setClearColor( 0x000000 );
			renderer.setRenderTarget( this.beautyRenderTarget );
			renderer.clear();
			renderer.render( this.scene, this.camera ); // Re-render scene if depth texture extension is not supported

			if ( ! this.supportsDepthTextureExtension ) {

				// Clear rule : far clipping plane in both RGBA and Basic encoding
				this.renderOverride( renderer, this.depthMaterial, this.depthRenderTarget, 0x000000, 1.0 );

			}

			if ( this.supportsNormalTexture ) {

				// Clear rule : default normal is facing the camera
				this.renderOverride( renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0 );

			} // Rendering SAO texture


			this.renderPass( renderer, this.saoMaterial, this.saoRenderTarget, 0xffffff, 1.0 ); // Blurring SAO texture

			if ( this.params.saoBlur ) {

				this.renderPass( renderer, this.vBlurMaterial, this.blurIntermediateRenderTarget, 0xffffff, 1.0 );
				this.renderPass( renderer, this.hBlurMaterial, this.saoRenderTarget, 0xffffff, 1.0 );

			}

			let outputMaterial = this.materialCopy; // Setting up SAO rendering

			if ( this.params.output === 3 ) {

				if ( this.supportsDepthTextureExtension ) {

					this.materialCopy.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.depthTexture;
					this.materialCopy.needsUpdate = true;

				} else {

					this.depthCopy.uniforms[ 'tDiffuse' ].value = this.depthRenderTarget.texture;
					this.depthCopy.needsUpdate = true;
					outputMaterial = this.depthCopy;

				}

			} else if ( this.params.output === 4 ) {

				this.materialCopy.uniforms[ 'tDiffuse' ].value = this.normalRenderTarget.texture;
				this.materialCopy.needsUpdate = true;

			} else {

				this.materialCopy.uniforms[ 'tDiffuse' ].value = this.saoRenderTarget.texture;
				this.materialCopy.needsUpdate = true;

			} // Blending depends on output, only want a THREE.CustomBlending when showing SAO


			if ( this.params.output === 0 ) {

				outputMaterial.blending = THREE.CustomBlending;

			} else {

				outputMaterial.blending = THREE.NoBlending;

			} // Rendering SAOPass result on top of previous pass


			this.renderPass( renderer, outputMaterial, this.renderToScreen ? null : readBuffer );
			renderer.setClearColor( this._oldClearColor, this.oldClearAlpha );
			renderer.autoClear = oldAutoClear;

		}

		renderPass( renderer, passMaterial, renderTarget, clearColor, clearAlpha ) {

			// save original state
			renderer.getClearColor( this.originalClearColor );
			const originalClearAlpha = renderer.getClearAlpha();
			const originalAutoClear = renderer.autoClear;
			renderer.setRenderTarget( renderTarget ); // setup pass state

			renderer.autoClear = false;

			if ( clearColor !== undefined && clearColor !== null ) {

				renderer.setClearColor( clearColor );
				renderer.setClearAlpha( clearAlpha || 0.0 );
				renderer.clear();

			}

			this.fsQuad.material = passMaterial;
			this.fsQuad.render( renderer ); // restore original state

			renderer.autoClear = originalAutoClear;
			renderer.setClearColor( this.originalClearColor );
			renderer.setClearAlpha( originalClearAlpha );

		}

		renderOverride( renderer, overrideMaterial, renderTarget, clearColor, clearAlpha ) {

			renderer.getClearColor( this.originalClearColor );
			const originalClearAlpha = renderer.getClearAlpha();
			const originalAutoClear = renderer.autoClear;
			renderer.setRenderTarget( renderTarget );
			renderer.autoClear = false;
			clearColor = overrideMaterial.clearColor || clearColor;
			clearAlpha = overrideMaterial.clearAlpha || clearAlpha;

			if ( clearColor !== undefined && clearColor !== null ) {

				renderer.setClearColor( clearColor );
				renderer.setClearAlpha( clearAlpha || 0.0 );
				renderer.clear();

			}

			this.scene.overrideMaterial = overrideMaterial;
			renderer.render( this.scene, this.camera );
			this.scene.overrideMaterial = null; // restore original state

			renderer.autoClear = originalAutoClear;
			renderer.setClearColor( this.originalClearColor );
			renderer.setClearAlpha( originalClearAlpha );

		}

		setSize( width, height ) {

			this.beautyRenderTarget.setSize( width, height );
			this.saoRenderTarget.setSize( width, height );
			this.blurIntermediateRenderTarget.setSize( width, height );
			this.normalRenderTarget.setSize( width, height );
			this.depthRenderTarget.setSize( width, height );
			this.saoMaterial.uniforms[ 'size' ].value.set( width, height );
			this.saoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.copy( this.camera.projectionMatrixInverse );
			this.saoMaterial.uniforms[ 'cameraProjectionMatrix' ].value = this.camera.projectionMatrix;
			this.saoMaterial.needsUpdate = true;
			this.vBlurMaterial.uniforms[ 'size' ].value.set( width, height );
			this.vBlurMaterial.needsUpdate = true;
			this.hBlurMaterial.uniforms[ 'size' ].value.set( width, height );
			this.hBlurMaterial.needsUpdate = true;

		}

	}

	SAOPass.OUTPUT = {
		'Beauty': 1,
		'Default': 0,
		'SAO': 2,
		'Depth': 3,
		'Normal': 4
	};

	THREE.SAOPass = SAOPass;

} )();

( function () {

	class ShaderPass extends THREE.Pass {

		constructor( shader, textureID ) {

			super();
			this.textureID = textureID !== undefined ? textureID : 'tDiffuse';

			if ( shader instanceof THREE.ShaderMaterial ) {

				this.uniforms = shader.uniforms;
				this.material = shader;

			} else if ( shader ) {

				this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );
				this.material = new THREE.ShaderMaterial( {
					defines: Object.assign( {}, shader.defines ),
					uniforms: this.uniforms,
					vertexShader: shader.vertexShader,
					fragmentShader: shader.fragmentShader
				} );

			}

			this.fsQuad = new THREE.FullScreenQuad( this.material );

		}

		render( renderer, writeBuffer, readBuffer
			/*, deltaTime, maskActive */
		) {

			if ( this.uniforms[ this.textureID ] ) {

				this.uniforms[ this.textureID ].value = readBuffer.texture;

			}

			this.fsQuad.material = this.material;

			if ( this.renderToScreen ) {

				renderer.setRenderTarget( null );
				this.fsQuad.render( renderer );

			} else {

				renderer.setRenderTarget( writeBuffer ); // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600

				if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
				this.fsQuad.render( renderer );

			}

		}

	}

	THREE.ShaderPass = ShaderPass;

} )();

//adding functionality here
( function () {

	/**
 * Full-screen textured quad shader
 */
	const CopyShader = {
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'opacity': {
				value: 1.0
			}
		},
		vertexShader:
  /* glsl */
  `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
		fragmentShader:
  /* glsl */
  `
		uniform float opacity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;
		void main() {
			gl_FragColor = texture2D( tDiffuse, vUv );
			gl_FragColor.a *= opacity;
		}`
	};

	THREE.CopyShader = CopyShader;

} )();

( function () {

	/**
 * Depth-of-field shader with bokeh
 * ported from GLSL shader by Martins Upitis
 * http://artmartinsh.blogspot.com/2010/02/glsl-lens-blur-filter-with-bokeh.html
 */
	const BokehShader = {
		defines: {
			'DEPTH_PACKING': 1,
			'PERSPECTIVE_CAMERA': 1
		},
		uniforms: {
			'tColor': {
				value: null
			},
			'tDepth': {
				value: null
			},
			'focus': {
				value: 1.0
			},
			'aspect': {
				value: 1.0
			},
			'aperture': {
				value: 0.025
			},
			'maxblur': {
				value: 0.01
			},
			'nearClip': {
				value: 1.0
			},
			'farClip': {
				value: 1000.0
			}
		},
		vertexShader:
  /* glsl */
  `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
		fragmentShader:
  /* glsl */
  `
		#include <common>
		varying vec2 vUv;
		uniform sampler2D tColor;
		uniform sampler2D tDepth;
		uniform float maxblur; // max blur amount
		uniform float aperture; // aperture - bigger values for shallower depth of field
		uniform float nearClip;
		uniform float farClip;
		uniform float focus;
		uniform float aspect;
		#include <packing>
		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}
		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, nearClip, farClip );
			#else
			return orthographicDepthToViewZ( depth, nearClip, farClip );
			#endif
		}
		void main() {
			vec2 aspectcorrect = vec2( 1.0, aspect );
			float viewZ = getViewZ( getDepth( vUv ) );
			float factor = ( focus + viewZ ); // viewZ is <= 0, so this is a difference equation
			vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );
			vec2 dofblur9 = dofblur * 0.9;
			vec2 dofblur7 = dofblur * 0.7;
			vec2 dofblur4 = dofblur * 0.4;
			vec4 col = vec4( 0.0 );
			col += texture2D( tColor, vUv.xy );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur4 );
			gl_FragColor = col / 41.0;
			gl_FragColor.a = 1.0;
		}`
	};

	THREE.BokehShader = BokehShader;

} )();


( function () {

	class EffectComposer {

		constructor( renderer, renderTarget ) {

			this.renderer = renderer;

			if ( renderTarget === undefined ) {

				const size = renderer.getSize( new THREE.Vector2() );
				this._pixelRatio = renderer.getPixelRatio();
				this._width = size.width;
				this._height = size.height;
				renderTarget = new THREE.WebGLRenderTarget( this._width * this._pixelRatio, this._height * this._pixelRatio );
				renderTarget.texture.name = 'EffectComposer.rt1';

			} else {

				this._pixelRatio = 1;
				this._width = renderTarget.width;
				this._height = renderTarget.height;

			}

			this.renderTarget1 = renderTarget;
			this.renderTarget2 = renderTarget.clone();
			this.renderTarget2.texture.name = 'EffectComposer.rt2';
			this.writeBuffer = this.renderTarget1;
			this.readBuffer = this.renderTarget2;
			this.renderToScreen = true;
			this.passes = []; // dependencies

			if ( THREE.CopyShader === undefined ) {

				console.error( 'THREE.EffectComposer relies on THREE.CopyShader' );

			}

			if ( THREE.ShaderPass === undefined ) {

				console.error( 'THREE.EffectComposer relies on THREE.ShaderPass' );

			}

			this.copyPass = new THREE.ShaderPass( THREE.CopyShader );
			this.clock = new THREE.Clock();

		}

		swapBuffers() {

			const tmp = this.readBuffer;
			this.readBuffer = this.writeBuffer;
			this.writeBuffer = tmp;

		}

		addPass( pass ) {

			this.passes.push( pass );
			pass.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

		}

		insertPass( pass, index ) {

			this.passes.splice( index, 0, pass );
			pass.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

		}

		removePass( pass ) {

			const index = this.passes.indexOf( pass );

			if ( index !== - 1 ) {

				this.passes.splice( index, 1 );

			}

		}

		isLastEnabledPass( passIndex ) {

			for ( let i = passIndex + 1; i < this.passes.length; i ++ ) {

				if ( this.passes[ i ].enabled ) {

					return false;

				}

			}

			return true;

		}

		render( deltaTime ) {

			// deltaTime value is in seconds
			if ( deltaTime === undefined ) {

				deltaTime = this.clock.getDelta();

			}

			const currentRenderTarget = this.renderer.getRenderTarget();
			let maskActive = false;

			for ( let i = 0, il = this.passes.length; i < il; i ++ ) {

				const pass = this.passes[ i ];
				if ( pass.enabled === false ) continue;
				pass.renderToScreen = this.renderToScreen && this.isLastEnabledPass( i );
				pass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive );

				if ( pass.needsSwap ) {

					if ( maskActive ) {

						const context = this.renderer.getContext();
						const stencil = this.renderer.state.buffers.stencil; //context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

						stencil.setFunc( context.NOTEQUAL, 1, 0xffffffff );
						this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime ); //context.stencilFunc( context.EQUAL, 1, 0xffffffff );

						stencil.setFunc( context.EQUAL, 1, 0xffffffff );

					}

					this.swapBuffers();

				}

				if ( THREE.MaskPass !== undefined ) {

					if ( pass instanceof THREE.MaskPass ) {

						maskActive = true;

					} else if ( pass instanceof THREE.ClearMaskPass ) {

						maskActive = false;

					}

				}

			}

			this.renderer.setRenderTarget( currentRenderTarget );

		}

		reset( renderTarget ) {

			if ( renderTarget === undefined ) {

				const size = this.renderer.getSize( new THREE.Vector2() );
				this._pixelRatio = this.renderer.getPixelRatio();
				this._width = size.width;
				this._height = size.height;
				renderTarget = this.renderTarget1.clone();
				renderTarget.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

			}

			this.renderTarget1.dispose();
			this.renderTarget2.dispose();
			this.renderTarget1 = renderTarget;
			this.renderTarget2 = renderTarget.clone();
			this.writeBuffer = this.renderTarget1;
			this.readBuffer = this.renderTarget2;

		}

		setSize( width, height ) {

			this._width = width;
			this._height = height;
			const effectiveWidth = this._width * this._pixelRatio;
			const effectiveHeight = this._height * this._pixelRatio;
			this.renderTarget1.setSize( effectiveWidth, effectiveHeight );
			this.renderTarget2.setSize( effectiveWidth, effectiveHeight );

			for ( let i = 0; i < this.passes.length; i ++ ) {

				this.passes[ i ].setSize( effectiveWidth, effectiveHeight );

			}

		}

		setPixelRatio( pixelRatio ) {

			this._pixelRatio = pixelRatio;
			this.setSize( this._width, this._height );

		}

	}

	class Pass {

		constructor() {

			// if set to true, the pass is processed by the composer
			this.enabled = true; // if set to true, the pass indicates to swap read and write buffer after rendering

			this.needsSwap = true; // if set to true, the pass clears its buffer before rendering

			this.clear = false; // if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.

			this.renderToScreen = false;

		}

		setSize() {}

		render() {

			console.error( 'THREE.Pass: .render() must be implemented in derived pass.' );

		}

	} // Helper for passes that need to fill the viewport with a single quad.


	const _camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 ); // https://github.com/mrdoob/three.js/pull/21358


	const _geometry = new THREE.BufferGeometry();

	_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );

	_geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );

	class FullScreenQuad {

		constructor( material ) {

			this._mesh = new THREE.Mesh( _geometry, material );

		}

		dispose() {

			this._mesh.geometry.dispose();

		}

		render( renderer ) {

			renderer.render( this._mesh, _camera );

		}

		get material() {

			return this._mesh.material;

		}

		set material( value ) {

			this._mesh.material = value;

		}

	}

	THREE.EffectComposer = EffectComposer;
	THREE.FullScreenQuad = FullScreenQuad;
	THREE.Pass = Pass;

} )();

( function () {

	class RenderPass extends THREE.Pass {

		constructor( scene, camera, overrideMaterial, clearColor, clearAlpha ) {

			super();
			this.scene = scene;
			this.camera = camera;
			this.overrideMaterial = overrideMaterial;
			this.clearColor = clearColor;
			this.clearAlpha = clearAlpha !== undefined ? clearAlpha : 0;
			this.clear = true;
			this.clearDepth = false;
			this.needsSwap = false;
			this._oldClearColor = new THREE.Color();

		}

		render( renderer, writeBuffer, readBuffer
			/*, deltaTime, maskActive */
		) {

			const oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;
			let oldClearAlpha, oldOverrideMaterial;

			if ( this.overrideMaterial !== undefined ) {

				oldOverrideMaterial = this.scene.overrideMaterial;
				this.scene.overrideMaterial = this.overrideMaterial;

			}

			if ( this.clearColor ) {

				renderer.getClearColor( this._oldClearColor );
				oldClearAlpha = renderer.getClearAlpha();
				renderer.setClearColor( this.clearColor, this.clearAlpha );

			}

			if ( this.clearDepth ) {

				renderer.clearDepth();

			}

			renderer.setRenderTarget( this.renderToScreen ? null : readBuffer ); // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600

			if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
			renderer.render( this.scene, this.camera );

			if ( this.clearColor ) {

				renderer.setClearColor( this._oldClearColor, oldClearAlpha );

			}

			if ( this.overrideMaterial !== undefined ) {

				this.scene.overrideMaterial = oldOverrideMaterial;

			}

			renderer.autoClear = oldAutoClear;

		}

	}

	THREE.RenderPass = RenderPass;

} )();

( function () {

	/**
 * Depth-of-field post-process with bokeh shader
 */

	class BokehPass extends THREE.Pass {

		constructor( scene, camera, params ) {

			super();
			this.scene = scene;
			this.camera = camera;
			const focus = params.focus !== undefined ? params.focus : 1.0;
			const aspect = params.aspect !== undefined ? params.aspect : camera.aspect;
			const aperture = params.aperture !== undefined ? params.aperture : 0.025;
			const maxblur = params.maxblur !== undefined ? params.maxblur : 1.0; // render targets

			const width = params.width || window.innerWidth || 1;
			const height = params.height || window.innerHeight || 1;
			this.renderTargetDepth = new THREE.WebGLRenderTarget( width, height, {
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter
			} );
			this.renderTargetDepth.texture.name = 'BokehPass.depth'; // depth material

			this.materialDepth = new THREE.MeshDepthMaterial();
			this.materialDepth.depthPacking = THREE.RGBADepthPacking;
			this.materialDepth.blending = THREE.NoBlending; // bokeh material

			if ( THREE.BokehShader === undefined ) {

				console.error( 'THREE.BokehPass relies on THREE.BokehShader' );

			}

			const bokehShader = THREE.BokehShader;
			const bokehUniforms = THREE.UniformsUtils.clone( bokehShader.uniforms );
			bokehUniforms[ 'tDepth' ].value = this.renderTargetDepth.texture;
			bokehUniforms[ 'focus' ].value = focus;
			bokehUniforms[ 'aspect' ].value = aspect;
			bokehUniforms[ 'aperture' ].value = aperture;
			bokehUniforms[ 'maxblur' ].value = maxblur;
			bokehUniforms[ 'nearClip' ].value = camera.near;
			bokehUniforms[ 'farClip' ].value = camera.far;
			this.materialBokeh = new THREE.ShaderMaterial( {
				defines: Object.assign( {}, bokehShader.defines ),
				uniforms: bokehUniforms,
				vertexShader: bokehShader.vertexShader,
				fragmentShader: bokehShader.fragmentShader
			} );
			this.uniforms = bokehUniforms;
			this.needsSwap = false;
			this.fsQuad = new THREE.FullScreenQuad( this.materialBokeh );
			this._oldClearColor = new THREE.Color();

		}

		render( renderer, writeBuffer, readBuffer
			/*, deltaTime, maskActive*/
		) {

			// Render depth into texture
			this.scene.overrideMaterial = this.materialDepth;
			renderer.getClearColor( this._oldClearColor );
			const oldClearAlpha = renderer.getClearAlpha();
			const oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;
			renderer.setClearColor( 0xffffff );
			renderer.setClearAlpha( 1.0 );
			renderer.setRenderTarget( this.renderTargetDepth );
			renderer.clear();
			renderer.render( this.scene, this.camera ); // Render bokeh composite

			this.uniforms[ 'tColor' ].value = readBuffer.texture;
			this.uniforms[ 'nearClip' ].value = this.camera.near;
			this.uniforms[ 'farClip' ].value = this.camera.far;

			if ( this.renderToScreen ) {

				renderer.setRenderTarget( null );
				this.fsQuad.render( renderer );

			} else {

				renderer.setRenderTarget( writeBuffer );
				renderer.clear();
				this.fsQuad.render( renderer );

			}

			this.scene.overrideMaterial = null;
			renderer.setClearColor( this._oldClearColor );
			renderer.setClearAlpha( oldClearAlpha );
			renderer.autoClear = oldAutoClear;

		}

	}

	THREE.BokehPass = BokehPass;

} )();


( function () {

	// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
	//
	//    Orbit - left mouse / touch: one-finger move
	//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
	//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

	const _changeEvent = {
		type: 'change'
	};
	const _startEvent = {
		type: 'start'
	};
	const _endEvent = {
		type: 'end'
	};

	class OrbitControls extends THREE.EventDispatcher {

		constructor( object, domElement ) {

			super();
			if ( domElement === undefined ) console.warn( 'THREE.OrbitControls: The second parameter "domElement" is now mandatory.' );
			if ( domElement === document ) console.error( 'THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' );
			this.object = object;
			this.domElement = domElement;
			this.domElement.style.touchAction = 'none'; // disable touch scroll
			// Set to false to disable this control

			this.enabled = true; // "target" sets the location of focus, where the object orbits around

			this.target = new THREE.Vector3(); // How far you can dolly in and out ( PerspectiveCamera only )

			this.minDistance = 0;
			this.maxDistance = Infinity; // How far you can zoom in and out ( OrthographicCamera only )

			this.minZoom = 0;
			this.maxZoom = Infinity; // How far you can orbit vertically, upper and lower limits.
			// Range is 0 to Math.PI radians.

			this.minPolarAngle = 0; // radians

			this.maxPolarAngle = Math.PI; // radians
			// How far you can orbit horizontally, upper and lower limits.
			// If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )

			this.minAzimuthAngle = - Infinity; // radians

			this.maxAzimuthAngle = Infinity; // radians
			// Set to true to enable damping (inertia)
			// If damping is enabled, you must call controls.update() in your animation loop

			this.enableDamping = false;
			this.dampingFactor = 0.05; // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
			// Set to false to disable zooming

			this.enableZoom = true;
			this.zoomSpeed = 1.0; // Set to false to disable rotating

			this.enableRotate = true;
			this.rotateSpeed = 1.0; // Set to false to disable panning

			this.enablePan = true;
			this.panSpeed = 1.0;
			this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up

			this.keyPanSpeed = 7.0; // pixels moved per arrow key push
			// Set to true to automatically rotate around the target
			// If auto-rotate is enabled, you must call controls.update() in your animation loop

			this.autoRotate = false;
			this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60
			// The four arrow keys

			this.keys = {
				LEFT: 'ArrowLeft',
				UP: 'ArrowUp',
				RIGHT: 'ArrowRight',
				BOTTOM: 'ArrowDown'
			}; // Mouse buttons

			this.mouseButtons = {
				LEFT: THREE.MOUSE.ROTATE,
				MIDDLE: THREE.MOUSE.DOLLY,
				RIGHT: THREE.MOUSE.PAN
			}; // Touch fingers

			this.touches = {
				ONE: THREE.TOUCH.ROTATE,
				TWO: THREE.TOUCH.DOLLY_PAN
			}; // for reset

			this.target0 = this.target.clone();
			this.position0 = this.object.position.clone();
			this.zoom0 = this.object.zoom; // the target DOM element for key events

			this._domElementKeyEvents = null; //
			// public methods
			//

			this.getPolarAngle = function () {

				return spherical.phi;

			};

			this.getAzimuthalAngle = function () {

				return spherical.theta;

			};

			this.getDistance = function () {

				return this.object.position.distanceTo( this.target );

			};

			this.listenToKeyEvents = function ( domElement ) {

				domElement.addEventListener( 'keydown', onKeyDown );
				this._domElementKeyEvents = domElement;

			};

			this.saveState = function () {

				scope.target0.copy( scope.target );
				scope.position0.copy( scope.object.position );
				scope.zoom0 = scope.object.zoom;

			};

			this.reset = function () {

				scope.target.copy( scope.target0 );
				scope.object.position.copy( scope.position0 );
				scope.object.zoom = scope.zoom0;
				scope.object.updateProjectionMatrix();
				scope.dispatchEvent( _changeEvent );
				scope.update();
				state = STATE.NONE;

			}; // this method is exposed, but perhaps it would be better if we can make it private...


			this.update = function () {

				const offset = new THREE.Vector3(); // so camera.up is the orbit axis

				const quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
				const quatInverse = quat.clone().invert();
				const lastPosition = new THREE.Vector3();
				const lastQuaternion = new THREE.Quaternion();
				const twoPI = 2 * Math.PI;
				return function update() {

					const position = scope.object.position;
					offset.copy( position ).sub( scope.target ); // rotate offset to "y-axis-is-up" space

					offset.applyQuaternion( quat ); // angle from z-axis around y-axis

					spherical.setFromVector3( offset );

					if ( scope.autoRotate && state === STATE.NONE ) {

						rotateLeft( getAutoRotationAngle() );

					}

					if ( scope.enableDamping ) {

						spherical.theta += sphericalDelta.theta * scope.dampingFactor;
						spherical.phi += sphericalDelta.phi * scope.dampingFactor;

					} else {

						spherical.theta += sphericalDelta.theta;
						spherical.phi += sphericalDelta.phi;

					} // restrict theta to be between desired limits


					let min = scope.minAzimuthAngle;
					let max = scope.maxAzimuthAngle;

					if ( isFinite( min ) && isFinite( max ) ) {

						if ( min < - Math.PI ) min += twoPI; else if ( min > Math.PI ) min -= twoPI;
						if ( max < - Math.PI ) max += twoPI; else if ( max > Math.PI ) max -= twoPI;

						if ( min <= max ) {

							spherical.theta = Math.max( min, Math.min( max, spherical.theta ) );

						} else {

							spherical.theta = spherical.theta > ( min + max ) / 2 ? Math.max( min, spherical.theta ) : Math.min( max, spherical.theta );

						}

					} // restrict phi to be between desired limits


					spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );
					spherical.makeSafe();
					spherical.radius *= scale; // restrict radius to be between desired limits

					spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) ); // move target to panned location

					if ( scope.enableDamping === true ) {

						scope.target.addScaledVector( panOffset, scope.dampingFactor );

					} else {

						scope.target.add( panOffset );

					}

					offset.setFromSpherical( spherical ); // rotate offset back to "camera-up-vector-is-up" space

					offset.applyQuaternion( quatInverse );
					position.copy( scope.target ).add( offset );
					scope.object.lookAt( scope.target );

					if ( scope.enableDamping === true ) {

						sphericalDelta.theta *= 1 - scope.dampingFactor;
						sphericalDelta.phi *= 1 - scope.dampingFactor;
						panOffset.multiplyScalar( 1 - scope.dampingFactor );

					} else {

						sphericalDelta.set( 0, 0, 0 );
						panOffset.set( 0, 0, 0 );

					}

					scale = 1; // update condition is:
					// min(camera displacement, camera rotation in radians)^2 > EPS
					// using small-angle approximation cos(x/2) = 1 - x^2 / 8

					if ( zoomChanged || lastPosition.distanceToSquared( scope.object.position ) > EPS || 8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

						scope.dispatchEvent( _changeEvent );
						lastPosition.copy( scope.object.position );
						lastQuaternion.copy( scope.object.quaternion );
						zoomChanged = false;
						return true;

					}

					return false;

				};

			}();

			this.dispose = function () {

				scope.domElement.removeEventListener( 'contextmenu', onContextMenu );
				scope.domElement.removeEventListener( 'pointerdown', onPointerDown );
				scope.domElement.removeEventListener( 'pointercancel', onPointerCancel );
				scope.domElement.removeEventListener( 'wheel', onMouseWheel );
				scope.domElement.removeEventListener( 'pointermove', onPointerMove );
				scope.domElement.removeEventListener( 'pointerup', onPointerUp );

				if ( scope._domElementKeyEvents !== null ) {

					scope._domElementKeyEvents.removeEventListener( 'keydown', onKeyDown );

				} //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

			}; //
			// internals
			//


			const scope = this;
			const STATE = {
				NONE: - 1,
				ROTATE: 0,
				DOLLY: 1,
				PAN: 2,
				TOUCH_ROTATE: 3,
				TOUCH_PAN: 4,
				TOUCH_DOLLY_PAN: 5,
				TOUCH_DOLLY_ROTATE: 6
			};
			let state = STATE.NONE;
			const EPS = 0.000001; // current position in spherical coordinates

			const spherical = new THREE.Spherical();
			const sphericalDelta = new THREE.Spherical();
			let scale = 1;
			const panOffset = new THREE.Vector3();
			let zoomChanged = false;
			const rotateStart = new THREE.Vector2();
			const rotateEnd = new THREE.Vector2();
			const rotateDelta = new THREE.Vector2();
			const panStart = new THREE.Vector2();
			const panEnd = new THREE.Vector2();
			const panDelta = new THREE.Vector2();
			const dollyStart = new THREE.Vector2();
			const dollyEnd = new THREE.Vector2();
			const dollyDelta = new THREE.Vector2();
			const pointers = [];
			const pointerPositions = {};

			function getAutoRotationAngle() {

				return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

			}

			function getZoomScale() {

				return Math.pow( 0.95, scope.zoomSpeed );

			}

			function rotateLeft( angle ) {

				sphericalDelta.theta -= angle;

			}

			function rotateUp( angle ) {

				sphericalDelta.phi -= angle;

			}

			const panLeft = function () {

				const v = new THREE.Vector3();
				return function panLeft( distance, objectMatrix ) {

					v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix

					v.multiplyScalar( - distance );
					panOffset.add( v );

				};

			}();

			const panUp = function () {

				const v = new THREE.Vector3();
				return function panUp( distance, objectMatrix ) {

					if ( scope.screenSpacePanning === true ) {

						v.setFromMatrixColumn( objectMatrix, 1 );

					} else {

						v.setFromMatrixColumn( objectMatrix, 0 );
						v.crossVectors( scope.object.up, v );

					}

					v.multiplyScalar( distance );
					panOffset.add( v );

				};

			}(); // deltaX and deltaY are in pixels; right and down are positive


			const pan = function () {

				const offset = new THREE.Vector3();
				return function pan( deltaX, deltaY ) {

					const element = scope.domElement;

					if ( scope.object.isPerspectiveCamera ) {

						// perspective
						const position = scope.object.position;
						offset.copy( position ).sub( scope.target );
						let targetDistance = offset.length(); // half of the fov is center to top of screen

						targetDistance *= Math.tan( scope.object.fov / 2 * Math.PI / 180.0 ); // we use only clientHeight here so aspect ratio does not distort speed

						panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
						panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

					} else if ( scope.object.isOrthographicCamera ) {

						// orthographic
						panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
						panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

					} else {

						// camera neither orthographic nor perspective
						console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
						scope.enablePan = false;

					}

				};

			}();

			function dollyOut( dollyScale ) {

				if ( scope.object.isPerspectiveCamera ) {

					scale /= dollyScale;

				} else if ( scope.object.isOrthographicCamera ) {

					scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
					scope.object.updateProjectionMatrix();
					zoomChanged = true;

				} else {

					console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
					scope.enableZoom = false;

				}

			}

			function dollyIn( dollyScale ) {

				if ( scope.object.isPerspectiveCamera ) {

					scale *= dollyScale;

				} else if ( scope.object.isOrthographicCamera ) {

					scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
					scope.object.updateProjectionMatrix();
					zoomChanged = true;

				} else {

					console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
					scope.enableZoom = false;

				}

			} //
			// event callbacks - update the object state
			//


			function handleMouseDownRotate( event ) {

				rotateStart.set( event.clientX, event.clientY );

			}

			function handleMouseDownDolly( event ) {

				dollyStart.set( event.clientX, event.clientY );

			}

			function handleMouseDownPan( event ) {

				panStart.set( event.clientX, event.clientY );

			}

			function handleMouseMoveRotate( event ) {

				rotateEnd.set( event.clientX, event.clientY );
				rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );
				const element = scope.domElement;
				rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

				rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );
				rotateStart.copy( rotateEnd );
				scope.update();

			}

			function handleMouseMoveDolly( event ) {

				dollyEnd.set( event.clientX, event.clientY );
				dollyDelta.subVectors( dollyEnd, dollyStart );

				if ( dollyDelta.y > 0 ) {

					dollyOut( getZoomScale() );

				} else if ( dollyDelta.y < 0 ) {

					dollyIn( getZoomScale() );

				}

				dollyStart.copy( dollyEnd );
				scope.update();

			}

			function handleMouseMovePan( event ) {

				panEnd.set( event.clientX, event.clientY );
				panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
				pan( panDelta.x, panDelta.y );
				panStart.copy( panEnd );
				scope.update();

			}

			function handleMouseWheel( event ) {

				if ( event.deltaY < 0 ) {

					dollyIn( getZoomScale() );

				} else if ( event.deltaY > 0 ) {

					dollyOut( getZoomScale() );

				}

				scope.update();

			}

			function handleKeyDown( event ) {

				let needsUpdate = false;

				switch ( event.code ) {

					case scope.keys.UP:
						pan( 0, scope.keyPanSpeed );
						needsUpdate = true;
						break;

					case scope.keys.BOTTOM:
						pan( 0, - scope.keyPanSpeed );
						needsUpdate = true;
						break;

					case scope.keys.LEFT:
						pan( scope.keyPanSpeed, 0 );
						needsUpdate = true;
						break;

					case scope.keys.RIGHT:
						pan( - scope.keyPanSpeed, 0 );
						needsUpdate = true;
						break;

				}

				if ( needsUpdate ) {

					// prevent the browser from scrolling on cursor keys
					event.preventDefault();
					scope.update();

				}

			}

			function handleTouchStartRotate() {

				if ( pointers.length === 1 ) {

					rotateStart.set( pointers[ 0 ].pageX, pointers[ 0 ].pageY );

				} else {

					const x = 0.5 * ( pointers[ 0 ].pageX + pointers[ 1 ].pageX );
					const y = 0.5 * ( pointers[ 0 ].pageY + pointers[ 1 ].pageY );
					rotateStart.set( x, y );

				}

			}

			function handleTouchStartPan() {

				if ( pointers.length === 1 ) {

					panStart.set( pointers[ 0 ].pageX, pointers[ 0 ].pageY );

				} else {

					const x = 0.5 * ( pointers[ 0 ].pageX + pointers[ 1 ].pageX );
					const y = 0.5 * ( pointers[ 0 ].pageY + pointers[ 1 ].pageY );
					panStart.set( x, y );

				}

			}

			function handleTouchStartDolly() {

				const dx = pointers[ 0 ].pageX - pointers[ 1 ].pageX;
				const dy = pointers[ 0 ].pageY - pointers[ 1 ].pageY;
				const distance = Math.sqrt( dx * dx + dy * dy );
				dollyStart.set( 0, distance );

			}

			function handleTouchStartDollyPan() {

				if ( scope.enableZoom ) handleTouchStartDolly();
				if ( scope.enablePan ) handleTouchStartPan();

			}

			function handleTouchStartDollyRotate() {

				if ( scope.enableZoom ) handleTouchStartDolly();
				if ( scope.enableRotate ) handleTouchStartRotate();

			}

			function handleTouchMoveRotate( event ) {

				if ( pointers.length == 1 ) {

					rotateEnd.set( event.pageX, event.pageY );

				} else {

					const position = getSecondPointerPosition( event );
					const x = 0.5 * ( event.pageX + position.x );
					const y = 0.5 * ( event.pageY + position.y );
					rotateEnd.set( x, y );

				}

				rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );
				const element = scope.domElement;
				rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

				rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );
				rotateStart.copy( rotateEnd );

			}

			function handleTouchMovePan( event ) {

				if ( pointers.length === 1 ) {

					panEnd.set( event.pageX, event.pageY );

				} else {

					const position = getSecondPointerPosition( event );
					const x = 0.5 * ( event.pageX + position.x );
					const y = 0.5 * ( event.pageY + position.y );
					panEnd.set( x, y );

				}

				panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
				pan( panDelta.x, panDelta.y );
				panStart.copy( panEnd );

			}

			function handleTouchMoveDolly( event ) {

				const position = getSecondPointerPosition( event );
				const dx = event.pageX - position.x;
				const dy = event.pageY - position.y;
				const distance = Math.sqrt( dx * dx + dy * dy );
				dollyEnd.set( 0, distance );
				dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );
				dollyOut( dollyDelta.y );
				dollyStart.copy( dollyEnd );

			}

			function handleTouchMoveDollyPan( event ) {

				if ( scope.enableZoom ) handleTouchMoveDolly( event );
				if ( scope.enablePan ) handleTouchMovePan( event );

			}

			function handleTouchMoveDollyRotate( event ) {

				if ( scope.enableZoom ) handleTouchMoveDolly( event );
				if ( scope.enableRotate ) handleTouchMoveRotate( event );

			} //
			// event handlers - FSM: listen for events and reset state
			//


			function onPointerDown( event ) {

				if ( scope.enabled === false ) return;

				if ( pointers.length === 0 ) {

					scope.domElement.setPointerCapture( event.pointerId );
					scope.domElement.addEventListener( 'pointermove', onPointerMove );
					scope.domElement.addEventListener( 'pointerup', onPointerUp );

				} //


				addPointer( event );

				if ( event.pointerType === 'touch' ) {

					onTouchStart( event );

				} else {

					onMouseDown( event );

				}

			}

			function onPointerMove( event ) {

				if ( scope.enabled === false ) return;

				if ( event.pointerType === 'touch' ) {

					onTouchMove( event );

				} else {

					onMouseMove( event );

				}

			}

			function onPointerUp( event ) {

				removePointer( event );

				if ( pointers.length === 0 ) {

					scope.domElement.releasePointerCapture( event.pointerId );
					scope.domElement.removeEventListener( 'pointermove', onPointerMove );
					scope.domElement.removeEventListener( 'pointerup', onPointerUp );

				}

				scope.dispatchEvent( _endEvent );
				state = STATE.NONE;

			}

			function onPointerCancel( event ) {

				removePointer( event );

			}

			function onMouseDown( event ) {

				let mouseAction;

				switch ( event.button ) {

					case 0:
						mouseAction = scope.mouseButtons.LEFT;
						break;

					case 1:
						mouseAction = scope.mouseButtons.MIDDLE;
						break;

					case 2:
						mouseAction = scope.mouseButtons.RIGHT;
						break;

					default:
						mouseAction = - 1;

				}

				switch ( mouseAction ) {

					case THREE.MOUSE.DOLLY:
						if ( scope.enableZoom === false ) return;
						handleMouseDownDolly( event );
						state = STATE.DOLLY;
						break;

					case THREE.MOUSE.ROTATE:
						if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

							if ( scope.enablePan === false ) return;
							handleMouseDownPan( event );
							state = STATE.PAN;

						} else {

							if ( scope.enableRotate === false ) return;
							handleMouseDownRotate( event );
							state = STATE.ROTATE;

						}

						break;

					case THREE.MOUSE.PAN:
						if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

							if ( scope.enableRotate === false ) return;
							handleMouseDownRotate( event );
							state = STATE.ROTATE;

						} else {

							if ( scope.enablePan === false ) return;
							handleMouseDownPan( event );
							state = STATE.PAN;

						}

						break;

					default:
						state = STATE.NONE;

				}

				if ( state !== STATE.NONE ) {

					scope.dispatchEvent( _startEvent );

				}

			}

			function onMouseMove( event ) {

				switch ( state ) {

					case STATE.ROTATE:
						if ( scope.enableRotate === false ) return;
						handleMouseMoveRotate( event );
						break;

					case STATE.DOLLY:
						if ( scope.enableZoom === false ) return;
						handleMouseMoveDolly( event );
						break;

					case STATE.PAN:
						if ( scope.enablePan === false ) return;
						handleMouseMovePan( event );
						break;

				}

			}

			function onMouseWheel( event ) {

				if ( scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE ) return;
				event.preventDefault();
				scope.dispatchEvent( _startEvent );
				handleMouseWheel( event );
				scope.dispatchEvent( _endEvent );

			}

			function onKeyDown( event ) {

				if ( scope.enabled === false || scope.enablePan === false ) return;
				handleKeyDown( event );

			}

			function onTouchStart( event ) {

				trackPointer( event );

				switch ( pointers.length ) {

					case 1:
						switch ( scope.touches.ONE ) {

							case THREE.TOUCH.ROTATE:
								if ( scope.enableRotate === false ) return;
								handleTouchStartRotate();
								state = STATE.TOUCH_ROTATE;
								break;

							case THREE.TOUCH.PAN:
								if ( scope.enablePan === false ) return;
								handleTouchStartPan();
								state = STATE.TOUCH_PAN;
								break;

							default:
								state = STATE.NONE;

						}

						break;

					case 2:
						switch ( scope.touches.TWO ) {

							case THREE.TOUCH.DOLLY_PAN:
								if ( scope.enableZoom === false && scope.enablePan === false ) return;
								handleTouchStartDollyPan();
								state = STATE.TOUCH_DOLLY_PAN;
								break;

							case THREE.TOUCH.DOLLY_ROTATE:
								if ( scope.enableZoom === false && scope.enableRotate === false ) return;
								handleTouchStartDollyRotate();
								state = STATE.TOUCH_DOLLY_ROTATE;
								break;

							default:
								state = STATE.NONE;

						}

						break;

					default:
						state = STATE.NONE;

				}

				if ( state !== STATE.NONE ) {

					scope.dispatchEvent( _startEvent );

				}

			}

			function onTouchMove( event ) {

				trackPointer( event );

				switch ( state ) {

					case STATE.TOUCH_ROTATE:
						if ( scope.enableRotate === false ) return;
						handleTouchMoveRotate( event );
						scope.update();
						break;

					case STATE.TOUCH_PAN:
						if ( scope.enablePan === false ) return;
						handleTouchMovePan( event );
						scope.update();
						break;

					case STATE.TOUCH_DOLLY_PAN:
						if ( scope.enableZoom === false && scope.enablePan === false ) return;
						handleTouchMoveDollyPan( event );
						scope.update();
						break;

					case STATE.TOUCH_DOLLY_ROTATE:
						if ( scope.enableZoom === false && scope.enableRotate === false ) return;
						handleTouchMoveDollyRotate( event );
						scope.update();
						break;

					default:
						state = STATE.NONE;

				}

			}

			function onContextMenu( event ) {

				if ( scope.enabled === false ) return;
				event.preventDefault();

			}

			function addPointer( event ) {

				pointers.push( event );

			}

			function removePointer( event ) {

				delete pointerPositions[ event.pointerId ];

				for ( let i = 0; i < pointers.length; i ++ ) {

					if ( pointers[ i ].pointerId == event.pointerId ) {

						pointers.splice( i, 1 );
						return;

					}

				}

			}

			function trackPointer( event ) {

				let position = pointerPositions[ event.pointerId ];

				if ( position === undefined ) {

					position = new THREE.Vector2();
					pointerPositions[ event.pointerId ] = position;

				}

				position.set( event.pageX, event.pageY );

			}

			function getSecondPointerPosition( event ) {

				const pointer = event.pointerId === pointers[ 0 ].pointerId ? pointers[ 1 ] : pointers[ 0 ];
				return pointerPositions[ pointer.pointerId ];

			} //


			scope.domElement.addEventListener( 'contextmenu', onContextMenu );
			scope.domElement.addEventListener( 'pointerdown', onPointerDown );
			scope.domElement.addEventListener( 'pointercancel', onPointerCancel );
			scope.domElement.addEventListener( 'wheel', onMouseWheel, {
				passive: false
			} ); // force an update at start

			this.update();

		}

	} // This set of controls performs orbiting, dollying (zooming), and panning.
	// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
	// This is very similar to OrbitControls, another set of touch behavior
	//
	//    Orbit - right mouse, or left mouse + ctrl/meta/shiftKey / touch: two-finger rotate
	//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
	//    Pan - left mouse, or arrow keys / touch: one-finger move


	class MapControls extends OrbitControls {

		constructor( object, domElement ) {

			super( object, domElement );
			this.screenSpacePanning = false; // pan orthogonal to world-space direction camera.up

			this.mouseButtons.LEFT = THREE.MOUSE.PAN;
			this.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
			this.touches.ONE = THREE.TOUCH.PAN;
			this.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

		}

	}

	THREE.MapControls = MapControls;
	THREE.OrbitControls = OrbitControls;

} )();


//VRButton
class VRButton {

	static createButton( renderer, options ) {

		if ( options ) {

			console.error( 'THREE.VRButton: The "options" parameter has been removed. Please set the reference space type via renderer.xr.setReferenceSpaceType() instead.' );

		}

		const button = document.createElement( 'button' );

		function showEnterVR( /*device*/ ) {

			let currentSession = null;

			async function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				await renderer.xr.setSession( session );
				button.textContent = 'EXIT VR';

				currentSession = session;

			}

			function onSessionEnded( /*event*/ ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				button.textContent = 'ENTER VR';

				currentSession = null;

			}

			//

			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

            

			button.textContent = 'ENTER VR';

			button.onmouseenter = function () {

				button.style.opacity = '1.0';

			};

			button.onmouseleave = function () {

				button.style.opacity = '0.5';

			};

			button.onclick = function () {

				if ( currentSession === null ) {

					// WebXR's requestReferenceSpace only works if the corresponding feature
					// was requested at session creation time. For simplicity, just ask for
					// the interesting ones as optional features, but be aware that the
					// requestReferenceSpace call will fail if it turns out to be unavailable.
					// ('local' is always available for immersive sessions and doesn't need to
					// be requested separately.)

					const sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor', 'hand-tracking', 'layers' ] };
					navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

		}

		function disableButton() {

			button.style.display = '';

			button.style.cursor = 'auto';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;

		}

		function showWebXRNotFound() {

			disableButton();

			button.textContent = 'VR NOT SUPPORTED';

		}

		function showVRNotAllowed( exception ) {

			disableButton();

			console.warn( 'Exception when trying to call xr.isSessionSupported', exception );

			button.textContent = 'VR NOT ALLOWED';

		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
            element.style.bottom = '10px';
            element.style.padding = '6px 3px';
            element.style.border = '1px solid #fff';
            element.style.borderRadius = '1px';
            element.style.background = 'rgba(0,0,0,0.1)';
            element.style.color = '#fff';
            element.style.font = 'normal 7px sans-serif';
            element.style.textAlign = 'center';
            element.style.opacity = '0.5';
            element.style.outline = 'none';
            element.style.zIndex = '999';

		}

		if ( 'xr' in navigator ) {

			button.id = 'VRButton';
			button.style.display = 'none';

			stylizeElement( button );

			navigator.xr.isSessionSupported( 'immersive-vr' ).then( function ( supported ) {

				supported ? showEnterVR() : showWebXRNotFound();

				if ( supported && VRButton.xrSessionIsGranted ) {

					button.click();

				}

			} ).catch( showVRNotAllowed );

			return button;

		} else {

			const message = document.createElement( 'a' );

			if ( window.isSecureContext === false ) {

				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS'; // TODO Improve message

			} else {

				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';

			}

			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';

			stylizeElement( message );

			return message;

		}

	}

	static xrSessionIsGranted = false;

	static registerSessionGrantedListener() {

		if ( 'xr' in navigator ) {

			// WebXRViewer (based on Firefox) has a bug where addEventListener
			// throws a silent exception and aborts execution entirely.
			if ( /WebXRViewer\//i.test( navigator.userAgent ) ) return;

			navigator.xr.addEventListener( 'sessiongranted', () => {

				VRButton.xrSessionIsGranted = true;

			} );

		}

	}

}

VRButton.registerSessionGrantedListener();


// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.



class SpotlightModel extends widgets.DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name : 'SpotlightModel',
            _view_name : 'SpotlightView',
            _model_module : 'evince',
            _view_module : 'evince',
            _model_module_version : '0.30.0',
            _view_module_version : '0.30.0'
        };
    }
}

/*
var SpotlightModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'SpotlightModel',
        _view_name : 'SpotlightView',
        _model_module : 'evince',
        _view_module : 'evince',
        _model_module_version : '0.30.0',
        _view_module_version : '0.30.0'
    })
});
*/





// Custom View. Renders the widget model.
//var SpotlightView = widgets.DOMWidgetView.extend({
class SpotlightView extends widgets.DOMWidgetView {
    render() {
        const scene = new THREE.Scene();
        const postprocessing = {};
        this.scene = scene;
        

        let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
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

        this.renderer.setSize( .5*window.innerWidth, .5*window.innerHeight );
        //this.renderer.setClearColor( 0xfaf8ec, 1);
        //this.renderer.setClearColor( 0x0f0f2F, 1);
		
		const bg_color = new THREE.Color(this.model.get("bg_color")[0],this.model.get("bg_color")[1],this.model.get("bg_color")[2] );

		this.renderer.setClearColor(bg_color, 1);

		
        this.renderer.antialias = true;
        this.renderer.xr.enabled = true;
        
        let controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.controls = controls;
        
        this.init_changed();
        this.el.append(this.renderer.domElement);
        this.el.appendChild( VRButton.createButton( renderer ) );
        this.pos_changed();
        this.model.on('change:pos', this.pos_changed, this);
        this.model.on('change:init', this.init_changed, this);
        

        //this.animate();
        
        
        const renderPass = new THREE.RenderPass( this.scene, this.camera );
        const composer = new THREE.EffectComposer( this.renderer );

        composer.addPass( renderPass );
        

        

        


        
        
        
        

        if(this.model.get('sao')){
            console.log("sao active");
            const saoPass = new THREE.SAOPass( this.scene, this.camera, true, true );
		
        
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
            const bokehPass = new THREE.BokehPass( this.scene,this.camera, {
                focus: this.model.get('focus'),
                aperture:this.model.get('aperture') ,
                maxblur: this.model.get('max_blur'),

                width: window.innerWidth,
                height: window.innerHeight
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
            const fxaaPass = new THREE.ShaderPass( THREE.FXAAShader );

            const pixelRatio = renderer.getPixelRatio();

            
            fxaaPass.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
            fxaaPass.renderToScreen = false;

            console.log("fxaa render pass",fxaaPass.renderToScreen );
            
            composer.addPass( fxaaPass );   
        }
        


        
        
        

        postprocessing.composer = composer;
        

		this.renderer.autoClear = false;
 
        


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
        
        
        

        for (let i = 0; i < this.pos.length; i++) {
            // aCurve.push(this.pos[i][0], this.pos[i][1], this.pos[i][2]);
            //aColor.push(.3 + .001*this.colors[i][0], .3+ .001*this.colors[i][1], .3+ .001*this.colors[i][2]);
            //aColor.push(this.colors[i][0], this.colors[i][1], this.colors[i][2]);
            
            //let mcolor = new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]);
            let baseGeometry = new THREE.SphereBufferGeometry(this.radius[i], 20, 10);
            let material = new THREE.MeshStandardMaterial( );
            material.color = new THREE.Color(this.colors[i][0],  this.colors[i][1],  this.colors[i][2]);
            material.roughness = 0.2;
            material.metalness = 0.2;
            let mesh = new THREE.Mesh( baseGeometry, material );
            mesh.position.set( this.pos[i][0], this.pos[i][1], this.pos[i][2] );
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
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
            let material = new THREE.MeshStandardMaterial({ color: 0x5B5B5B });
            // Make the geometry (of "direction" length)
            material.roughness = 0.2;
            material.metalness = 0.2;
            var geometry = new THREE.CylinderGeometry(.4, 0.4, direction.length(), 6, 4, true);
            // shift it so one end rests on the origin
            //geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, direction.length() / 2, 0));
            //geometry.position = new THREE.Vector3( .5*(pY[0]+ pX[0]), .5*(pY[1]+ pX[1]), .5*(pY[2]+ pX[2]));
            
            


            // rotate it the right way for lookAt to work
            geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(3.1415/2.0));
            
            
            // Make a mesh with the geometry
            var mesh = new THREE.Mesh(geometry, material);
            
            // Position it where we want
            //mesh.position.copy(pointX);
            mesh.position.x = .5*(pY[0]+ pX[0]);
            mesh.position.y = .5*(pY[1]+ pX[1]);
            mesh.position.z = .5*(pY[2]+ pX[2]);
            //mesh.position = new THREE.Vector3( .5*(pY[0]+ pX[0]), .5*(pY[1]+ pX[1]), .5*(pY[2]+ pX[2]));
            // And make it point to where we want
            mesh.lookAt(pointY);
            this.scene.add(mesh);
        








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

        

        
        
        
        let light = new THREE.AmbientLight( 0xffffff, 0.5 ); // soft white light
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
        
            for (let i = 0; i < this.pos.length; i++) {
                //let pos_i = this.pos[i];
                //let children_i = this.scene.children[i];
                //children_i.position.x = pos_i[0];
                //children_i.position.y = pos_i[1];
                //children_i.position.z = pos_i[2];
                this.scene.children[i].position.set( this.pos[i][0], this.pos[i][1], this.pos[i][2] );

                //this.scene.children[i].position = new THREE.Vector3(this.pos[i][0], this.pos[i][1],  this.pos[i][2]);
            }

            //let aCurveFloat32 = new Float32Array(aCurve);
            //console.log(mesh, mesh.geometry);
            //this.scene.children[0].geometry.setAttribute(
            //  "aCurve",
            //  new THREE.InstancedBufferAttribute(aCurveFloat32, 3, false)
            //);
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





module.exports = {
	SpotlightModel: SpotlightModel,
	SpotlightView: SpotlightView,
};
