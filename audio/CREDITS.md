# Audio provenance

- `bgm_town.mp3`, `bgm_forest.mp3`, `bgm_desert.mp3`, `bgm_snow.mp3`, `bgm_volcano.mp3`, and `bgm_cave.mp3` were curated from the licensed Main Character Asset audio pack already supplied with this project.
- `bgm_dungeon.ogg`, `bgm_boss.ogg`, and every `sfx_*.wav` file are project-owned procedural audio generated reproducibly by `scripts/build-procedural-audio.mjs` on 2026-07-20.
- Lossless WAV source loops are retained outside the mobile payload at `assets/generated/audio-sources/`; runtime Ogg Vorbis files are encoded at quality 4 by the project-local `ffmpeg-static` build dependency.

The generated audio contains no third-party samples.
