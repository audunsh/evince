import ipywidgets as widgets
import traitlets as tl
from ipywidgets import embed
from ._version import NPM_PACKAGE_RANGE

# See js/lib/example.js for the frontend counterpart to this file.

@widgets.register
class omoviview(widgets.DOMWidget):
    """A Omovi widget for Evince."""

    # Name of the widget view class in front-end
    _view_name = tl.Unicode('OmoviView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = tl.Unicode('OmoviModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = tl.Unicode('evince').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = tl.Unicode('evince').tag(sync=True)

    # Version of the front-end module containing widget view
    _view_module_version = tl.Unicode(NPM_PACKAGE_RANGE).tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = tl.Unicode(NPM_PACKAGE_RANGE).tag(sync=True)

    

    # Widget specific property.
    # Widget properties are defined as traitlets. Any property tagged with `sync=True`
    # is automatically synced to the frontend *any* time it changes in Python.
    # It is synced back to Python from the frontend *any* time the model is touched.
    value = tl.Unicode('Hello World!').tag(sync=True)

def save(self, filename, title = ""):
    """
    Save a standalone html embedding of the view
    """
    embed.embed_minimal_html(filename, [self], title)
    