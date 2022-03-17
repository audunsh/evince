import numpy as np
import pythreejs as three
import braketlab as bk

from scipy.interpolate import interp1d

from skimage import measure
#from skimage.draw import ellipsoid



def extract_plane_contour(orb, a = 0, b= 0, c = 0, dr = np.array([0,0,0]), isoval = 0.1):
    """
    Draw curves at isoscalars where the distribution (orb) intersects a plane.
        
    Plane is rotated aby the angles ```a```,```b```,```c``` (around the x-, y- and z-axis), 
    and then translated by the vector ```dr```.
    """
    
    Nt = 200
    Mt = 10
    t = np.linspace(-Mt,Mt,Nt)
    r = np.zeros((3,Nt**2), dtype = float)
    xy = np.array(np.meshgrid(t,t)).reshape(2,-1)
    r[[0,1]] = xy
    
    sa,sb,sc = np.sin(a), np.sin(b), np.sin(c)
    ca,cb,cc = np.cos(a), np.cos(b), np.cos(c)
    
    #3d rotation matrix
    rot = np.array([[ca*cb, ca*sb*sc - sa*cc, ca*sb*cc - sa*sc], 
                    [sa*cb, sa*sb*sc + ca*cc, sa*sb*cc - ca*sc],
                    [-sb  , cb*sc           , cb*cc]])
    
    R = rot.dot(r) + dr[:, None]
    
    plane = orb(R[0], R[1], R[2]).reshape(Nt,Nt)
    
    #plt.figure(figsize=(6,6))
    #plt.contour(t,t,plane)
    
    contours = measure.find_contours(orb(R[0], R[1], R[2]).reshape(Nt,Nt),  isoval)
    lines = []
    for c in contours:
        rn = np.zeros((3,c.shape[0]), dtype = float)
        rn[[1,0]] = (Mt*2*(c/Nt - .5)).T
        
        
        lines.append( rot.dot(rn) + dr[:, None] )
        
        #lines.append()
        
    return lines



def curve2linesegment(curve, col = None, linewidth = 1):
    """
    Transform a discrete array of points into THREE.LineMaterial with optional coloring
    """
    positions = []
    colors = []
    for i in range(len(curve)-1):
        positions.append([curve[i], curve[i+1]])
        if col is not None:
            colors.append([col[i], col[i+1]])
        else:
            colors.append([[0,0,0],[0,0,0]])
    g = three.LineSegmentsGeometry(
        positions=positions,
        colors=colors,
    )
    m = three.LineMaterial(linewidth=linewidth, vertexColors='VertexColors', transparent = True, opacity = .1)
    return three.LineSegments2(g,m)


def extract_surface(orb, val = 0.05, res = 80, extent = 5, n_exp = 1):
    """
    Extract isosurface from ```orb( np.linspace(-extent, extent, res), ... )**n_exp == val``` 
    """
    
    t = np.linspace(-extent,extent,res)
    
    # Marching cubes to obtain a surface mesh 
    verts, faces, normals, values = measure.marching_cubes_lewiner(orb(t[:, None, None], t[None, :, None], t[None,None,:])**n_exp, level = val)
    
    verts = extent*2*(verts - .5*res)/res
    
    # Simple square with unique vertices
    vertices = three.BufferAttribute(
        array=verts,
        normalized=False)

    # Index buffer
    index = three.BufferAttribute(
        array=np.array(faces, dtype = np.uint32).ravel(),
        normalized=False)

    geometry = three.BufferGeometry(
        attributes={
            'position': vertices,
            'index': index,
        })
    # add color above to attributes
    # 'color': three.BufferAttribute(np.random.randint(0,255,(3,len(faces))))
    return geometry


def sphere_surface(pos, colorfield, width = 1, res = 200, extent = 5, n_exp = 1, colorscheme = None):
    """
    Construct a surface around the points in pos, with a distance from pos
    determined by ```width```.
    """
    p = bk.basisbank.get_gto(width, 0,0,position = pos[0])
    for i in range(1, len(pos)):
        p += bk.basisbank.get_gto(width, 0,0,position = pos[i])
    t = np.linspace(-extent,extent,res)
    # Use marching cubes to obtain the surface mesh of these ellipsoids
    verts, faces, normals, values = measure.marching_cubes_lewiner(p(t[:, None, None], t[None, :, None], t[None,None,:]), level = .1)
    
    verts = extent*2*(verts - .5*res)/res
    # Simple square with unique vertices
    vertices = three.BufferAttribute(
        array=verts,
        normalized=False)
    
    
    #print(verts.shape, verts[0])
    #print(faces.shape, faces[0])
    
    pts = np.mean(verts[faces], axis = 1) #axis 2 or 1?
    #print(pts.shape, pts[0])
    
    #pts = verts.reshape(-1,3,3)[:,0]
    col = colorfield(verts[:,0], verts[:,1], verts[:,2])**n_exp
    #col = np.exp(-pts[:,0]**2 + pts[:,1]**2 + pts[:,2]**2)
    col = col - col.min()
    col = col/col.max()

    if colorscheme is None:
        col = interp1d(np.linspace(0,1,12), np.random.uniform(0,1,(3,12)))(col)
    else:
        col = colorscheme(col)

    
    
    #c = np.array([[1,0,0],[0,0,1]])
    #col = interp1d([0,1], c.T)(col)
    
    #print(col.shape)
    #col = np.random.uniform(0,255,(len(faces), 3)).T

    # Index buffer
    index = three.BufferAttribute(
        array=np.array(faces, dtype = np.uint32).ravel(),
        normalized=False)

    geometry = three.BufferGeometry(
        attributes={
            'position': vertices,
            'index': index,
            'color': three.BufferAttribute(np.array(col.T, dtype = np.float32))
        })
    # add color above to attributes
    # 'color': three.BufferAttribute(np.random.randint(0,255,(3,len(faces))))
    return geometry
