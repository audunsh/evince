import ipywidgets as widgets
from traitlets import Unicode, validate
import traitlets as tl
from IPython.display import Javascript

from scipy.interpolate import interp1d

import numpy as np





class MDView(widgets.DOMWidget):
    _view_name = Unicode('MDView').tag(sync=True)
    _view_module = Unicode('mdview').tag(sync=True)
    _view_module_version = Unicode('0.0.0').tag(sync=True)
    pos = tl.List([1,2,3]).tag(sync=True)
    init = tl.Bool(False).tag(sync=True)
    masses = tl.List([]).tag(sync=True)
    colors = tl.List([]).tag(sync=True)
    box = tl.List([]).tag(sync=True)
    
    def __init__(self, b):
        
        super().__init__() # execute init of parent class, append:
        self.pos = b.pos.T.tolist()
        self.box = b.size.tolist()
        self.masses = b.masses.tolist()
        self.init = True #trigger frontend init
        nc = 20
        self.colors = np.array((interp1d(np.linspace(0,1,nc), np.random.randint(0,255,(3, nc)) )(b.masses/b.masses.max()).T), dtype = int).tolist()

