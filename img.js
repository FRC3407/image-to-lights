function getImgData(canvas, brightness = 1) {
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
        
        let exp = 1.8
        for (let i = 0;i<colorlist.length;i++){
            colorlist[i].r = Math.floor(13*((colorlist[i].r/13)**exp))
            colorlist[i].g = Math.floor(13*((colorlist[i].g/13)**exp))
            colorlist[i].b = Math.floor(13*((colorlist[i].b/13)**exp))
        }

        console.log(pixel_data_three, colorlist);
        return { pixels: pixel_data_three, colors: colorlist };
        
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

function loadFromCanvas() {
    const { pixelData, colorList } = getImgData(document.querySelector('canvas#kansas'));

    const pycode = generate_py_code(pixelData, colorList, 'GP15');
    document.getElementById('pycode').innerHTML = pycode;
    return pycode;
}