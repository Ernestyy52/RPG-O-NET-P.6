#!/usr/bin/env python3
"""Repeatable crop pipeline for the Aethergate town map (Phase 3, docs/map-rebuild).

Source of truth for the building depth-slices used by app/game/scenes/TownScene.ts.
TownScene slices the SAME rects from the loaded town image at runtime (canvas drawImage),
so these exported PNGs are for verification / provenance / the asset manifest — the game
does not need them at load time. Re-run after any SLICES edit to keep the manifest in sync:

    python scripts/map-rebuild/crop_town_slices.py

Pixel-perfect: crops are 1:1 from the source (no resample); the game upscales with
nearest-neighbour (pixelArt:true), so pixel art stays crisp. Only assets under
docs/mockups/ are used for map visuals (task rule #2).
"""
import json, os, hashlib
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "docs/mockups/region-01-everbloom/aethergate-town/aethergate-town-map.png")
OUT_DIR = os.path.join(ROOT, "public/assets/maps/mockup-derived")
MANIFEST = os.path.join(ROOT, "docs/map-rebuild/asset-manifest.json")
TOWN_ART_SCALE = 1.5  # must match TownScene.TOWN_ART_SCALE

# [key, x, y, w, h, usage]  — mirrors TownScene SLICES (building = walk-behind depth layer)
SLICES = [
    ("slice_guild",     115,  95, 250, 200, "Adventurers' Guild exterior (service: town:guild)"),
    ("slice_academy",   428,  48, 235, 220, "Academy & Library exterior (decor)"),
    ("slice_portal",    648,   6, 228, 275, "Tower of Echoes Gatehouse / portal (service: portal)"),
    ("slice_townhall",  885,  40, 195, 248, "Town Hall & Chronicle exterior (decor)"),
    ("slice_hospital", 1238, 118, 200, 192, "Brightleaf Hospital exterior (service: town:hospital)"),
    ("slice_shrine",    115, 360, 250, 205, "Crystal Shrine / Job Hall exterior (decor)"),
    ("slice_forge",     332, 326, 168, 140, "Forge & Craft exterior (service: town:equipment-shop)"),
    ("slice_stage",     805, 285, 175, 180, "Festival stage (decor)"),
    ("slice_itemshop", 1085, 415, 240, 202, "General Goods shop exterior (service: town:item-shop)"),
    ("slice_tailor",    928, 615, 200, 202, "Tailor & Wardrobe exterior (decor)"),
    ("slice_inn",        35, 588, 262, 205, "Hearthsong Inn & Tavern exterior (decor)"),
    ("slice_stable",    332, 602, 212, 190, "Companion Lodge / Stable exterior (decor)"),
    ("slice_bank",     1183, 552, 232, 222, "Bank & Storage exterior (decor)"),
]

def main():
    im = Image.open(SRC).convert("RGBA")
    os.makedirs(OUT_DIR, exist_ok=True)
    entries = []
    for key, x, y, w, h, usage in SLICES:
        crop = im.crop((x, y, x + w, y + h))
        out_path = os.path.join(OUT_DIR, key + ".png")
        crop.save(out_path)
        digest = hashlib.sha1(crop.tobytes()).hexdigest()[:12]
        entries.append({
            "key": key,
            "sourceFile": "docs/mockups/region-01-everbloom/aethergate-town/aethergate-town-map.png",
            "outputFile": "public/assets/maps/mockup-derived/%s.png" % key,
            "cropX": x, "cropY": y, "cropWidth": w, "cropHeight": h,
            "outputWidth": w, "outputHeight": h,
            "scale": TOWN_ART_SCALE,
            "anchor": "bottom-left (origin 0,1)",
            "usage": usage,
            "scene": "TownScene",
            "layer": "building depth-slice (walk-behind, depth = (y+h)*scale)",
            "notes": "Runtime-sliced identically by TownScene.SLICES; exported here for provenance.",
            "sha1": digest,
        })
    manifest = {
        "generatedBy": "scripts/map-rebuild/crop_town_slices.py",
        "map": "Aethergate Town",
        "sourceImage": {"file": os.path.relpath(SRC, ROOT).replace("\\", "/"), "width": im.width, "height": im.height},
        "townArtScale": TOWN_ART_SCALE,
        "worldSize": {"width": int(im.width * TOWN_ART_SCALE), "height": int(im.height * TOWN_ART_SCALE)},
        "slices": entries,
    }
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print("wrote %d slices -> %s" % (len(entries), OUT_DIR))
    print("wrote manifest -> %s" % MANIFEST)

if __name__ == "__main__":
    main()
