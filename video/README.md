# Animated CV (Remotion)

Vahid Faraji's 60-second animated CV, for technical and non-technical viewers alike: who I am,
the languages I read, data and its story, knowing the problem and building the solution, context
design, analytical thinking, what you can count on, and a wooden abacus that spells the name.
Each scene has its own camera (zooms in and out with motion blur on fast moves) and the scenes are
joined with @remotion/transitions (slide, wipe, clock wipe) plus a custom zoom-through and red-rod reveal. Source for `site/assets/video/vahid-cv-60s.mp4`.

```bash
bun install          # Bun 1.4+: no install scripts run unless trusted
bun run studio      # preview and edit in the browser
bun run render      # out/vahid-cv-60s.mp4, 1920x1080
bun run render:web  # 720p web copy into site/assets/video/
```

- `src/AnimatedCV.tsx` holds the sixteen scenes, the cut list and the transitions.
- `make_audio.py` writes the score with numpy (`pip install numpy`): a 120 BPM cue that follows the seven chapters, with a riser into and an impact on every cut, and bead clicks on the counting moments.
- Chapters enter with different transitions (dissolve, zoom, a wipe edged by an ink rod, an iris, a slide, and a red rod for the finale).
- `public/` holds the fonts and screenshots the video uses.
