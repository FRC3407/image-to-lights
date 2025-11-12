# Image Loader for Lights
## Quickly and easily load custom images and gifs onto the pixelstrip lights!
Made by Einar S. and Rohan V-F.
For FRC Team 3407 Wild Cards.

### Note:
This repository is a fork of QuantumKya/lights-img-loader, which is no longer being used for anything! 

## How To Use
Make a pixel art image or gif the same size as the pixelstrip that you're going to use. When running, input the following as prompted:
- the path to the image/gif
- the path to the Raspberry Pi's `main.py` file
- and the duration of each frame (gif only). Finally, watch your custom image load onto the pixelstrip!

## How It Works (Extremely simplified)
First, it scans through all the frames or the image and saves every unique color to the colorlist. It aslo collects data on every pixel (in every frame). Then, it writes and runs the code that makes the pixelstrip show your image/gif using the data that it collected earlier. We also utilize very poorly named variables that make the code impossible to read. Good luck!

P.S. There are good comments in the code, don't worry 😅












### NOTE: BEWARE 2 0 5 3 1 4
