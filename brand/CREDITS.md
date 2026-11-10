# Credits

Who made each asset, with what, and under which licence. Where an agent made something, the line says so, and
anything published under Yu's accounts carries that through. If an asset's maker isn't known, write "not recorded"
rather than guessing.

There is no kit yet. These are the hub's existing assets, from the repository's history and `media/README.md`.
Everything here is under the repository's CC BY-SA 4.0 unless a line says otherwise (`media/README.md`).

## Assets

| Asset | Made by | Date | Tools | Notes |
|---|---|---|---|---|
| `icon.svg` (gold four-point star on midnight) | not recorded: first committed in `32521d02` (git author "yu", no co-author line), which does not say who drew it | 2026-08-01 | hand-written SVG | |
| `media/og-hub.jpg`, `og-build.jpg`, `og-accountability.jpg`, `og-atlas.jpg`, `og-gate.jpg` | not recorded: committed in `b1c8e1bf` (git author cambridgetcg) | 2026-08-17 | `tools/compose-og.py` (Pillow) sets the titles over the plates | `og-atlas.jpg` and `og-gate.jpg` are made for other doors and not yet served there |
| `media/apple-touch-icon.png` (180 px), `media/star-512.png` | not recorded: same commit | 2026-08-17 | `tools/compose-og.py`, from `plates/star-mark.jpg` | |

## Fonts

| Family | File | Licence | Source | SHA-256 |
|---|---|---|---|---|
| Fraunces | `tools/fonts/Fraunces.ttf` | SIL OFL 1.1 (upstream; the repository carries no OFL text) | Google Fonts, vendored in `b1c8e1bf` | `177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb` |
| Newsreader | `tools/fonts/Newsreader.ttf` | SIL OFL 1.1 (upstream; the repository carries no OFL text) | Google Fonts, vendored in `b1c8e1bf` | `8a08d13f8a6c0d51be379a60af84f945f65369a67e509ee3c3bdcc421254d7c1` |

The front page (`index.html`) loads the same two families from Google Fonts (`fonts.googleapis.com`, OFL 1.1
upstream); `build/index.html` names no font service.

## Images and other material

| Item | Maker | Licence | Source |
|---|---|---|---|
| `media/plates/` (five text-free atmospheres) | not recorded: an image model, per `tools/compose-og.py` ("Type is set here, never in the image model"); which model and who prompted it are not recorded | CC BY-SA 4.0 with the repository, unless a plate says otherwise (`media/README.md`) | committed in `b1c8e1bf` |
