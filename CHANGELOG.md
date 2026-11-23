# Changelog

All notable versions of this repository.
Format: [Keep a Changelog](https://keepachangelog.com/). Versioning: [SemVer](https://semver.org/).

---

## [2.2.1] — 2026-11-23

### Removed
- `v1/tools/build.py` — the v1 site generator. It still carried the five-elements / zodiac
  generation logic and read the now-deleted `data/wuxing.json`.

### Note
- `v1/tools/make_letter.py` and `v1/tools/make_samples.py` are untouched — they only render the
  keepsake sample images and contain no fortune-telling code.
- The generator itself is still available at tag `v1.0.0`.

---

## [2.2.0] — 2026-11-23

### Removed
- **The fortune-telling paths are gone from the v1 archive**, so the live site no longer
  exposes them:
  - `v1/zodiac.html` — western sign x Chinese animal
  - `v1/mystic.html` — the five-natures hub
  - `v1/elements/*` — the five element landing pages
  - their dedicated assets: `assets/zodiac-core.js`, `assets/zodiac-quiz.js`,
    `assets/wuxing-core.js`, `assets/wuxing-quiz.js`, `data/zodiac.json`, `data/wuxing.json`

### Changed
- `v1/index.html`: the "four doors" hub now offers **two** (the quick name + the moon quiz);
  footer links to the removed paths were dropped.
- `v1/sitemap.xml`: 517 -> 510 entries.

### Added
- Root `robots.txt` pointing at `https://879879.xyz/v1/sitemap.xml`.

### Note
- The remaining ~500 pages (`name/`, `phases/`, `quiz.html`, `assets/app.js`,
  `data/moon.json`, `data/names.json`) are untouched and keep working.
- `v1/tools/build.py` still contains generator code for the removed paths. It is a build
  artifact, not a served page — remove on request.

---

## [2.1.0] — 2026-11-23

### Added
- **The v1 site is back and still browsable**, archived under `v1/` — all ~517 pages:
  `v1/name/*` (~500 SEO landing pages), `v1/phases/*`, `v1/elements/*`, plus
  `v1/quiz.html`, `v1/zodiac.html`, `v1/mystic.html`, `v1/assets/`, `v1/data/`, `v1/tools/`.
  Its relative links were left untouched, so it works from the sub-directory as-is.

### Changed
- `v1` canonical URLs, the v1 waitlist return URL, and `v1/sitemap.xml` (517 `<loc>` entries)
  now point at `/v1/...` so the archived pages self-canonicalize instead of pointing at
  URLs that now belong to v2.

### Fixed
- Repointed two dead internal links in the v1 archive:
  `../../moon-quiz.html` -> `../../quiz.html`, `../../five-natures.html` -> `../../mystic.html`.

### Note
- The v2 app stays at the repository root. `v1/` exists to keep the previous site's
  existing search traffic alive.

---

## [2.0.0] — 2026-11-23

Full rebuild. The old multi-path site (surname/naming + five-elements + zodiac) is replaced by a
single-purpose, compliance-safe, four-language naming quiz.

### Added
- **16-type personality quiz** — 32 questions, 4 dimensions (E/I, S/N, T/F, J/P) x 8 each
- **8 moon phases** derived from type + J/P; the moon is a metaphor, not a prediction
- **80-name bank** — 20 per group (NT / NF / SJ / SP), every name with a verifiable classical source
- **Moon card** — full name, pinyin, signature, type, source line, and a line from Luna;
  in-app "Save card (PNG)" export
- `sample-card.png` (2160x2700) and `sample-card-A4.pdf` (A4 @ 300 dpi, print-ready)
- **Four languages** — English `index.html` / Traditional Chinese `zh.html` /
  Simplified Chinese `zh-Hans.html` / Japanese `ja.html`

### Changed
- License: AGPL-3.0 (v1) -> MIT (v2). The v1 fileset stays available at tag `v1.0.0`.
- Scope narrowed on purpose: no fortune-telling, zodiac or five-elements paths.

### Fixed
- **Moon-phase mask table.** 5 of the 8 phases were mapped to wrong carve offsets, and
  `new` / `waning-crescent` shared the same value — so several types showed an almost-full moon
  with a hairline notch that read as a rendering glitch. All 8 phases now render correctly.

### Removed
- `zodiac.html`, `mystic.html`
- `elements/` (five-elements landing pages)
- `name/` (~500 SEO landing pages, one per Western first name)
- `data/`, `assets/`, `tools/`, `samples/`, `phases/`, `site-config.js`,
  `sitemap.xml`, `robots.txt`

---

## [1.0.0] — earlier

- "Mingzi": a free Chinese-name generator with ~500 SEO landing pages and paid keepsake samples
- Later 1.x releases added: a five-elements path, a zodiac path, a moon-maiden quiz,
  a waitlist flow, and pricing tiers
- License: AGPL-3.0
