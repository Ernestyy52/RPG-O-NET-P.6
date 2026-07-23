# Annotate the town source image with TownScene collision/trigger/spawn geometry (source px)
# so unwalkable pockets and misaligned boxes are visible. Output to scratchpad for review.
from PIL import Image, ImageDraw
import sys
SRC = "docs/mockups/region-01-everbloom/aethergate-town/aethergate-town-map.png"
OUT = sys.argv[1]
im = Image.open(SRC).convert("RGBA")
ov = Image.new("RGBA", im.size, (0,0,0,0))
d = ImageDraw.Draw(ov)

# ZONES: [x0,y0,x1,y1, kind]  (kind: svc/decor/river/prop)
ZONES = [
 (130,215,350,285,'svc'),(670,175,858,275,'svc'),(1250,220,1432,305,'svc'),
 (345,388,495,462,'svc'),(1090,515,1315,612,'svc'),
 (445,178,650,262,'decor'),(895,188,1075,282,'decor'),(130,468,358,560,'decor'),
 (808,380,975,460,'decor'),(955,515,1078,574,'decor'),(500,515,562,582,'decor'),
 (935,720,1122,812,'decor'),(45,700,292,790,'decor'),(345,700,540,788,'decor'),
 (1188,660,1410,770,'decor'),(695,478,830,600,'prop'),(840,565,905,635,'prop'),
 (615,882,700,1002,'prop'),(830,882,908,1002,'prop'),(1030,892,1130,985,'prop'),
 (1452,300,1536,1024,'river'),(0,902,200,1024,'river'),
]
COL={'svc':(255,60,60),'decor':(255,140,0),'prop':(180,60,220),'river':(40,120,255)}
for x0,y0,x1,y1,k in ZONES:
    d.rectangle([x0,y0,x1,y1], outline=COL[k], width=3)

# door triggers: [dx,dy] with world size 110x46 src => +-55 x, +-23 y
DOORS = {'guild':(240,300),'portal':(762,300),'hospital':(1330,322),'equip':(418,480),'item':(1185,628)}
for name,(dx,dy) in DOORS.items():
    d.rectangle([dx-55,dy-23,dx+55,dy+23], outline=(255,255,0), width=2)
    d.ellipse([dx-4,dy-4,dx+4,dy+4], fill=(255,255,0))
    d.text((dx-20,dy+26), name, fill=(255,255,0))

# spawn (green) and CURRENT return spawns (cyan)
d.ellipse([762-7,940-7,762+7,940+7], fill=(0,255,0)); d.text((762+8,940), 'SPAWN', fill=(0,255,0))
RET={'guild':(240,318),'hospital':(1330,340),'equip':(418,500),'item':(1185,648)}
for name,(x,y) in RET.items():
    d.ellipse([x-6,y-6,x+6,y+6], fill=(0,255,255)); d.text((x+8,y-6), 'ret_'+name, fill=(0,255,255))

# world bounds inset (white)
d.rectangle([55,55,1485,995], outline=(255,255,255), width=2)

out = Image.alpha_composite(im, ov)
out.convert("RGB").save(OUT)
print("saved", OUT)
