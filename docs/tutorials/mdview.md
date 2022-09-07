# Interactivity

The MDView-extension is likely the most commincation-intensive functionality in Evince right now. It is written as a live visualization tool for molecular dynamics simulations with <a href="audunsh.github.io/bubblebox">BubbleBox</a>, and will typically update the position of some hundreds of bubbles at every instance.

While it is a bit messy implementationwise, it gives a decent example on how to trigger events on the front-end and how to keep traitlets in sync bewteen the kernel and the front-end.

