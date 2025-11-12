from PIL import Image, ImageSequence
from img import get_img_data

# returns array of (pixel_data, colorlist) tuples
def get_gif_data(vid, brightness = 0.05):
    try:
        width, height = vid.size
        
        frame_data_arr = []
        # each element is one frame of the gif, in the same format as in img.py.
        colorlist_arr = []
        # each element is the list of all distinct colors in the frame image.
        for frame in ImageSequence.Iterator(vid):
            frame = frame.convert('RGBA')
            frame_data, colorlist = get_img_data(frame)
            print(frame_data)
            if (frame_data is None) or (colorlist is None):
                raise ValueError("get_img_data returned None")
            frame_data_arr.append(frame_data)
            colorlist_arr.append(colorlist)
        
        true_colorlist = []
        # will be the array of all distinct colors in the GIF (one list, every frame)
        color_conversion_map = {}
        # array of tuples, structure is ((frame #, index), color's index in true_colorlist)
        for i, cl in enumerate(colorlist_arr):
            for j, col in enumerate(cl):
                # if new color, add to true_colorlist and add instruction to color_conversion_map
                if col not in true_colorlist:
                    true_colorlist.append(col)
                    print(col)
                color_conversion_map[col] = true_colorlist.index(col)
        
        for i, frame in enumerate(frame_data_arr):
            for r in range(len(frame)):
                for c in range(len(frame[r])):
                    old_color_idx = frame[r][c]
                    original_color = colorlist_arr[i][old_color_idx]
                    frame_data_arr[i][r][c] = color_conversion_map[original_color]
        
        
        
        return frame_data_arr, true_colorlist
        
    except FileNotFoundError:
        print(f'File not found :(\nXbox controlrer')
        return
    except Exception as e:
        print(f'An error occurred idk what :skull:\nXbox controlrer\n', e)
        return


def generate_py_code(framedata, colorlist, animspeed = 0.25, boardinput = 15):
    if boardinput < 0 or boardinput > 28: return
    
    workaround = '{pixelstrip.MATRIX_COLUMN_MAJOR, pixelstrip.MATRIX_ZIGZAG}'
    
    return f'''import pixelstrip
import board
import time

imgdata = {framedata}
colorlist = {colorlist}

pixel = pixelstrip.PixelStrip(board.GP{boardinput}, width=8, height=8, bpp=4, pixel_order=pixelstrip.GRB, 
                        options={workaround})

pixel.timeout = 0.0

pixel.clear()

current_frame = 0

while True:
    for i in range(len(imgdata[current_frame])):
        print(imgdata[current_frame])
        for j in range(len(imgdata[current_frame][0])):
            pixel[i, 7-j] = colorlist[imgdata[current_frame][i][j]]
    pixel.show()
    time.sleep({animspeed})
    current_frame += 1
    if current_frame >= len(imgdata): current_frame = 0
'''


if __name__ == "__main__":
    # abc is the list of data for each frame; xyz is the list of colors
    abc, xyz = get_gif_data(Image.open(input("Filepath of image to show:\n")))
    
    code = generate_py_code(abc, xyz, float(input("How fast is each frame (in seconds)?\n")))
    
    filepath = input("Path to python script:\n")
    with open(filepath, "w") as f:
        f.write(code)
        print(f'Written to {filepath} :D')