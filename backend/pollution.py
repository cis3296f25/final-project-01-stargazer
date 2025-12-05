import os
import math
import numpy as np
from PIL import Image
import tifffile

INPUT_TIF = "backend\lit_mask.tif"  # rename to your TIFF file
OUTPUT_DIR = "tiles"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# -----------------------------
# 1. READ TIFF + METADATA
# -----------------------------
print("Loading TIFF...")
tif = tifffile.TiffFile(INPUT_TIF)
page = tif.pages[0]
data = page.asarray()
tags = page.tags

# GeoTIFF metadata
model_tiepoint = tags["ModelTiepointTag"].value  # (I, J, K, lon_origin, lat_origin, 0)
model_pixelscale = tags["ModelPixelScaleTag"].value  # (pixel_width_deg, pixel_height_deg, 0)

px_w = model_pixelscale[0]
px_h = -model_pixelscale[1]  # note: GeoTIFF uses negative scale for north-up

lon_origin = model_tiepoint[3]
lat_origin = model_tiepoint[4]

height, width = data.shape

print(f"Raster size: {width} x {height}")
print(f"Origin: lon={lon_origin}, lat={lat_origin}")
print(f"Pixel size: {px_w}, {px_h}")


# -----------------------------
# 2. CONVERT LAT/LON TO PIXELS
# -----------------------------
def latlon_to_pixel(lat, lon):
    """Convert geographic coordinates into pixel coordinates in the TIFF."""
    px = (lon - lon_origin) / px_w
    py = (lat - lat_origin) / px_h
    return int(px), int(py)


# -----------------------------
# 3. DESTINATION TILE FORMAT
# -----------------------------
TILE_SIZE = 256

def latlon_tile_bounds(z, x, y):
    """Compute lat/lon bounding box for tile."""
    n = 2 ** z
    lon_w = x / n * 360.0 - 180.0
    lon_e = (x+1) / n * 360.0 - 180.0

    lat_n = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    lat_s = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y+1) / n))))

    return lat_n, lat_s, lon_w, lon_e


# -----------------------------
# 4. GENERATE TILES
# -----------------------------
def generate_tile(z, x, y):
    lat_n, lat_s, lon_w, lon_e = latlon_tile_bounds(z, x, y)

    # Convert bbox to pixel coords
    px_west, py_north = latlon_to_pixel(lat_n, lon_w)
    px_east, py_south = latlon_to_pixel(lat_s, lon_e)

    px_west = max(0, min(width-1, px_west))
    px_east = max(0, min(width-1, px_east))
    py_north = max(0, min(height-1, py_north))
    py_south = max(0, min(height-1, py_south))

    tile = data[py_north:py_south, px_west:px_east]

    if tile.size == 0:
        return

    # Resize to 256×256
    img = Image.fromarray(tile.astype(np.uint8) * 255, mode="L")  # lit mask → white
    img = img.resize((TILE_SIZE, TILE_SIZE), resample=Image.NEAREST)

    # Convert black → transparent
    rgba = img.convert("RGBA")
    arr = np.array(rgba)
    OPACITY = 180  # choose 100–220
    arr[:, :, 3] = OPACITY
    rgba = Image.fromarray(arr, "RGBA")

    # Save tile
    folder = f"{OUTPUT_DIR}/{z}/{x}"
    os.makedirs(folder, exist_ok=True)
    rgba.save(f"{folder}/{y}.png")
    print(f"Saved tile {z}/{x}/{y}")


# -----------------------------
# 5. RUN GENERATION FOR ZOOMS
# -----------------------------
ZOOM_MIN = 0
ZOOM_MAX = 7   # increase if you want higher detail

for z in range(ZOOM_MIN, ZOOM_MAX+1):
    n = 2 ** z
    print(f"Generating zoom {z}…")
    for x in range(n):
        for y in range(n):
            generate_tile(z, x, y)

print("Done!")




'''
TILE_SIZE = 256
OUTPUT_DIR = "tiles"

# Example: random intensity points (you will replace this with real data)
points = [
    (40.0, -75.0, 1.0),   # PA/NJ region
    (34.0, -118.2, 1.0),  # LA
    (37.77, -122.42, 1.0),# SF
    (51.5, -0.12, 1.0),   # London
]


def lonlat_to_pixel(lon, lat, z):
    """Convert lon/lat to pixel coordinates at zoom z"""
    lat_rad = np.radians(lat)
    n = 2 ** z * TILE_SIZE
    x = (lon + 180.0) / 360.0 * n
    y = (1 - (np.log(np.tan(lat_rad) + 1 / np.cos(lat_rad)) / np.pi)) / 2 * n
    return int(x), int(y)


def generate_zoom_level(z):
    """Generate heatmap tiles for zoom z"""
    n_tiles = 2 ** z
    print(f"Generating zoom {z} -> {n_tiles} × {n_tiles} tiles")

    # Create tile folders
    zoom_dir = os.path.join(OUTPUT_DIR, str(z))
    os.makedirs(zoom_dir, exist_ok=True)

    # For each tile x/y at this zoom:
    for x in range(n_tiles):
        for y in range(n_tiles):

            # Create empty image
            img = np.zeros((TILE_SIZE, TILE_SIZE))

            # Check which points fall in this tile
            for lat, lon, intensity in points:
                px, py = lonlat_to_pixel(lon, lat, z)

                # Tile pixel range:
                tile_origin_x = x * TILE_SIZE
                tile_origin_y = y * TILE_SIZE

                # If point isn't in this tile, skip
                if not (tile_origin_x <= px < tile_origin_x + TILE_SIZE and
                        tile_origin_y <= py < tile_origin_y + TILE_SIZE):
                    continue

                # Local pixel coords inside tile
                lx = px - tile_origin_x
                ly = py - tile_origin_y
                img[ly, lx] += intensity

            # Apply colormap
            plt.imsave(
                f"{OUTPUT_DIR}/{z}/{x}_{y}.png",
                img,
                cmap="inferno",
                vmin=0,
                vmax=1,
            )


def generate_all_tiles(max_zoom=7):
    for z in range(max_zoom + 1):
        generate_zoom_level(z)


if __name__ == "__main__":
    generate_all_tiles()
    print("Done!")
'''