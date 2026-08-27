# ProjectLens screenshots

Save the two screenshots here with exactly these filenames:

- `projectlens-home.png`        — the landing / admin-login view with the metric row
                                  (6 teklif, 4 talep, 17 efor kalemi) and the
                                  Talep → Efor → Fiyat → Teklif → Sonuç flow
- `projectlens-sql-console.png` — the read-only SQL console view

They are referenced from:
- `site/index.html`   — gallery card (`data-lightbox="projectlens"`)
- `site/updates.html` — the ProjectLens news card

Until the files exist, both pages hide the image and fall back to the
text-only card layout, so nothing renders broken.
