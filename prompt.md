here is a quite rough explanation to build a react app, that i will later give to an agentig coding agent. (AI). please refine and structure the requirements and make it so that the agent then brings a greate state of the art app alive. please also make sure that the whole image processing pipeline is functional. we will later not only use the functions in the browser but will also make it for node. therefore for now make it in the browser but all funcitonal, so that we can easily later replace the calls for the canvas with an other interface. here the notes to refine:

create a react app with a vite setup. 

we want a image-processing app. the workflow is as follows:

- drop an image file into the app
- configure the amout of seed points to be generated on the image this value is not dependant on the image size but is an absolute value per normalized area. so the widht to height equals a area and this area is then used to calculate the number of seed points to be generated. so when i have two times a image with the same ratio but one is 1000x1000 and the other is 2000x2000 then both images will have the same amount of seed points generated on them. but i can adjust the amount of seed points per normalized area. so if i set it to 10 seed points per normalized area then both images will have 10 seed points generated on them. if i set it to 20 seed points per normalized area then both images will have 20 seed points generated on them.
- the seed points have a x, y between 0 and 1 which is then multiplied with the width and height of the image to get the actual position of the seed point on the image.
- the seed points are then used to generate a voronoi diagram on the image. this results in a partitioning of the image into regions, where each region corresponds to a seed point.
- the seed points are then used to read in the underlying image data and calculate the average color of each region or seed (configurable via toggle). 
- then the cell is filled in color of the average color of the region or the seed point color (configurable via toggle).
- the app should have a toggle to switch between showing the seed points or not.
- the app should have a toggle to switch between showing the voronoi diagram or not.
- the app should have a toggle to switch between showing the average color of the region or the seed point color.
- the app should have a toggle to switch between showing the original image 
- the colors for the rendering of the voronoi diagram should in a global config-variable. also the line-size (in fraction of the image size). also the seed point size (in fraction of the image size) should be in a global config-variable. also the clour of the seed points should be in a global config-variable.




The app should have a drag and drop zone to upload a image file. this image file then gets rendered to the canvas. the canvas is then having the proportion of the ratio of the image but scaled to fit the view. on the right there is then a configuration panel with options to adjust the image processing. 


* UI uses **Radix primitives components**, but **NO bootstrap**. Implement styling with **BEM CSS classes** in dedicated CSS files (e.g. `styles/components/button.css` containing `.button`, `.button--primary`, etc.).


## CSS requirement (BEM, no bootstrap)

* Create `/components/$comonentname/` with component CSS files and tsx files in one folder.

  * `button.css` defines `.button`, modifiers, sizes
  * `table.css`, `modal.css`, etc.
* Use semantic BEM naming: `.table`, `.table__row`, `.table__cell`, `.table__cell--editable`, etc.
* UI components should apply these classes; do not use utility classes or bootstrap.