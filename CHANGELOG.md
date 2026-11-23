# Changelog

All notable versions of this repository.
Format: [Keep a Changelog](https://keepachangelog.com/). Versioning: [SemVer](https://semver.org/).

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
