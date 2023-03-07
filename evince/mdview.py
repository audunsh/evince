import ipywidgets as widgets
from ipywidgets import embed
from traitlets import Unicode, validate
import traitlets as tl
from traittypes import Array
from IPython.display import Javascript
from ._version import NPM_PACKAGE_RANGE

from scipy.interpolate import interp1d

import numpy as np


def get_vwv_radius_from_atomic_number(masses):
    # in angstrom
    vwv_radii = np.array([120,140,182,153,192,170,155,152,147,154,227,173,184,210,180,180,175,188,275,231,211])*0.01
    return interp1d(np.arange(1,vwv_radii.shape[0]+1), vwv_radii, bounds_error=False, fill_value=1)(masses)


def array_to_binary(ar, obj=None):
    # from https://gist.github.com/maartenbreddels/40fa030fdb922e6d2074282ceed6b753
    if ar is not None:
        ar = ar.astype(np.float32)
        mv = memoryview(ar)
        # 'nested' is just to show the (de)serialization goes all fine
        return {'data': mv, 'shape': ar.shape}
    else:
        return None
def binary_to_array(value, obj=None):
    # from https://gist.github.com/maartenbreddels/40fa030fdb922e6d2074282ceed6b753
    global last_value, setters
    setters += 1
    #print(">>", value) # print msg'es get lost, but check the websocket output
    last_value = value # or keep a reference to a global for debugging
    return np.frombuffer(value['data'], dtype=np.float32)
    #return np.frombuffer(value['data'], dtype=np.float32)

# from https://gist.github.com/maartenbreddels/40fa030fdb922e6d2074282ceed6b753
array_binary_serialization = dict(to_json=array_to_binary, from_json=binary_to_array)


@widgets.register
class MDView(widgets.DOMWidget):
    # Name of the widget view class in front-end
    _view_name = Unicode('MDView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = Unicode('MDModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = Unicode('evince').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = Unicode('evince').tag(sync=True)


    # Version of the front-end module containing widget view
    _view_module_version = Unicode(NPM_PACKAGE_RANGE).tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = Unicode(NPM_PACKAGE_RANGE).tag(sync=True)


    #pos = tl.List([1,2,3]).tag(sync=True)
    pos = tl.Bytes().tag(sync=True)
    
    init = tl.Bool(False).tag(sync=True)
    masses = tl.List([]).tag(sync=True)
    radius = tl.Bytes().tag(sync=True)
    #particle_data = tl.Bytes().tag(sync=True)
    #colors = tl.List([]).tag(sync=True)
    max_instances = tl.Int().tag(sync=True)
    count = tl.Int().tag(sync=True)
    #pos = Array(np.asarray([])).tag(sync=True, **array_binary_serialization)
    
    colors = tl.Bytes().tag(sync=True)
    box = tl.List([]).tag(sync=True)

    fragment_shader = tl.Unicode('').tag(sync=True)

    #bonds = 

    #colorscheme
    additive = tl.Bool(False).tag(sync=True)

    bg_color = tl.List([]).tag(sync=True)
    
    def __init__(self, b, additive = False, bg_color = [1.0, 1.0, 1.0], radius = None):
        
        super().__init__() # execute init of parent class, append:
        
        # set particle data
        # [position (3 elements) , color (3 elements), radius (1 element)]
        #self.particle_data_array = np.zeros((b.n_bubbles,  7), dtype = np.float32)
        #self.particle_data_array[:,:3] = b.pos.T

        nc = 20
        #self.particle_data_array[:,3:6] = interp1d(np.linspace(0,1,nc), np.random.uniform(0,1,(3, nc)) )(b.masses/b.masses.max()).T
        self.colors = np.array((interp1d(np.linspace(0,1,nc), np.random.uniform(0,1,(3, nc)) )(b.masses/b.masses.max()).T), dtype = np.float32).tobytes()

        if radius is None:
            #self.particle_data_array[:,6] = np.array(get_vwv_radius_from_atomic_number(b.masses), dtype = np.float32) 
            self.radius = np.array(get_vwv_radius_from_atomic_number(b.masses), dtype = np.float32).tobytes()
        else:
            #self.particle_data_array[:,6] = radius
            self.radius = radius

        #self.particle_data = self.particle_data_array.tobytes()




        
        self.max_instances = 2*b.masses.shape[0]
        self.count = b.masses.shape[0]
        self.additive = additive
        self.bg_color = bg_color
        #pos = np.zeros((b.pos.shape[1],3), dtype = float)
        #pos[:, :b.pos.shape[0]] = b.pos.T
        self.pos = b.pos.T.tobytes()
        #self.radius = radius
        
        self.box = b.size.tolist()
        self.masses = b.masses.tolist()

        self.init = True #trigger frontend init
        
        
        
        

        
    def add_particle(self, position = np.array([0,0,0]), color = np.array([0,0,0]), radius = 1.0):
        self.particle_data_array = np.concatenate( (self.particle_data_array, np.array([position[0], position[1], position[2], color[1], color[2], color[3], radius]).reshape(1,7)), axis = 0)
        self.particle_data = self.particle_data_array.tobytes()

    def remove_particles(self, i):
        indx = np.ones(self.particle_data_array.shape[0], dtype = bool)
        indx[i] = False

        self.particle_data_array = self.particle_data_array[indx]
        self.particle_data = self.particle_data_array.tobytes()
        

        

    def save(self, filename, title = ""):
        """
        Save a standalone html embedding of the view
        """
        embed.embed_minimal_html(filename, [self], title)


