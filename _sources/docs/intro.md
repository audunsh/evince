<div id="fb-root"></div>
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_GB/sdk.js#xfbml=1&version=v12.0" nonce="tlriJYau"></script>

<iframe src="https://audunsh.github.io/evince-presentation/harmonic_chain.html" width = "600px" height="400px" frameBorder="0"></iframe>

# What is Evince?

Evince is an experimental visualization module for the <a href="https://hylleraas.readthedocs.io/en/latest">Hylleraas Software Platform</a>, focused on the development of high-quality, high-performing, customizable, extendable and portable interactive scientific visualizations. 

The module is built from the <a href="https://github.com/jupyter-widgets/widget-cookiecutter">Widget Cookiecutter</a>, with a front-end visualization based on <a href="threejs.org">THREE.JS</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API">WebGL</a> and <a href="https://immersiveweb.dev/">WebXR</a>. The module provides a seamless workflow from the Python-side to the front-end, with the finished product being portable to any device equipped with standard browsing capabilities, with or without an active Python-kernel. 

This approach opens the door to a wide range of possibilities for real-time visualization, novel approaches to traditional depictions, GPU-based implementations, VR and versatile approaches to interaction, and tools for publication, presentation, teaching and outreach. In a sense, it is also Web 3.0-ready, and embraces standards which may become important in future web architecture.

The options are too many for a single person to explore on their own, so we invite the Hylleraas community to contribute. On these pages you'll find instructions, tutorials, examples and ideas to help you get started. Please contact Audun (a.s.hansen@kjemi.uio.no) if you have questions.

# High-quality 3D graphics

<a href="threejs.org">THREE.JS</a> is a Javascript library for creating 3D graphics for webpages, offering a wide range of predefined geometries, materials, scene-building tools and postprocessing options for producing stunning graphics executed on your GPU and rendered in the browser. Look through the examples on the official pages for inspiration, and keep in mind that all these effects are trivially reproducible within the Evince setup. 

Check out the <a href="spotlight">evince.spotligh</a>-module for an example on postprocessing capabilities.

# High-performance graphics

Furthermore, the framework allows you to write custom <a href="https://en.wikipedia.org/wiki/Shader">shaders</a> (programs executed by the GPU) used for high-performance operations. Note that this does not have to be directly graphics related, the same procedure may be used to do general calculations and transfer data to and from the GPU cache. <a href="threejs.org">THREE.JS</a> will likely support the modern WebGPU-standard (for modern GPUs with shared memory and other features), meaning that future capabilities will be even higher.

# Customizability and extendability

The <a href="https://github.com/jupyter-widgets/widget-cookiecutter">Widget Cookiecutter</a> is a tool for making widgets for the Jupyter Environment. A widget is a piece of software connecting several layers of the Jupyter environment, with an interactive graphical user representation running on the Javascript front-end, connected to the Python-kernel using the 

# Portability

Evince is deployed as three separate Javascript libraries:
1. A front-end widget connected to the Python kernel, running within the Jupyter Notebook.
2. A front-end widget connected to the Python kernel, running within Jupyter Lab.
3. A standalone Javascript model viewer, <a href="https://www.npmjs.com/package/evince">distributed online</a> from the npmjs.com content delivery network (CDN).

# Interactivity

When running Evince within the Jupyter-environment, communication between the Python kernel and the front-end runs seamlessly in the back. This is possible due to the <a href="https://jupyter-notebook.readthedocs.io/en/stable/comms.html">Comms</a>-design of Jupyter itself, where variables can be synchronized between Javascript and Python using <a href="https://zeromq.org/">ZeroMQ</a>. 

In practice, this means that you may execute operations on the Python side which instantly updates the visual representation of the widget. 



<div align = 'center'>
<a href="https://audunsh.github.io/braketlab/"><img src="https://audunsh.github.io/slides/assets/braketlab_logo_plain.png" width = '10%' align = 'center'></a>
<a href="https://github.com/audunsh/bubblebox"><img src="https://audunsh.github.io/slides/assets/bubblebox_logo15.png" width = '10%' align = 'center'></a>
<a href="https://github.com/audunsh/evince"><img src="https://audunsh.github.io/slides/assets/evince_logo.png" width = '10%' align = 'center'></a>
<a href="https://daltonproject.readthedocs.io"><img src="https://daltonproject.readthedocs.io/en/latest/_static/daltonproject.svg" width = '10%' align = 'center'></a>
<a href="https://hylleraas.readthedocs.io/en/latest/"><img src="https://www.mn.uio.no/hylleraas/english/about/internal/graphical-profile/visual-profile/hylleraas-%E2%80%93-logo-%E2%80%93-black-%E2%80%93%C2%A0screen-%E2%80%93-rgb.png" width = '10%' align = 'center'></a>
<a href="https://audunsh.github.io/btjenesten/"><img src="https://raw.githubusercontent.com/audunsh/btjenesten/master/graphics/b_logo_3.png" width = '10%' align = 'center'></a>
<center><small>Evince is part of a larger cluster of Python modules. Check them out.</small></center>
</div>   




---

