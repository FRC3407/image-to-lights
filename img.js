function getImgData(canvas, brightness = 0.05) {
    try {
        const ctx = canvas.getContext('2d');
        if (!ctx) console.error('No CTX???');

        const width = canvas.width;
        const height = canvas.height;
        
        

        const pixel_data = ctx.getImageData(0, 0, width, height).data;

        const new_pixel_data = [];
        for (let i = 0; i < height; i++) {
            const row = [];
            const slice = pixel_data.slice(i*4*width, (i+1)*4*width);
            for (let j = 0; j < width; j++) {
                const [ r, g, b, a ] = slice.slice(j*4, (j+1)*4);
                row.push({ r, g, b, a });
            }
            new_pixel_data.push(row);
        }

        
        const pixel_data_three = [];
        const colorlist = [];
        // goes through rows first starting at the top and working down? yes
        for (const row of new_pixel_data) {
            const arr = [];
            // Pixel in selected row. Goes from left to right? yes
            for (const pixel of row) {
                console.log(pixel);
                const npx = alphaToRGB(pixel, brightness);
                const colorcompare = color => color.r === npx.r && color.g === npx.g && color.b === npx.b;
                if (!colorlist.find(colorcompare)) {
                    arr.push(colorlist.length);
                    colorlist.push(npx);
                }
                else {
                    arr.push(colorlist.findIndex(colorcompare));
                }
            }
            pixel_data_three.push(arr);
        }
        
        console.log(pixel_data_three, colorlist);
        return { pixelData: pixel_data_three, colorList: colorlist };
        
    }
    catch (err) {
        alert('Something gone wrong in imgdata getting');
        console.error(err);
        return;
    }
}

// applies the alpha (brightness) to the colors to take in RGBA and output an RGB value.
function alphaToRGB(color, brightness) {
    const a = (color.a ?? 255) / 255;
    const r = Math.round(color.r * a * brightness);
    const g = Math.round(color.g * a * brightness);
    const b = Math.round(color.b * a * brightness);
    return { r, g, b };
}

// Generates the code that puts the image onto the lights
function generate_py_code(pixeldata, colorlist, boardinput = 'GP15') {
    // MAKE SAFE CODE FOR BOARD INPUT HERE

    const pixelDataStr = JSON.stringify(pixeldata);
    const colorListStr = '[' + colorlist.map(clr => `(${clr.r}, ${clr.g}, ${clr.b})`).join(', ') + ']';

// When defining the pixel variable, you say the width and height should be 8. 
// We should replace those with the width and height variables that we made earlier 
// so that this can scale more easily to different sized pixelstrips.
    return `import pixelstrip
import board

imgdata = ${pixelDataStr}
colorlist = ${colorListStr}

pixel = pixelstrip.PixelStrip(board.${boardinput}, width=len(imgdata[0]), height=len(imgdata), bpp=4, pixel_order=pixelstrip.GRB, 
                        options={pixelstrip.MATRIX_COLUMN_MAJOR, pixelstrip.MATRIX_ZIGZAG})

pixel.timeout = 0.0

pixel.clear()
for i in range(len(imgdata)):
    for j in range(len(imgdata)):
        pixel[i, len(imgdata)-1-j] = colorlist[imgdata[i][j]]
pixel.show()
`;
}

function loadFromCanvas() {
    const { pixelData, colorList } = getImgData(document.querySelector('canvas#kansas'), 0.05);

    const pycode = generate_py_code(pixelData, colorList, 'GP15');
    document.getElementById('pycode').innerHTML = pycode;
    return pycode;
}