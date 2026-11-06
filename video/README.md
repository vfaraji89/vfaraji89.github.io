# Animated CV (Remotion)

Vahid Faraji's 60-second animated CV, for technical and non-technical viewers alike: who I am,
the languages I live in, data and its context, AI put to work, Tokalator, what you can count on,
and a wooden abacus that spells the name. Same palette, type and beads as the site. Source for `site/assets/video/vahid-cv-60s.mp4`.

```bash
npm install
npm run studio      # preview and edit in the browser
npm run render      # out/vahid-cv-60s.mp4, 1920x1080
npm run render:web  # 720p web copy into site/assets/video/
```

- `src/AnimatedCV.tsx` holds the scenes, captions and the abacus timer.
- `make_audio.py` writes the score with numpy (`pip install numpy`): a 120 BPM cue that follows the seven chapters, with a riser into and an impact on every cut, and bead clicks on the counting moments.
- Chapters enter with different transitions (dissolve, zoom, a wipe edged by an ink rod, an iris, a slide, and a red rod for the finale).
- `public/` holds the fonts and screenshots the video uses.
