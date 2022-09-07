# GPU performance

With WebGL, many operations pertaining to the graphical view can be unloaded on the GPU. Altough WebGL does not support shared memory between cores, THREE.JS is currently being prepared for WebGPU which is designed for modern graphics cards. 

At the time of writing, we have explored two different GPU-based rendering techniques on Evince:

## BraketLab shaders

The ```ket```-class in <a href="audunsh.github.io/braketlab">BraketLab</a> has the ability to produce shaders for WebGL. When connecting to Evince, the ket may then upload the shader to the GPU, where the graphical representation is rendered to the browser window. 

This is extremely fast compared to the conventional approach for viewing orbitals, where a linear combination of AOs is evaluated on a grid, transformed to a isoscalar surface using marching cubes, and finally visualized on the renderer using some suitable technique. The shader-based approach is near instant, and evaluates the orbital continuously on the GPU while the user interacts with the view.

## MDBox instancing

3D rendering can become inefficient when the list of unique vertices/triangles on screen becomes large. However, a scene containing only spheres needs not define a unique geometry for each sphere - rather, it can define one single sphere and translate it around whenever a new sphere needs to be rendered. This technique is what has been termed **instancing**, and is implemented for the interactive MDBox class connecting to <a href="audunsh.github.io/bubblebox">BubbleBox</a>.

<a href="https://velasquezdaniel.com/blog/rendering-100k-spheres-instantianing-and-draw-calls/">More information on this technique</a>.
