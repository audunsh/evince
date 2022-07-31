evince
===============================

Creating learning experiences in the microscopic realm.

Evince is a visualization module for the <a href="https://hylleraas.readthedocs.io/en/latest/">Hylleraas Software Platform</a>.

Authored by Audun Skau Hansen, summer 2022

Installation
------------

To install use pip:

    $ pip install evince

For a development installation (requires [Node.js](https://nodejs.org) and [Yarn version 1](https://classic.yarnpkg.com/)),

    $ git clone https://github.com/audunsh/evince.git
    $ cd evince
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix evince
    $ jupyter nbextension enable --py --sys-prefix evince

To actively developing Evince for JupyterLab, run the command:

    $ jupyter labextension develop --overwrite evince

Then you need to rebuild the JS when you make a code change:

    $ cd js
    $ yarn run build

You then need to refresh the JupyterLab page when your javascript changes.
