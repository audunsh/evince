# Customization

This is i brief guide on how to customize Evince for you own needs. Just a quick note on the workflow:

After having installed the required software for developement, you should install and test Evince. Run some of the example notebooks provided on these pages with either BraketLab or BubbleBox. Verify that you can display the graphics using the development installation. When this works, you are ready to start customizing.

Useful resources for this work:
- https://ipywidgets.readthedocs.io/en/stable/
- https://github.com/jupyter-widgets/widget-cookiecutter
- https://threejs.org/
- https://webgl-shaders.com/
- https://www.shadertoy.com/

# The Javascript console

For debugging, you'll find your browser's <a href="https://www.google.com/search?q=javascript+console+how+to+open&sxsrf=ALiCzsYMT3ArYBySjmi2pk9ls6X40BoG6g%3A1662410116475&ei=hF0WY7bIHO-trgTUkoeIAg&oq=javascript+console+how+to+&gs_lcp=Cgdnd3Mtd2l6EAMYADIGCAAQHhAWMgYIABAeEBYyBggAEB4QFjIGCAAQHhAWMgYIABAeEBYyBggAEB4QFjIGCAAQHhAWMgYIABAeEBYyBggAEB4QFjIGCAAQHhAWOgoIABBHENYEELADOgcIABCwAxBDOgQIABBDOgUIABDLAToFCAAQgAQ6BQgAEIYDOggIABAeEA8QFkoFCDwSATFKBAhBGABKBAhGGABQXljlB2C6EmgBcAB4AIABWYgBxQSSAQE4mAEAoAEByAEKwAEB&sclient=gws-wiz">Javascript-console</a> useful. Open it when you try out your code.

# Make your own branch 

```git branch [my extension]```

# Name your extension and set up the files

Naming your extension [my extension], you will mainly write your custom functinality in two new files:
1. evince/[my extension].py
2. js/lib/[my extension].js

To get started, copy the ```evince/templateview.py``` and ```js/lib/templateview.js``` to the corresponding new file names. Thereafter, include them in you package by editing the following files accordingly:

1. evince/__init__.py
2. js/lib/index.js

(It should be clear from the files how you add your custom extension)

# Determine the communications required

The python class in ```evince/[my extension].py``` will need to have traitlets defined, which synchronizes data from the Python-kernel to the Javascript front-end. Changing of these tratilets may upon request trigger functions on the front-end to execute. Add you desired traitlets to the Python-class, and access them using the ´´´this.model.get("[traitlet name]")```-method from the Javascript side.

# How to publish?

We'll follow the typical Git-workflow: make a merge request or contact <a href="audunsh4@gmail.com">Audun Skau Hansen</a>.