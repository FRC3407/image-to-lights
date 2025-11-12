from PIL import Image

# Looks at image and collects its height, width, and pixel data, then fills the colorlist list with all the colors used in the image.
# What do try and except do?
def get_img_data(img, brightness = 0.05):
    try:
        width, height = img.size
        
        pixel_data = list(img.getdata())
        new_pixel_data = [pixel_data[i*width:(i+1)*width] for i in range(height)]
        
        pixel_data_three = []
        colorlist = []
        # goes through rows first starting at the top and working down? yes
        for row in new_pixel_data:
            arr = []
            # Pixel in selected row. Goes from left to right? yes
            for pixel in row:
                npx = alpha_to_rgb(pixel, brightness) if img.mode == 'RGBA' else pixel
                if npx not in colorlist:
                    arr.append(len(colorlist))
                    colorlist.append(npx)
                else:
                    arr.append(colorlist.index(npx))
            pixel_data_three.append(arr)
        
        #print(pixel_data_three, colorlist)
        return pixel_data_three, colorlist
        
    except FileNotFoundError:
        print(f'File not found :(\nXbox controlrer')
        return
    except Exception as e:
        print(f'An error occurred idk what :skull:\nXbox controlrer')
        return


# applies the alpha (brightness) to the colors to take in RGBA and output an RGB value.
def alpha_to_rgb(color, brightness):
    r, g, b, a = color
    r = int((r * a * brightness) // 255)
    g = int((g * a * brightness) // 255)
    b = int((b * a * brightness) // 255)
    return (r, g, b)


# Generates the code that puts the image onto the lights
def generate_py_code(colorids, colorlist, boardinput = 15):
    if boardinput < 0 or boardinput > 28: return
    
    workaround = '{pixelstrip.MATRIX_COLUMN_MAJOR, pixelstrip.MATRIX_ZIGZAG}'
    

# When defining the pixel variable, you say the width and height should be 8. 
# We should replace those with the width and height variables that we made earlier 
# so that this can scale more easily to different sized pixelstrips.
    return f'''import pixelstrip
import board

imgdata = {colorids}
colorlist = {colorlist}

pixel = pixelstrip.PixelStrip(board.GP{boardinput}, width={len(colorids[0][0])}, height={len(colorids[0])}, bpp=4, pixel_order=pixelstrip.GRB, 
                        options={workaround})

pixel.timeout = 0.0

pixel.clear()
for i in range(len(imgdata)):
    for j in range(len(imgdata)):
        pixel[i, 7-j] = colorlist[imgdata[i][j]]
pixel.show()
'''

# do we need to specify brighness or can we just have that set to a relatively dim value?
if __name__ == "__main__":
    pixeldata, collist = get_img_data(Image.open(input("Filepath of image to show:\n")), 0.05)

    code = generate_py_code(pixeldata, collist, 15)

    filepath = input("Path to python script:\n")
    with open(filepath, "w") as file:
        file.write(code)
        print(f'Written to {filepath} :D')