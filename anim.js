async function convertGif(gif) {
    try {
        
        const frame_data_arr = [];
        // each element is one frame of the gif.
        const colorlist_arr = [];
        // each element is the list of all distinct colors in the corresponding frame image.

        const framedata = await gifFrames({ url: gif, frames: 'all', cumulative: 'false', outputType: 'canvas' });

        // ==================================== GET FRAME IMAGES ==================================== //
        for (const f of framedata) {
            const cnvs = f.getImage();
            const { pixels, colors } = getImgData(cnvs, 0.05);
            console.log(pixels);
            if (!pixels || !colors) {
                alert("getImgData returned bad");
                return;
            }
            frame_data_arr.push(pixels);
            colorlist_arr.push(colors);
        }
        
        const true_colorlist = [];
        // will be the array of all distinct colors in the GIF (one list, every frame)
        const color_conversion_map = {}; // key -> index
        const colorKey = c => `${c.r},${c.g},${c.b}`;

        // ==================================== COLOR PROCESSING ==================================== //
        for (const cl of colorlist_arr) {
            for (const col of cl) {
                const k = colorKey(col);

                // if new color, add to true_colorlist and add instruction to color_conversion_map
                if (color_conversion_map[k] === undefined) {
                    color_conversion_map[k] = true_colorlist.length;
                    true_colorlist.push(col);
                }
            }
        }

        // ==================================== FRAME PROCESSING ==================================== //
        for (let i = 0; i < frame_data_arr.length; i++) {
            // Iterate through each frame
            const frame = frame_data_arr[i];
            for (let r = 0; r < frame.length; r++) {
                for (let c = 0; c < frame[r].length; c++) {
                    // Iterate through rows and columns for pixels (c, r)
                    const old_color_idx = frame[r][c]; // get colorid for corresponding colorlist
                    const original_color = colorlist_arr[i][old_color_idx]; // get that color
                    const k = colorKey(original_color); // encode to color string
                    frame_data_arr[i][r][c] = color_conversion_map[k]; // replace with the index in the comprehensive colormap
                }
            }
        }

        // for (let i = 0;i<true_colorlist.length;i++){
        //     true_colorlist[i].r = Math.floor(13*((true_colorlist[i].r/13)**2))
        //     true_colorlist[i].g = Math.floor(13*((true_colorlist[i].g/13)**2))
        //     true_colorlist[i].b = Math.floor(13*((true_colorlist[i].b/13)**2))
        // }
        
        return { pixels: frame_data_arr, colors: true_colorlist };
        
    }
    catch (err) {
        alert('Something gone wrong in imgdata getting');
        console.error(err);
        return;
    }
}

function generateCodeFromGif(framedata, colorlist, animspeed = 0.25, boardinput = 'GP15') {
    // MAKE SAFE CODE FOR BOARD INPUT HERE

    // serialize framedata as JSON (keeps nested arrays) and format colorlist as Python tuples
    const framedataStr = JSON.stringify(framedata);
    const colorListStr = '[' + colorlist.map(clr => `(${clr.r}, ${clr.g}, ${clr.b})`).join(', ') + ']';
    
    let processingCode = document.getElementById("shaderArea").value
    // alert(processingCode)
    let selfText = document.querySelector('input#animationclass').checked ? "self." : ""
    let preprocessingCode = ""
    let postProcessingCode = "matrix["+selfText+"height-1-i, j] = "+selfText+"colorlist["+selfText+"imgdata[current_frame][i][j]]"
    if (processingCode.trim() != ""){
        postProcessingCode = "matrix["+selfText+"height-1-i, j] = (r,g,b)"
        preprocessingCode =  `p = `+selfText+`colorlist[`+selfText+`imgdata[`+selfText+`current_frame][i][j]]
            r = p[0]
            g = p[1]
            b = p[2]`
        processingCode = processingCode.replaceAll("\n","\n            ")
    }

    const nakedcode = `import pixelstrip
import board
import time
import math

imgdata = ${framedataStr}
colorlist = ${colorListStr}

matrix = pixelstrip.PixelStrip(board.${boardinput}, width=len(imgdata[0][0]), height=len(imgdata[0]), bpp=4, pixel_order=pixelstrip.GRB, 
                        options={pixelstrip.MATRIX_COLUMN_MAJOR, pixelstrip.MATRIX_ZIGZAG}, brightness=0.3)

matrix.timeout = 0.0

matrix.clear()

current_frame = 0
currentTime = 0
height = len(imgdata[0][0])

while True:
    for i in range(len(imgdata[current_frame])):
        #print(imgdata[current_frame])
        for j in range(len(imgdata[current_frame][0])):
            ${preprocessingCode}
            ${processingCode}
            ${postProcessingCode}
    matrix.show()
    time.sleep(${animspeed})
    current_frame += 1
    currentTime += 1
    if current_frame >= len(imgdata): current_frame = 0
`;

    const classistcode = `import board
import pixelstrip
import math
from colors import *


class ImageAnimation(pixelstrip.Animation):

    def __init__(self, cycle_time=0.5):
        pixelstrip.Animation.__init__(self)
        self.cycle_time = cycle_time
        self.current_frame = 0
        self.imgdata = ${framedataStr}
        self.colorlist = ${colorListStr}

        self.frames = len(self.imgdata)
        self.width = len(self.imgdata[0][0])
        self.height = len(self.imgdata[0])
        self.time = 0

    def reset(self, matrix):
        self.timeout = self.cycle_time
        matrix.clear()
        matrix.show()
        self.current_frame = 0

    def draw(self, matrix, delta_time):
        if self.is_timed_out():
            self.draw_image(matrix, self.current_frame)
            self.current_frame = (self.current_frame + 1) % self.frames
            matrix.show()
            self.timeout = 0
            self.time += 1
    
    def draw_image(self, matrix, frame):
        currentTime = self.time
        matrix.fill(BLACK)
        for i in range(self.width):
            # print(self.imgdata[frame])
            for j in range(self.height):
                ${preprocessingCode}
                ${processingCode}
                ${postProcessingCode}

if __name__ == "__main__": 
    matrix = pixelstrip.PixelStrip(board.${boardinput}, width=${framedata[0][0].length}, height=${framedata[0].length}, bpp=4, pixel_order=pixelstrip.GRB, options={pixelstrip.MATRIX_COLUMN_MAJOR, pixelstrip.MATRIX_ZIGZAG})
    matrix.animation = ImageAnimation(${animspeed})
    while True:
        matrix.draw()`;
    
    return (document.querySelector('input#animationclass').checked ? classistcode : nakedcode);
}


async function getCodeFromGif(imgurl,type) {
    let res
    if (type.includes("gif")) res = await convertGif(imgurl)
    else {res = await getImgData(document.querySelector('canvas#kansas'), 0.05); res.pixels = [res.pixels]}
    try{
        const code = generateCodeFromGif(res.pixels, res.colors,0);
        document.getElementById('pycode').innerHTML = code;
        return code;
    }
    catch(err){
        alert(err.stack); console.error(err);
    }
}
