# High quality 3D graphics - the Spotlight module

The potential for making stunning and beautiful graphics with THREE.JS is high. Check out their <a href="www.threejs.org/examples">examples pages</a> for inspiration, and keep in mind that anything there can be replicated within Evince.

Notably, the <a href="https://threejs.org/docs/?q=post#manual/en/introduction/How-to-use-post-processing">post-processing</a> options in THREE.JS are interesting from a "get-that-cover"-perspective (keywords: bloom, dof, sao, raytracing, mm).

I've made a prototype for a viewer called <a href="https://github.com/audunsh/evince/blob/master/js/lib/spotlightview.js">SpotlightView</a>, where certain post-processing options are active. It currently works with <a href="https://audunsh.github.io/bubblebox/">BubbleBox</a>, but can easily be extended or customized for another input format. 

This module will likely support the HSP-molecule object in the very near future.

