# UK Wealth Inequality Dashboard

An open-source, installable **progressive web app** that answers one question:
**how much wealth is there in the UK, and who owns it?**

It is built entirely from **published, openly-licensed data** — the ONS Wealth &
Assets Survey, the World Inequality Database, and peer-reviewed academic
adjustments. Every figure on screen links back to its source. **No individuals
are scraped or profiled.**

## Why this design

- **Static, no backend.** Wealth data updates at most once or twice a year, so
  the numbers are precomputed at build time into JSON and served as static
  files. No server, no database, near-zero hosting cost, trivially reproducible.
- **Honest by construction.** The signature *"official survey ↔ adjusted"*
  toggle switches between two *citable published series*, not a home-made
  estimate. Every figure carries `geography` (GB vs UK), `unit` (household vs
  adult), and `basis` (survey vs adjusted) so incompatible numbers are never
  silently mixed.

## Architecture

```
pipeline/build_data.py   (Python, build-time)
  fetch published datasets → compute distribution + Pareto tail
        │
        ▼
data/*.json   (headlines · distribution · sources)
        │
        ▼
src/  React + Vite static PWA  → dist/  (host on any static CDN)
```

## Getting started

```bash
npm install
npm run dev        # local dev server
npm run build      # -> dist/ (static, deployable)
npm run preview    # preview the production build
```

Regenerate the data (Python 3.11+):

```bash
pip install -r pipeline/requirements.txt
npm run data       # runs pipeline/build_data.py (currently a stub)
```

## Data & licensing

Source data is **not** covered by this project's MIT licence; each dataset keeps
its own. See [`data/sources.json`](data/sources.json). ONS data is used under the
Open Government Licence v3.0 with attribution.

> ⚠️ The ONS Wealth & Assets Survey had its accredited-official-statistics status
> suspended by the OSR in June 2025 over undercount concerns — which is exactly
> why the "adjusted" view exists.

## Roadmap

- **M0 ✅** Data model + sourced seed figures
- **M2 ✅** Static PWA shell rendering the data
- **M1 ✅** Real pipeline: parses ONS WAS decile tables (Lorenz + Gini +
  composition), fits a Pareto tail for the top 0.1%, emits validated JSON
- **M3** Lorenz curve, Pen's Parade, "where do you sit?", composition, regional
- **M4** PWA polish (offline, installable, Lighthouse)
- **M5** Accessibility, dark/light, social cards, launch

## Licence

MIT — see [LICENSE](LICENSE).
