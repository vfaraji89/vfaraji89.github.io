# ProjectLens screenshots

`projectlens-home.png` is the dashboard view: date range, team / brand /
project filters, and the proposal summary row (total offered, converted,
conversion rate, margin).

Referenced from:
- `site/index.html`   — gallery card (`data-lightbox="projectlens"`)
- `site/updates.html` — the ProjectLens news card

Add more views here and list them in the `data-images` array on the gallery
card; the lightbox pages through whatever is in it. Both pages guard the image
with `onerror`, so a missing file falls back to the text-only card rather than
rendering broken.
