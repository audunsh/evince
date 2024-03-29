import ipywidgets as widgets
import traitlets as tl
from ipywidgets import embed
from ._version import NPM_PACKAGE_RANGE

# See js/lib/example.js for the frontend counterpart to this file.


@widgets.register
class PointView(widgets.DOMWidget):
    """A template widget for Evince."""

    # Name of the widget view class in front-end
    _view_name = tl.Unicode("PointView").tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = tl.Unicode("PointModel").tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = tl.Unicode("evince").tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = tl.Unicode("evince").tag(sync=True)

    # Version of the front-end module containing widget view
    _view_module_version = tl.Unicode(NPM_PACKAGE_RANGE).tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = tl.Unicode(NPM_PACKAGE_RANGE).tag(sync=True)

    pos = tl.Bytes().tag(sync=True)
    col = tl.Bytes().tag(sync=True)
    background_color = tl.List([]).tag(sync=True)

    # Widget specific property.
    # Widget properties are defined as traitlets. Any property tagged with `sync=True`
    # is automatically synced to the frontend *any* time it changes in Python.
    # It is synced back to Python from the frontend *any* time the model is touched.
    value = tl.Unicode("Hello World!").tag(sync=True)

    def __init__(self, pos, col, background_color=None):
        super().__init__()
        self.pos = pos
        self.col = col
        self.background_color = background_color
        if not background_color:
            self.background_color = [1.0, 1.0, 1.0]


def save(self, filename, title=""):
    """
    Save a standalone html embedding of the view
    """
    embed.embed_minimal_html(filename, [self], title)
