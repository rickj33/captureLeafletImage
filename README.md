# captureLeafletImage
A utility to capture an image file from a leaflet map which contains svg images.

Uses a cloned version of canvg (https://github.com/rickj33/canvg) to fix some memory leaks and added support for the transform to be defined in a style property instead of an svg attribute.

#Known Issues
 When animation is enabled, and the map is zoomed in/out or panned, then when I captured the image, the svg markers were not in the correct position (https://github.com/Leaflet/Leaflet/issues/3313) . I did run across this article that may be related to the positioning (https://blog.sumbera.com/2015/08/14/svg-fast-scaled-overlay-on-leaflet-1-0/). 

#Example
To see an example, clone the repo, then run npm install to install the dependencies.
The example page is testimage.html













