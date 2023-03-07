import ipywidgets as widgets
from ipywidgets import embed
from traitlets import Unicode, validate, observe
import traitlets as tl
from IPython.display import Javascript
from ._version import NPM_PACKAGE_RANGE

from scipy.interpolate import interp1d

import numpy as np

from scipy.interpolate import interp1d


def extract_bonds(b, btype = 2):
    """
    Extract harmonic oscillator interactions (btype == 2) from 
    a bubblebbox.mdbox object

    returns a bonds-list for spotlightviewer
    """
    bonds = []
    for i in range(b.n_bubbles):
        for j in range(i+1, b.n_bubbles):
            if b.interactions[i,j,0] == 2.0:
                #print("Harmonmic", i,j)
                bonds.append([i,j])
                
    return bonds

def colorscheme(masses):
    """
    Default CPK-colorscheme for atoms
    source: https://sciencenotes.org/molecule-atom-colors-cpk-colors/
    """
    colors = np.array([[255, 217, 204, 194, 255, 144,  48, 255, 144, 179, 171, 138, 191,
        240, 255, 255,  31, 128, 143,  61, 230, 191, 166, 138, 156, 224,
        240,  80, 200, 125, 194, 102, 189, 255, 166,  92, 112,   0, 148,
        148, 115,  84,  59,  36,  10,   0, 192, 255, 166, 102, 158, 212,
        148,  66,  87,   0, 112, 255, 217, 199, 163, 143,  97,  69,  48,
         31,   0,   0,   0,   0,   0,  77,  77,  33,  38,  38,  23, 208,
        255, 184, 166,  87, 158, 171, 117,  66,  66,   0, 112,   0,   0,
          0,   0,   0,  84, 120, 138, 161, 179, 179, 179, 189, 199, 204,
        209, 217, 224, 230, 235],
       [255, 255, 128, 255, 181, 144,  80,  13, 224, 227,  92, 255, 166,
        200, 128, 255, 240, 209,  64, 255, 230, 194, 166, 153, 122, 102,
        144, 208, 128, 128, 143, 143, 128, 161,  41, 184,  46, 255, 255,
        224, 194, 181, 158, 143, 125, 105, 192, 217, 117, 128,  99, 122,
          0, 158,  23, 201, 212, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 230, 212, 191, 171, 194, 166, 148, 125, 102,  84, 208,
        209, 184,  84,  89,  79,  92,  79, 130,   0, 125, 171, 186, 161,
        143, 128, 107,  92,  92,  79,  54,  31,  31,  13,  13,   0,   0,
          0,   0,   0,   0,   0],
       [255, 255, 255,   0, 181, 144, 248,  13,  80, 245, 242,   0, 166,
        160,   0,  48,  31, 227, 212,   0, 230, 199, 171, 199, 199,  51,
        160,  80,  51, 176, 143, 143, 227,   0,  41, 209, 176,   0, 255,
        224, 201, 181, 158, 143, 140, 133, 192, 143, 115, 128, 181,   0,
        148, 176, 143,   0, 255, 199, 199, 199, 199, 199, 199, 199, 199,
        199, 156, 117,  82,  56,  36, 255, 255, 214, 171, 150, 135, 224,
         35, 208,  77,  97, 181,   0,  69, 150, 102,   0, 250, 255, 255,
        255, 255, 255, 242, 227, 227, 212, 212, 186, 166, 135, 102,  89,
         79,  69,  56,  46,  38]])/510.0


    return interp1d(np.arange(1,colors.shape[1]+1), colors,bounds_error=False,fill_value = [1.0,1.0,1.0])(masses)

def get_vwv_radius_from_atomic_number(masses):
    # in angstrom
    vwv_radii = np.array([120,140,182,153,192,170,155,152,147,154,227,173,184,210,180,180,175,188,275,231,211])*0.01
    return interp1d(np.arange(1,vwv_radii.shape[0]+1), vwv_radii, bounds_error=False, fill_value=1)(masses)


