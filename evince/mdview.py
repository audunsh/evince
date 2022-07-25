import ipywidgets as widgets
from traitlets import Unicode, validate
import traitlets as tl
from IPython.display import Javascript

from scipy.interpolate import interp1d

import numpy as np





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
    _view_module_version = Unicode('^0.2.0').tag(sync=True)

    # Version of the front-end module containing widget model
    _model_module_version = Unicode('^0.2.0').tag(sync=True)


    pos = tl.List([1,2,3]).tag(sync=True)
    init = tl.Bool(False).tag(sync=True)
    masses = tl.List([]).tag(sync=True)
    colors = tl.List([]).tag(sync=True)
    box = tl.List([]).tag(sync=True)
    
    def __init__(self, b):
        
        super().__init__() # execute init of parent class, append:
        pos = np.zeros((b.pos.shape[1],3), dtype = float)
        pos[:, :b.pos.shape[0]] = b.pos.T
        self.pos = pos.tolist()
        self.box = b.size.tolist()
        self.masses = b.masses.tolist()
        self.init = True #trigger frontend init
        nc = 20
        self.colors = np.array((interp1d(np.linspace(0,1,nc), np.random.uniform(0,1,(3, nc)) )(b.masses/b.masses.max()).T), dtype = float).tolist()

