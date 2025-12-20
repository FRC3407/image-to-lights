async function convertGif(gif) {
    try {
        
        const frame_data_arr = [];
        // each element is one frame of the gif.
        const colorlist_arr = [];
        // each element is the list of all distinct colors in the frame image.

        const framedata = await gifFrames({ url: gif, frames: 'all', cumulative: 'true', outputType: 'canvas' });

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
    
    return `import pixelstrip
import board
import time

imgdata = ${framedataStr}
colorlist = ${colorListStr}

pixel = pixelstrip.PixelStrip(board.${boardinput}, width=len(imgdata[0]), height=len(imgdata), bpp=4, pixel_order=pixelstrip.GRB, 
                        options={pixelstrip.MATRIX_COLUMN_MAJOR, pixelstrip.MATRIX_ZIGZAG})

pixel.timeout = 0.0

pixel.clear()

current_frame = 0

while True:
    for i in range(len(imgdata[current_frame])):
        print(imgdata[current_frame])
        for j in range(len(imgdata[current_frame][0])):
            pixel[i, len(imgdata)-j] = colorlist[imgdata[current_frame][i][j]]
    pixel.show()
    time.sleep(${animspeed})
    current_frame += 1
    if current_frame >= len(imgdata): current_frame = 0
`;
}


async function getCodeFromGif(imgurl) {
    convertGif(imgurl)
    .then(res => {
        const code = generateCodeFromGif(res.pixels, res.colors, 0.25, 'GP15');
        document.getElementById('pycode').innerHTML = code;
        return code;
    })
    .catch(err => { alert(err.message); console.error(err); });
}