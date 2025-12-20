async function convertGif(gif) {
    try {
        
        const frame_data_arr = [];
        // each element is one frame of the gif, in the same format as in img.py.
        const colorlist_arr = [];
        // each element is the list of all distinct colors in the frame image.
        await gifFrames({ url: gif, frames: 'all', cumulative: 'true', outputType: 'canvas' }).then((framedata) => {
            for (const f of framedata.map(frame => frame.getImage())) {
                const { frame_data, colorlist } = getImgData(f, 0.05);
                console.log(frame_data);
                if (!frame_data || !colorlist) {
                    alert("getImgData returned bad");
                    return;
                }
                frame_data_arr.push(frame_data);
                colorlist_arr.push(colorlist);
            }
        });
        
        const true_colorlist = [];
        // will be the array of all distinct colors in the GIF (one list, every frame)
        const color_conversion_map = {};
        // array of tuples, structure is ((frame //, index), color's index in true_colorlist)
        for (const cl in colorlist_arr) {
            for (const col of cl) {
                // if new color, add to true_colorlist and add instruction to color_conversion_map
                if (!true_colorlist.includes(col)) true_colorlist.push(col);
                color_conversion_map[col] = true_colorlist.indexOf(col);
            }
        }
        
        for (let i = 0; i < frame_data_arr.length; i++) {
            for (const r of frame_data_arr[i]) {
                for (const c of r) {
                    const old_color_idx = frame_data_arr[i][r][c];
                    const original_color = colorlist_arr[i][old_color_idx];
                    frame_data_arr[i][r][c] = color_conversion_map[original_color];
                }
            }
        }
        
        
        
        return { frame_data_arr, true_colorlist };
        
    }
    catch (err) {
        alert('Something gone wrong in imgdata getting');
        alert(err.message);
        return;
    }
}

function generateCodeFromGif(framedata, colorlist, animspeed = 0.25, boardinput = 'GP15') {
    // MAKE SAFE CODE FOR BOARD INPUT HERE
    
    return `import pixelstrip
import board
import time

imgdata = ${framedata}
colorlist = ${colorlist}

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


function getCodeFromGif() {
    // abc is the list of data for each frame; xyz is the list of colors
    const { abc, xyz } = convertGif(imgurl);
    
    const code = generateCodeFromGif(abc, xyz, 0.25, 'GP15');
    document.getElementById('pycode').innerHTML = code;
    return code;
}