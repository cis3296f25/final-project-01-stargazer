import os
import math
import numpy as np
from PIL import Image
import tifffile

# Use a path relative to this file, so it works from anywhere
BASE_DIR = os.path.dirname(__file__)
INPUT_TIF = os.path.join(BASE_DIR, "lit_mask.tif")
OUTPUT_DIR = os.path.join(BASE_DIR, "tiles")

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Loading TIFF...")
tif = tifffile.TiffFile(INPUT_TIF)
page = tif.pages[0]
data = page.asarray()
tags = page.tags

model_tiepoint = tags["ModelTiepointTag"].value
model_pixelscale = tags["ModelPixelScaleTag"].value

px_w = model_pixelscale[0]
px_h = -model_pixelscale[1]

lon_origin = model_tiepoint[3]
lat_origin = model_tiepoint[4]

height, width = data.shape

print(f"Raster size: {width} x {height}")
print(f"Origin: lon={lon_origin}, lat={lat_origin}")
print(f"Pixel size: {px_w}, {px_h}")

TILE_SIZE = 256

def latlon_to_pixel(lat, lon):
    px = (lon - lon_origin) / px_w
    py = (lat - lat_origin) / px_h
    return int(px), int(py)

def latlon_tile_bounds(z, x, y):
    n = 2 ** z
    lon_w = x / n * 360.0 - 180.0
    lon_e = (x+1) / n * 360.0 - 180.0

    lat_n = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    lat_s = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y+1) / n))))

    return lat_n, lat_s, lon_w, lon_e

def generate_tile(z, x, y):
    lat_n, lat_s, lon_w, lon_e = latlon_tile_bounds(z, x, y)

    px_west, py_north = latlon_to_pixel(lat_n, lon_w)
    px_east, py_south = latlon_to_pixel(lat_s, lon_e)

    px_west = max(0, min(width-1, px_west))
    px_east = max(0, min(width-1, px_east))
    py_north = max(0, min(height-1, py_north))
    py_south = max(0, min(height-1, py_south))

    tile = data[py_north:py_south, px_west:px_east]

    if tile.size == 0:
        return

    img = Image.fromarray(tile.astype(np.uint8) * 255, mode="L")
    img = img.resize((TILE_SIZE, TILE_SIZE), resample=Image.NEAREST)

    rgba = img.convert("RGBA")
    arr = np.array(rgba)
    OPACITY = 180
    arr[:, :, 3] = OPACITY
    rgba = Image.fromarray(arr, "RGBA")

    folder = os.path.join(OUTPUT_DIR, str(z), str(x))
    os.makedirs(folder, exist_ok=True)
    out_path = os.path.join(folder, f"{y}.png")
    rgba.save(out_path)
    print(f"Saved tile {z}/{x}/{y}")

def generate_all_tiles(zoom_min=0, zoom_max=7):
    for z in range(zoom_min, zoom_max + 1):
        n = 2 ** z
        print(f"Generating zoom {z}…")
        for x in range(n):
            for y in range(n):
                generate_tile(z, x, y)
    print("Done!")

if __name__ == "__main__":
    generate_all_tiles(zoom_min=0, zoom_max=7)