@widgets.register
class FashionView(widgets.DOMWidget):
    # Name of the widget view class in front-end
    _view_name = Unicode('FashionView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = Unicode('FashionModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = Unicode('evince').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = Unicode('evince').tag(sync=True)


    # Version of the front-end module containing widget view
    _view_module_version = Unicode(NPM_PACKAGE_RANGE).tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = Unicode(NPM_PACKAGE_RANGE).tag(sync=True)


    # atom variables to sync with front-end
    pos = tl.List([[0,0,0]]).tag(sync=True) # positions of atoms
    radius = tl.List([]).tag(sync=True)     # radius of spheres
    count = tl.Int().tag(sync=True)         # the number of atoms
    init = tl.Bool(False).tag(sync=True)    # trigger for initialization
    masses = tl.List([]).tag(sync=True)     # masses for atoms (only used to get vdw-radius)
    colors = tl.List([]).tag(sync=True)     # colors of atoms
    box = tl.List([]).tag(sync=True)        # optional box 
    bonds = tl.List([]).tag(sync=True)
    

    """
    Various post-processing effects

    sao - Screen space ambient occlusion
    source  : https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/SAOPass.js
    overview: https://people.mpi-inf.mpg.de/~ritschel/SSDO/index.html

    dof - depth of field
    source  : https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/BokehPass.js
    overview: https://people.mpi-inf.mpg.de/~ritschel/SSDO/index.html

    fxaa - fast approximate anti-aliasing
    source   - https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/FXAAShader.js
    overview - 10.1109/ICCRD54409.2022.9730249
    """

    # fxaa settings
    fxaa = tl.Bool(False).tag(sync=True)

    # camera / dof settings
    dof = tl.Bool(False).tag(sync=True)
    focus = tl.Float().tag(sync=True)
    aperture = tl.Float().tag(sync=True)
    max_blur = tl.Float().tag(sync=True)

    # sao settings
    sao = tl.Bool(False).tag(sync=True)
    saoScale = tl.Float().tag(sync=True)
    saoBias = tl.Float().tag(sync=True)
    saoIntensity = tl.Float().tag(sync=True)
    saoKernelRadius = tl.Int().tag(sync=True)
    saoMinResolution = tl.Float().tag(sync=True)
    saoBlur = tl.Bool(False).tag(sync=True)
    saoBlurRadius = tl.Int().tag(sync=True)
    saoBlurStdDev = tl.Float().tag(sync=True)
    saoBlurDepthCutoff = tl.Float().tag(sync=True)

    # colorscheme for orbital visualization
    additive = tl.Bool(False).tag(sync=True)

    # general settings
    bg_color = tl.List([]).tag(sync=True) #background color
    
    
    # two way kernel-frontend communcation
    options = tl.List([]).tag(sync=True)

    kernel_task = tl.Int().tag(sync=True)

    synchronized_text = tl.Unicode('Options').tag(sync=True)

    trigger_advance = tl.Bool(False).tag(sync=True)

    add_new_atom = tl.List([]).tag(sync=True)

    window_scale_height = tl.Float().tag(sync=True)
    window_scale_width = tl.Float().tag(sync=True)

    selection = tl.List([]).tag(sync=True)

    
    
    def __init__(self, molecular_system, window_scale_height = 0.5, window_scale_width=0.75, fxaa = True, sao  =False, dof = False, additive = False, bg_color = [1.0, 1.0, 1.0], focus = 10, aperture = 0.001, max_blur = 0.01, bonds = [], saoScale = 100 ,saoBias = .1,saoIntensity = .1,saoKernelRadius = 10,saoMinResolution = .5,saoBlur = False,saoBlurRadius = 50,saoBlurStdDev = 1.0,saoBlurDepthCutoff = 0.05, realism = False, radius_scale = 1.0, options  = []):
        super().__init__() # execute init of parent class, append: 
        
        # general settings
        self.window_scale_height = window_scale_height
        self.window_scale_width = window_scale_width
        self.molecular_system = molecular_system
        self.options = options

        # enable/disable sao + settings
        self.sao = sao
        self.saoScale = saoScale
        self.saoBias = saoBias
        self.saoIntensity = saoIntensity
        self.saoKernelRadius = saoKernelRadius
        self.saoMinResolution = saoMinResolution
        self.saoBlur = saoBlur
        self.saoBlurRadius = saoBlurRadius
        self.saoBlurStdDev = saoBlurStdDev
        self.saoBlurDepthCutoff = saoBlurDepthCutoff

        #enable / disable fxaa 
        self.fxaa = fxaa

        # enable / disable dof
        self.dof = dof 
        self.focus = focus
        self.aperture = aperture
        self.max_blur = max_blur
        
        # color settings
        self.additive = additive
        self.bg_color = bg_color

        # access system data from 
        self.pos = molecular_system.pos #.tolist()
        self.count = molecular_system.n_particles
        self.bonds = molecular_system.bonds
        self.box = molecular_system.size.tolist()
        nc = 20
        self.radius = [1.0 for i in range(molecular_system.n_particles)]
        self.colors = np.array((interp1d(np.linspace(0,1,nc), np.random.uniform(0,1,(3, nc)) )(molecular_system.masses/molecular_system.masses.max()).T), dtype = float).tolist()
        if realism:
            self.radius = (radius_scale*get_vwv_radius_from_atomic_number(molecular_system.masses)).tolist()
            self.colors = colorscheme(molecular_system.masses).T.tolist()

        self.masses = molecular_system.masses.tolist()
        self.init = True #trigger frontend init


    # functions synchronized with the frontend widget

    @observe('kernel_task')
    def _observe_kernel_task(self, change):
        # execute this command when triggered from front-end
        # 'change' contains the list of selected atoms
        self.b.execute_kernel(change)

    @observe('selection')
    def _execute_kernel(self, change):
        self.selection = change

    @observe('add_new_atom')
    def _observe_add_new_atom(self, change):
        self.new_atom_observed = True

    @observe('trigger_advance')
    def _observe_trigger_advance(self, change):
        pass

    def save(self, filename, title = ""):
        """
        Save a standalone html embedding of the view
        """
        embed.embed_minimal_html(filename, [self], title)
        

        



