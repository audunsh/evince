import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()


setuptools.setup(
     name='Evince',  
     version='0.9',
     author="Audun Skau Hansen",
     author_email="a.s.hansen@kjemi.uio.no",
     description="Visualization tools for computational chemistry",
     long_description=long_description,
   long_description_content_type="text/markdown",
     url="https://github.uio.no/audunsh/evince",
     packages=setuptools.find_packages(),
     classifiers=[
         "Programming Language :: Python :: 3",
         "License :: OSI Approved :: MIT License",
         "Operating System :: OS Independent",
     ],
     install_requires = ["braketlab", "pythreejs"],
 )
