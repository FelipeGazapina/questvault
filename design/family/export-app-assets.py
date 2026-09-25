"""Scale the generated art into the app with nearest-neighbour so it stays crisp.
Props: 12x -> app/assets/rpg/sprites/*.png. Scenes: 9x -> app/assets/rpg/scenes/*.png.
Run after render-props.mjs and render-scenes.py:  python3 export-app-assets.py
"""
import glob, os, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, '..', '..', 'app', 'assets', 'rpg')
os.makedirs(os.path.join(APP, 'sprites'), exist_ok=True)
os.makedirs(os.path.join(APP, 'scenes'), exist_ok=True)

RECT = re.compile(r'<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="(#[0-9a-f]{6})"/>')

for f in glob.glob(os.path.join(HERE, 'out', 'props', '*.svg')):
    svg = open(f).read()
    w, h = map(int, re.search(r'viewBox="0 0 (\d+) (\d+)"', svg).groups())
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for x, y, rw, rh, c in RECT.findall(svg):
        col = tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        for xx in range(int(x), int(x) + int(rw)):
            for yy in range(int(y), int(y) + int(rh)):
                im.putpixel((xx, yy), col)
    name = os.path.basename(f)[:-4]
    im.resize((w * 12, h * 12), Image.NEAREST).save(os.path.join(APP, 'sprites', f'{name}.png'), optimize=True)

for f in glob.glob(os.path.join(HERE, 'out', 'scenes', '*.png')):
    im = Image.open(f).convert('RGB')
    im.resize((im.width * 9, im.height * 9), Image.NEAREST).save(os.path.join(APP, 'scenes', os.path.basename(f)), optimize=True)
