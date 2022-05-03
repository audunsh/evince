<img src="graphics/evince_logo.png" width ="200px">

# EVINCE 

## Install from PyPI

```pip install evince```

## Quick example usage for Notebooks

```import evince as ev
import numpy as np


# instantiate a molecule visualization
m = ev.models.molecule() 

charges = [1,1,8]
positions = np.random.uniform(-1,1,(3,3))

atoms = np.zeros((3,4))
atoms[:,0] = charges
atoms[:,1:] = positions

# add atoms to molecules
m.add_atoms(atoms)


# show visualization
m.render()```
