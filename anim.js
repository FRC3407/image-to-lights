async function convertGif(gif) {
    try {
        
        const frame_data_arr = [];
        // each element is one frame of the gif.
        const colorlist_arr = [];
        // each element is the list of all distinct colors in the frame image.

        const framedata = await gifFrames({ url: gif, frames: 'all', cumulative: 'false', outputType: 'canvas' });

        for (const f of framedata) {
            const cnvs = f.getImage();
            const { pixelData, colorList } = getImgData(cnvs, 0.05);
            console.log(pixelData);
            if (!pixelData || !colorList) {
                alert("getImgData returned bad");
                return;
            }
            frame_data_arr.push(pixelData);
            colorlist_arr.push(colorList);
        }
        
        const true_colorlist = [];
        // will be the array of all distinct colors in the GIF (one list, every frame)
        const color_conversion_map = {}; // key -> index
        const colorKey = c => `${c.r},${c.g},${c.b}`;
        
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
        
        for (let i = 0; i < frame_data_arr.length; i++) {
            const frame = frame_data_arr[i];
            for (let r = 0; r < frame.length; r++) {
                for (let c = 0; c < frame[r].length; c++) {
                    const old_color_idx = frame[r][c];
                    const original_color = colorlist_arr[i][old_color_idx];
                    const k = colorKey(original_color);
                    frame_data_arr[i][r][c] = color_conversion_map[k];
                }
            }
        }
        
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
    
    const nakedcode = `import pixelstrip
import board
import time

imgdata = ${framedataStr}
colorlist = ${colorListStr}

pixel = pixelstrip.PixelStrip(board.${boardinput}, width=len(imgdata[0][0]), height=len(imgdata[0]), bpp=4, pixel_order=pixelstrip.GRB, 
                        options={pixelstrip.MATRIX_COLUMN_MAJOR, pixelstrip.MATRIX_ZIGZAG})

pixel.timeout = 0.0

pixel.clear()

current_frame = 0

while True:
    for i in range(len(imgdata[current_frame])):
        print(imgdata[current_frame])
        for j in range(len(imgdata[current_frame][0])):
            pixel[len(imgdata[0])-1-i, j] = colorlist[imgdata[current_frame][i][j]]
    pixel.show()
    time.sleep(${animspeed})
    current_frame += 1
    if current_frame >= len(imgdata): current_frame = 0
`;

    const classistcode = `import board
import pixelstrip
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
            self.timeout = self.cycle_time
    
    def draw_image(self, matrix, frame):
        matrix.fill(BLACK)
        for i in range(self.width):
            # print(self.imgdata[frame])
            for j in range(self.height):
                matrix[self.height-1-i, j] = self.colorlist[self.imgdata[frame][i][j]]




if __name__ == "__main__": 
    matrix = pixelstrip.PixelStrip(board.${boardinput}, width=${framedata[0][0].length}, height=${framedata[0].length}, bpp=4, pixel_order=pixelstrip.GRB, options={pixelstrip.MATRIX_COLUMN_MAJOR, pixelstrip.MATRIX_ZIGZAG})
    matrix.animation = ImageAnimation(${animspeed})
    while True:
        matrix.draw()`;
    
    return (document.querySelector('input#animationclass').checked ? classistcode : nakedcode);
}


async function getCodeFromGif(imgurl) {
    convertGif(imgurl)
    .then(res => {
        const code = generateCodeFromGif(res.pixels, res.colors);
        document.getElementById('pycode').innerHTML = code;
        return code;
    })
    .catch(err => { alert(err.message); console.error(err); });
}
