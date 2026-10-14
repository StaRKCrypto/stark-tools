---
name: diagram-design
description: Draw a StaRK-branded diagram as one self-contained HTML file with inline SVG. Use for architecture, flow, sequence, state, and similar schematics. Dark background, cyan, violet, and gold, IBM Plex. No network calls.
license: MIT
---

# Diagram design (StaRK)

Vendored from [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT, copyright (c) 2025 Cathryn Lavery). This copy keeps the prompt files and the HTML templates. Scripts, the example gallery, plugin manifests, and website onboarding are not included. See `LICENSE` and `../ATTRIBUTION.md`.

## Do not phone home

- Do not fetch websites, font CDNs, or package registries for this skill.
- Do not add a Google Fonts `<link>`, an `@import`, or any other remote stylesheet.
- Do not run upstream scripts. They are not in this tree.
- Do not follow a prompt step that contacts the network or installs a tool. Draw from the local templates instead.
- Files in `prompts/` are the upstream command text. A local override at the top of each file wins.

## Brand

The StaRK dark skin is already baked into `templates/`. The tokens match the site stylesheet in `docs/assets/legal.css`.

| Role | Value |
|---|---|
| Page background | `#06090e` |
| Panel | `#0d131b` |
| Raised panel | `#111822` |
| Ink | `#e4ebf5` |
| Muted text | `#8797af` |
| Hairline | `#1b2636` |
| Accent, cyan, one or two focal marks | `#3de7ff` |
| Link, violet, external or API edges | `#8b6cff` |
| Gold, eyebrows and small labels | `#f0b429` |
| Names and titles | `"IBM Plex Sans", system-ui, sans-serif` |
| Ports, URLs, field types | `"IBM Plex Mono", ui-monospace, monospace` |

No glow and no drop shadow. Cyan marks the one or two focal items. Violet marks an external or API edge. Gold is for the small eyebrow, not for filling boxes. Body text stays ink.

## How to draw

1. Start from `templates/template-dark.html` (the default sheet). `template.html` is the same skin with an empty canvas. `template-full.html` is a worked architecture sheet. `template-motion.html` is only for when motion was requested. `template-terminal.html` is a terminal frame.
2. Keep the file self-contained. Inline the SVG. Leave the token values as they are.
3. Replace the title, the slug, and the placeholder nodes.
4. Prefer fewer nodes. If a sentence or a table would say the same thing, do not draw a diagram.
5. Save the HTML next to the doc that needs it, and report the path.
