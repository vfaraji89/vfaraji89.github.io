# Analytics, data layer and secrets

One GA4 property (`G-GTZW5NNEZ5`) covers this portfolio and the awesome-applied-ai guide.
Both live on `vfaraji89.github.io`, so a visit that moves from one to the other is one
journey; `content_group` tells them apart.

## Consent
- Consent mode v2. `ad_storage`, `ad_user_data` and `ad_personalization` are always denied.
- `analytics_storage` is denied until the visitor says yes in the consent pill. The answer is
  stored in `localStorage['vf-consent']` and is shared with the guide (same origin).
- A stored "yes" is applied in the page head, **before** the first hit.

## Privacy guard
Every event passes through `vfClean` (inline in each page head) before it reaches Google:
- emails become `[email]`, phone numbers `[number]`, `mailto:`/`tel:` links `mailto:[redacted]`;
- string values are capped at 100 characters;
- `page_location` drops `q`, `email`, `name`, `jd` and `ref_text` query values.

Pasted text (a job description in the Fit check, a question to the agent) is **never** sent:
only counts and scores.

## Data layer
| Push | When | Fields |
| --- | --- | --- |
| `vf_context` | every page load | `site`, `page_group`, `consent_state` |
| gtag `config` | every page load | `content_group` (home, fit-check, evals, updates, guide, research), `page_location` (redacted) |

## Events
| Event | Fired by | Parameters |
| --- | --- | --- |
| `book_call` | any calendar link | `link_url`, `link_text`, `page_group` |
| `cv_download` | the CV PDF | same |
| `email_click` | a mailto link | same (address redacted) |
| `github_repo`, `tokalator_install` | repo and marketplace links | same |
| `section_view` | a section 35% in view, once per page view | `section` |
| `fit_brief` | Fit check scored (live or sample) | `mode`, `score`, `asks`, `gaps`, `sample` |
| `fit_brief_copy` | Copy in the Fit dock | none |
| `ask_widget` | the corner agent answers | `mode`, `abstain` |
| `ask_widget_open` | the corner agent opens | none |
| `case_story`, `cv_preview`, `reel_play`, `role_fit_check` | home page interactions | see `assets/brand/extras.js` |

In GA: mark `book_call`, `cv_download`, `fit_brief` as key events; register `section`, `score`,
`sample` and `page_group` as event-scoped custom dimensions. Add `?ga_debug=1` to any URL to watch
events arrive in DebugView.

## Secrets
- The GA measurement ID is public by design: every browser must send it. It is not a secret
  and cannot be hidden or hashed.
- Real secrets never live in the repo:
  - `ANTHROPIC_API_KEY` for the Worker: `npx wrangler secret put ANTHROPIC_API_KEY`
    (Cloudflare's encrypted store). Locally it goes in `worker/.dev.vars`, which is git-ignored.
  - Anything CI needs: GitHub → Settings → Secrets and variables → Actions.
  - A GA4 Measurement Protocol `api_secret` must only ever be used server-side.
- A key cannot be stored hashed if a service needs to use it: hashing is one-way. Hashing is
  for checking a value (for example, comparing a token), not for keeping one usable.
- `tools/secret-scan.mjs` runs on every push and pull request (`.github/workflows/secret-scan.yml`)
  and fails on anything key-shaped or on a committed `.env` / `.dev.vars`. Run it before committing:
  `node tools/secret-scan.mjs --staged`.
- If a key ever leaks: revoke and rotate it at the provider first, then remove it from the repo.
  Removing it from history alone is not enough; assume it was copied.
