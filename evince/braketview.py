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


class BraketView(widgets.DOMWidget):
    _view_name = Unicode('BraketView').tag(sync=True)
    _view_module = Unicode('braketview').tag(sync=True)
    _view_module_version = Unicode('0.0.0').tag(sync=True)
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
        
    def add_ket(self, ket_instance):
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
        self.fragment_shader = get_webgl_shader(ket_instance)