<img src="graphics/evince_logo.png" width ="200px">

## EVINCE 

## Quick example usage

```import evince as ev
import numpy as np

m = ev.models.molecule()

charges = [1,1,8]
positions = np.random.uniform(-1,1,(3,3))

atoms = np.zeros((3,4))
atoms[:,0] = charges
atoms[:,1:] = positions

m.add_atoms(atoms)

m.render()```
