import ipywidgets as widgets
from traitlets import Unicode, validate
import traitlets as tl
from IPython.display import Javascript
from ._version import NPM_PACKAGE_RANGE

from scipy.interpolate import interp1d

from ipywidgets import embed



import sympy as sp
import numpy as np



def get_r2(p):
    r_it = list(p.ket_sympy_expression.free_symbols)
    r2 = 0
    for i in r_it:
        r2 += i**2.0
    return r2


def generate_webgl_shader(ket_instance, time_dependent = False, blender = "    gl_FragColor = gl_FragColor + vec4(csR, csI, -1.0*csR, .1)", squared = False):
    """
    Generate code for Evince/BraketView WebGL shader
    """
    shader_code = ket_instance.get_ccode()
    
    fragment_shader = """uniform vec3 user_color;
uniform float time;

varying vec2 vUv;
varying vec3 pos;
varying vec3 tex;
varying float q;
varying float csI;
varying float csR;
"""
    for i in range(len(shader_code)):
        fragment_shader += "varying float cs%i;\n" %i
    
    
    fragment_shader += """varying float cs;

void main() {

    vec2 p = vUv;
    float q = """
    
    #dimensionality
    nd = len(ket_instance.ket_sympy_expression.free_symbols)

    for i in range(nd):
        fragment_shader += "tex[%i]*tex[%i] +" %(i, i)
        
    fragment_shader = fragment_shader[:-1] + ";\n"
    
    for i in range(len(shader_code)):
        fragment_shader += "    float cs%i = %s;\n" %(i, shader_code[i])
    
    if time_dependent:
        csI = "float csI ="
        csR = "float csR ="
        for i in range(len(shader_code)):
            csI += " -1.0*cs%i*sin(%f*time) +" %(i, ket_instance.energy[i])
            csR += " cs%i*cos(%f*time) +" %(i, ket_instance.energy[i])
            
        csI = csI[:-1] + ";\n"
        csR = csR[:-1] + ";\n"
   
    else:
        csI = "float csI = 0.0 +" 
        csR = "float csR ="
        for i in range(len(shader_code)):
            
            csR += " cs%i +" %(i)
            
        csI = csI[:-1] + ";\n"
        csR = csR[:-1] + ";\n"
        
        
    fragment_shader += "    %s" % csI
    fragment_shader += "    %s" % csR
    
    if squared:
        fragment_shader += "    csR = pow(csR, 2.0) + pow(csI, 2.0);\n"
        fragment_shader += "    csI = 0.0;\n"
    
    
    
        
    ## account for varying dimensionality here
    if nd ==1:
        if blender is None:
            blender = "    gl_FragColor = gl_FragColor + vec4(csR, csI, -1.0*csR, 1)"
        fragment_shader += """    csR = smoothstep(0.9*tex[1], tex[1], csR);\n"""
        fragment_shader += """    csI = smoothstep(0.9*tex[1], tex[1], csI);\n"""
        fragment_shader += """%s;
}""" % blender
    if nd ==2:
        if blender is None:
            blender = "    gl_FragColor = gl_FragColor + vec4(csR, csI, -1.0*csR, 1)"
        fragment_shader += """%s;
}""" % blender
        #fragment_shader += """    gl_FragColor = gl_FragColor + vec4(csR, csI, -1.0*csR, 1.0);
#}"""
    
    if nd >= 3:
        if blender is None:
            blender = "    gl_FragColor = gl_FragColor + vec4(csR, csI, -1.0*csR, .1)"
        fragment_shader += """%s;
}""" % blender
#        fragment_shader += """    gl_FragColor = gl_FragColor + vec4(csR + .06*csI, csR + .1*csI, .7*csR + .5*csI, 0.1);
#}"""
    
    
    return fragment_shader, nd

@widgets.register
class BraketView(widgets.DOMWidget):
    # Name of the widget view class in front-end
    _view_name = Unicode('BraketView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = Unicode('BraketModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = Unicode('evince').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = Unicode('evince').tag(sync=True)

    # Version of the front-end module containing widget view
    #_view_module_version = Unicode('^0.30.0').tag(sync=True)

    # Version of the front-end module containing widget model
    #_model_module_version = Unicode('^0.30.0').tag(sync=True)

    # Version of the front-end module containing widget view
    _view_module_version = Unicode(NPM_PACKAGE_RANGE).tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = Unicode(NPM_PACKAGE_RANGE).tag(sync=True)
    
    



    surf = tl.List([]).tag(sync=True)
    pos = tl.List([]).tag(sync=True)
    fragment_shader = tl.Unicode('').tag(sync=True)
    ao = tl.List([]).tag(sync=True)
    surface_view = tl.Bool(False).tag(sync=True)

    n_concentric = tl.Int().tag(sync=True)

    
    #colorscheme
    additive = tl.Bool(True).tag(sync=True)
    vr_button = tl.Bool(True).tag(sync=True)

    bg_color = tl.List([]).tag(sync=True)

    def __init__(self, ket_instance, surface_view = False, bg_color = [0.0,0.0,0.0], additive = True, blender = "    glFragColor = glFragColor + vec4(csR, csI, -1.0*csR, .1)", squared = False, n_concentric = 100, vr_button = False):
        

        
        super().__init__() # execute init of parent class, append:
        #self.surf = extract_surface(p)
        self.squared = squared

        self.n_concentric = n_concentric
        
        self.surface_view = surface_view
        self.bg_color = bg_color
        self.additive = additive
        self.vr_button = vr_button
        
        self.blender = blender
        
        self.init = True #trigger frontend init
        
        self.add_ket(ket_instance)

        self.ao = [1]
        
    def add_ket(self, ket_instance, time_dependent = False):
        """
        Initialize ket on scene
        """

        if np.sum(np.array(ket_instance.energy)**2.0)>1e-10:
            time_dependent = True
        self.fragment_shader, self.nd = generate_webgl_shader(ket_instance, time_dependent=time_dependent, blender = self.blender, squared = self.squared)

        if self.nd<3:
            self.surface_view = True

    def save(self, filename, title = ""):
        """
        Save a standalone html embedding of the view
        """
        embed.embed_minimal_html(filename, [self], title)
