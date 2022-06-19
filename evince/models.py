import numpy as np
import pythreejs as three

from IPython.display import display

import evince.processing as pr
import evince.system as esys

class molecule():
    """
    A visual representation of a chemical system

    

    """
    def __init__(self, ket = None, atoms = None, extent = 8):
        """
        
        """
        self.colors = esys.colorscheme() # color of atoms

        if atoms is not None:
            self.add_atoms(atoms)
        
        if ket is not None:
            self.ket = ket
            
        
        self.scene = three.Scene(children=[three.AmbientLight(color='#ffffff', intensity = 0.2), three.DirectionalLight(color='#ffffff', position=[2, 2, 2], intensity=0.5)])
        
        self.extent = extent # max distance 
        

            
    def set_atoms(self, atoms, update_extent = True):
        for i in range(len(atoms)):
            self.scene.children[i+2].position = tuple(atoms[i, 1:])
    
    def add_atoms(self, atoms):
        """
        Add atoms from an array ```atoms``` with dimensions (n_atoms, 4), where the first column contains charges,
        and the remaining ones contain cartesian coordinates.
        
        
        """
        #self.colors()
        
        self.atoms = atoms
        #print(mat.blending)
        for i in atoms:
            cx,cy,cz = np.array(255*(self.colors(i[0])/255)**1, dtype = int)
            #print(cx)
            c = '#%02x%02x%02x' % (cx,cy,cz)
            #mat = three.MeshStandardMaterial(color=c,depthWrite = True, depthTest = True,alpha = 1,  opacity = 1, transparent = False)
            mat = three.MeshStandardMaterial(color=c) #,depthWrite = True, depthTest = True,alpha = 1,  opacity = 1, transparent = False)
            
            #mat.blending = three.BlendingMode.SubtractiveBlending
            mat.roughness = 0
            mat.metalness = 0
            mat.shininess = 1.0
            #mat.transparent = True
            #mat.opacity = .4
            
            mat.specular = '#222222'
            geom = three.SphereGeometry(radius=.4, 
                                    widthSegments=25, 
                                    heightSegments=25)
            ball = three.Mesh(geometry=geom,
                              material=mat,
                              position=tuple(i[1:]))
            self.scene.add(ball)
            
    def add_orbital_(self, orb, val = 0.05, color ='#0c0900', n_exp = 1):
        """
        Create a surface/lobe representation of a density ```orb ()**n_exp```
        """
        geometry = pr.extract_surface(orb, val = val, n_exp = n_exp)
        
        mat = three.MeshStandardMaterial(color=color) #, renderOrder = 100, depthWrite = False, depthTest = True,alpha = .1,  opacity = .1, transparent = False)
        mat.blending = three.BlendingMode.SubtractiveBlending
        mat.depthWrite = False
        mat.transparent = False
        mat.opacity = 0.05
        surface = three.Mesh(geometry=geometry,
                              material=mat,
                            position = (0,0,0))
        #surface.renderOrder = 0.6;
            
        self.scene.add(surface)
        
    def add_orbital(self, orb,c1 = "#010100",c2 = "#000101", n_exp = 1):
        """
        Create a density representation (stacked, transparent surfaces) of 
        the density ```orb()**n_exp```.
        Colors are assigned by ```c1``` (positive) and ```c2``` (negative.)
        """
        aa = 2
        
        #determine max and minimum
        t = np.linspace(-self.extent, self.extent, 100)
        vals = np.abs(orb(t[:, None, None], t[None,:,None], t[None,None, :])**n_exp)
        vmax, vmin = vals.max(), vals.min(), 
        
        #print(vmax)


        # orbital
        for i in np.linspace((vmax*1e-2)**(aa**-1),vmax**(aa**-1),15)**aa:
            #print(i)
            try:
                self.add_orbital_(orb_p, val = i, color = c1, n_exp = n_exp)
                self.add_orbital_(orb_p, val = -i, color = c2, n_exp = n_exp)
            except:
                print("Could not extract isosurface for value =", i, -1*i)
        
    def add_surface(self, surf, val = .05, color = '#ccf940'):
        """
        Extract a isoscalar surface from surf
        """
        geometry = pr.extract_surface(surf, val = val)
        
        mat = three.MeshStandardMaterial(color=color, renderOrder = 100, depthWrite = False, depthTest = True,alpha = .1,  opacity = .1, transparent = True)
        mat.blending = three.BlendingMode.MultiplyBlending
        mat.roughness = 1.0
        mat.metalness = 1.0
        mat.shininess = 1.0

        mat.specular = '#222222'
        surface = three.Mesh(geometry=geometry,
                              material=mat,
                            position = (0,0,0))
        #surface.renderOrder = 0.6;
            
        self.scene.add(surface)
        
    def setup_atomic_surface(self, ket, color = '#ccf940', n_exp = 1):
        """
        Create a equidistant surface around the atoms.
        
        Texturize using the colors provided by ```ket(...)**n_exp```.
        """
        
        geometry = pr.sphere_surface(self.atoms[:, 1:], ket, n_exp = n_exp)
        
        mat = three.MeshBasicMaterial(vertexColors='VertexColors') #, renderOrder = 100, depthWrite = False, depthTest = True,  opacity = .1, transparent = True)
        #mat.blending = three.BlendingMode.NormalBlending
        mat.depthWrite = False
        mat.depthTest = False
        mat.transparent = True
        mat.opacity = 0.5
        mat.roughness = 1
        mat.metalness = 0
        mat.shininess = 1.0
        mat.renderOrder = 100

        mat.specular = '#111111'
        mat.side = three.Side.BackSide

        #mat.specular = '#222222'
        surface = three.Mesh(geometry=geometry,
                              material=mat,
                            position = (0,0,0))
        
        self.scene.add(surface)
        
    def indicate_bond(self, atom_index1, atom_index2, width = 20):
        """
        Draw a bond between atom at ```atom_index1``` and ```atom_index2```
        """
        
        c1,c2 = self.colors(self.atoms[atom_index1, 0])/255, self.colors(self.atoms[atom_index2, 0])/255
        curve = [self.atoms[atom_index1, 1:], self.atoms[atom_index2, 1:]]
        colors = [c1*.5,c2*.5]
        self.add_curve(curve,colors, linewidth= width)
        
    def intersection_curve(self, isovals, orb = None, a= 0, b=0, c = 0, dr = np.array([0,0,0])):
        """
        Draw curves at isoscalars where the distribution (orb) intersects a plane.
        
        Plane is rotated aby the angles ```a```,```b```,```c``` (around the x-, y- and z-axis), 
        and then translated by the vector ```dr```.
        """
        if orb is None:
            orb = self.ket
            
        for j in isovals:
            curves = pr.extract_plane_contour(orb, a = a, b=b, c=c, dr =dr, isoval = j)
            
            for i in curves:
                self.add_curve(i.T)

            
        
    
    def add_curve(self, curve, color = None, linewidth = 1):
        """
        Append a curve to the figure
        """
        self.scene.add(pr.curve2linesegment(curve, color, linewidth))
            
    def render(self, width = 512, height = 512):
        """
        Display figure on screen
        """
        #scene = three.Scene(children=[ball, c, AmbientLight(color='#777777')])
        c = three.PerspectiveCamera(position=[0, 5, 5], up=[0, 1, 0]) #,
                      # children=[three.DirectionalLight(color='#ffffff', position=[2, 2, 2], intensity=1.5)])
        
        #renderer.gammaInput = true;
        #renderer.gammaOutput = true;
        tcont = three.OrbitControls(controlling=c) #
        tcont.autoRotate = True
        tcont.autoRotateSpeed=2.0

        # self.renderer = three.Renderer(webgl_version=2, camera=c,gammaInput = True, gammaOutput = True, antialias = True, 
        ##                    scene=self.scene, 
        #                   controls=[tcont], width = width, height = height)
        self.renderer = three.Renderer(camera=c,antialias = False, 
                            scene=self.scene, 
                            controls=[tcont], width = width, height = height)
        display(self.renderer)            