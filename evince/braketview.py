import ipywidgets as widgets
from traitlets import Unicode, validate
import traitlets as tl
from IPython.display import Javascript

from scipy.interpolate import interp1d

import sympy as sp
import numpy as np



def get_r2(p):
    r_it = list(p.ket_sympy_expression.free_symbols)
    r2 = 0
    for i in r_it:
        r2 += i**2.0
    return r2

def get_webgl_shader(ket_instance):
    simp_p = ket_instance.ket_sympy_expression.subs(get_r2(ket_instance), sp.symbols("q")).simplify().subs(sp.pi, np.pi)
    
    
    
    
    shadercode = sp.ccode(simp_p)

    for i in range(len(ket_instance.ket_sympy_expression.free_symbols)):
        shadercode = shadercode.replace(str(list(ket_instance.ket_sympy_expression.free_symbols)[i]), "tex[%i]" % i)

    #for i in range(3):
    #    shadercode = shadercode.replace("x_{0; %i}" %i, "tex[%i]" % i)

    shadercode = shadercode.replace("M_PI", str(np.pi))
    
    fragment_shader = """uniform vec3 user_color;
uniform float time;

varying vec2 vUv;
varying vec3 pos;
varying vec3 tex;
varying float q;
varying float cs;

void main() {

    vec2 p = vUv;
    float q = tex[0]*tex[0] + tex[1]*tex[1] + tex[2]*tex[2];
    float cs = %s;
     gl_FragColor = gl_FragColor + vec4(cs, 0.01, -1.0*cs, .1);
}""" %shadercode
    
    return fragment_shader


def generate_webgl_shader(ket_instance, time_dependent = False):
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
    
    for i in range(len(ket_instance.ket_sympy_expression.free_symbols)):
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
    
        
    ## account for varying dimensionality here
    
    fragment_shader += """    gl_FragColor = gl_FragColor + vec4(csR, csI, -1.0*csR, .1);
}"""
    
    
    return fragment_shader

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
    _view_module_version = Unicode('^0.2.0').tag(sync=True)

    # Version of the front-end module containing widget model
    _model_module_version = Unicode('^0.2.0').tag(sync=True)

    
    



    surf = tl.List([]).tag(sync=True)
    pos = tl.List([]).tag(sync=True)
    fragment_shader = tl.Unicode('').tag(sync=True)
    ao = tl.List([]).tag(sync=True)
    #init = tl.Bool(False).tag(sync=True)
    #masses = tl.List([]).tag(sync=True)
    #colors = tl.List([]).tag(sync=True)
    #box = tl.List([]).tag(sync=True)
    
    def __init__(self, ket_instance):
        
        
        super().__init__() # execute init of parent class, append:
        #self.surf = extract_surface(p)
        
        
        
        
        self.init = True #trigger frontend init
        self.ao = [1]
        self.add_ket(ket_instance)
        
    def add_ket(self, ket_instance, time_dependent = False):
        """
        Initialize ket on scene
        """
        
        #example time dependent shader included for demonstration/development purposes
        self.fragment_shader = """uniform vec3 user_color;
uniform float time;

varying vec2 vUv;
varying vec3 pos;
varying vec3 tex;
varying float q;
varying float cs;

void main() {

    vec2 p = vUv;
    float q = tex[0]*tex[0] + tex[1]*tex[1] + tex[2]*tex[2];
    float cs = 0.016031349546793448*tex[2]*(pow(tex[0], 2.0) - pow(tex[1], 2.0))*exp(-0.10000000000000001*q);
     gl_FragColor = gl_FragColor + vec4(cs*sin(time), 0.01, -1.0*cs*cos(time), .1);
}"""
        if np.sum(np.array(ket_instance.energy)**2.0)>1e-10:
            time_dependent = True
        self.fragment_shader = generate_webgl_shader(ket_instance, time_dependent=time_dependent)




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

