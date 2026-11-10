# KINGDOM OS hub (kingdom.ai-love.cc): brand

This folder is the place for this hub's brand kit and media records, made with storytold's Craft apps through the
artcraft-brand skill (the private repository `cambridgetcg/brandkit`). There is no kit yet (`kind: planned`).
`brandkit.json` records this project's details, and `check.mjs` checks them. The cards and plates stay in
`media/`, where the pages already link them.

## The look

Midnight `#080b14`, ink `#eeecf4` and gold `#e8c87a`, set in Fraunces and Newsreader, with a gold four-point star as
the mark (`icon.svg`). The build and accountability pages use their own greens. Who chose this look is not recorded:
`icon.svg` was first committed on 2026-08-01 (`32521d02`, git author "yu", no co-author line) and the cards on
2026-08-17 (`b1c8e1bf`). Until a record exists, `decided` in `brandkit.json` says `not-recorded`.

Don't change the identity without its owner's word. Every asset here records who made it in `CREDITS.md`.

## What is here

| Path | What it is |
|---|---|
| `brandkit.json` | this project's details: the look, the page it dresses, the fonts, the guards, what a deploy does, the cards in `media/` |
| `CREDITS.md` | who made what, with fonts and images and their licences |
| `check.mjs` | the check, copied from brandkit; update it there, not here |

`brand.json` (the generator's input) and `kit/` (the built kit, never edited by hand) arrive with a kit.

## Rebuild

No kit yet. The cards and home-screen marks are rebuilt from the plates with:

```sh
python3 tools/compose-og.py
```

It sets the titles with the fonts in `tools/fonts/` (Fraunces, Newsreader) and falls back to Georgia if they are
missing. Then run:

```sh
node brand/check.mjs
node --test test.mjs
```

## How the site uses it

The repository root is the site: plain HTML with no build step. Each page writes its own head, links `/icon.svg`
and `/media/apple-touch-icon.png`, sets its own theme-color, and names its card in `media/`. `site.html` lists
`index.html`, so the check compares its theme-color and color-scheme with a kit's head snippet once there is a kit,
and holds the build and accountability pages to their own greens.
`/favicon.ico` answers 404 today. Two cards here are made for other doors: `og-atlas.jpg` for thekingdom.dev and
`og-gate.jpg` for kingdom-gate.vercel.app.

## Deploying

Not recorded. The site answers from Cloudflare with Pages' default cache header, and `.gitignore` lists
`.wrangler/`, which suggests a direct `wrangler pages deploy` of the repository root; GitHub Pages is no longer
configured. Which project serves it, whether a push deploys, and whose word a release needs are not recorded here.
If the root is uploaded as it is, this `brand/` folder is served too. HTML revalidates on every request.
