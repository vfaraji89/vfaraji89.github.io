# Animated CV (Remotion)

Vahid Faraji's 60-second animated CV: a story in seven beats on one abacus rod,
in the site's palette, type and beads. Source for `site/assets/video/vahid-cv-60s.mp4`.

```bash
npm install
npm run studio      # preview and edit in the browser
npm run render      # out/vahid-cv-60s.mp4, 1920x1080
npm run render:web  # 720p web copy into site/assets/video/
```

- `src/AnimatedCV.tsx` holds the scenes, captions and the abacus timer.
- `make_audio.py` writes the soundtrack (ambient pad plus bead clicks) with the standard library only.
- `public/` holds the fonts and screenshots the video uses.
