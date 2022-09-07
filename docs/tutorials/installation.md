# User installation

If you would just like to try out Evince and supported software, the installation is simple. You'll need to install
1) <a href="https://www.python.org/downloads/">Python 3.0</a>
2) From your command line, type ```pip3 install braketlab bubblebox evince``` for the latest release.

You are now ready to execute the examples presented on these pages.

# Development installation

In order to contribute to the Evince project, you'll have to install
1) <a href="https://github.com/git-guides/install-git">Git</a> 
2) <a href="https://www.python.org/downloads/">Python 3.0</a>
3) <a href="https://nodejs.org/en/download/">Node.JS</a>
4) <a href="https://classic.yarnpkg.com/">Yarn</a>

In addition, you may need a range of PyPI and NPM packages, but Evince will likely install these for you. Next, do

    $ git clone https://github.com//evince.git
    $ cd evince
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix evince
    $ jupyter nbextension enable --py --sys-prefix evince

When actively developing your extension for JupyterLab, run the command:

    $ jupyter labextension develop --overwrite evince

Then you need to rebuild the JS when you make a code change:

    $ cd js
    $ yarn run build

You then need to refresh the JupyterLab page when your javascript changes.

# Complications

Please send an e-mail to a.s.hansen@kjemi.uio.no.
