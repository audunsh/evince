import ipywidgets as widgets
from traitlets import Unicode, validate
import traitlets as tl
from IPython.display import Javascript

from scipy.interpolate import interp1d

import numpy as np





class LatticeView(widgets.DOMWidget):
    _view_name = Unicode('LatticeView').tag(sync=True)
    _view_module = Unicode('latticeview').tag(sync=True)
    _view_module_version = Unicode('0.0.0').tag(sync=True)
    pos = tl.List([1,2,3]).tag(sync=True)
    init = tl.Bool(False).tag(sync=True)
    masses = tl.List([]).tag(sync=True)
    colors = tl.List([]).tag(sync=True)
    color = tl.List([]).tag(sync=True)
    lattice = tl.List([]).tag(sync=True)
    state = tl.List([]).tag(sync=True)
    box = tl.List([]).tag(sync=True)
    opacities = tl.List([]).tag(sync=True)
    
    def __init__(self, b):
        
        
        super().__init__() # execute init of parent class, append:
        self.state = b.lattice.ravel().tolist()
        self.pos = b.pos.T.tolist()
        self.box = b.size.tolist()
        self.masses = b.masses.tolist()
        nc = max(b.lattice.max(), 10)

        #self.colors = np.array((interp1d(np.linspace(0,1,nc), np.random.randint(0,255,(3, nc)) )(np.arange(b.lattice.max())/b.lattice.max())), dtype = int).tolist()

        #colors = np.random.randint(0,100, (3, nc))
        colors = np.random.uniform(0,1, (3, nc))
        self.colors = np.array(colors, dtype = np.float16).tolist()
        
        opacities = np.ones(nc)
        opacities[0] = 0
        self.opacities = opacities.tolist()
        #print(interp1d(np.linspace(0,1,nc), np.random.randint(0,255,(3, nc)) )(b.lattice/b.lattice.max()).shape)
        
        self.init = True #trigger frontend init