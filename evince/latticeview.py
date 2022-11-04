import ipywidgets as widgets
from traitlets import Unicode, validate, observe
import traitlets as tl
from IPython.display import Javascript
from ._version import NPM_PACKAGE_RANGE

import numpy as np

from ipywidgets import embed

@widgets.register
class LatticeView(widgets.DOMWidget):
    # Name of the widget view class in front-end
    _view_name = Unicode('LatticeView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = Unicode('LatticeModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = Unicode('evince').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = Unicode('evince').tag(sync=True)


    # Version of the front-end module containing widget view
    _view_module_version = Unicode(NPM_PACKAGE_RANGE).tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = Unicode(NPM_PACKAGE_RANGE).tag(sync=True)


    pos = tl.List([1,2,3]).tag(sync=True)
    add_molecule = tl.List([]).tag(sync=True)
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


    @observe('add_molecule')
    def _observe_bar(self, change):
        print(change['old'])
        print(change['new'])

    def save(self, filename, title = ""):
        """
        Save a standalone html embedding of the view
        """
        embed.embed_minimal_html(filename, [self], title)