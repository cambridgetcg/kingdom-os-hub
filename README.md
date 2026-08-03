# KINGDOM OS hub

The plain public front door for KINGDOM OS:
[kingdom.ai-love.cc](https://kingdom.ai-love.cc/).

It points to the versioned KINGDOM foundation and standard, the living public
atlas, a practical builder door, and related project homes. It does not replace
those roots or turn a link, download, card, check, or offer into membership,
citizenship, adoption, consent, endorsement, control, or affiliation.

## Start here

- [The builder door](https://kingdom.ai-love.cc/build/) lets a person or agent
  copy three core CC0 files without an account, package install, framework, or
  default adoption. A KINGDOM compatibility card and offline check are two
  optional helpers. [BUILD.md](BUILD.md) carries the same path in plain text.
- [The current foundation](https://github.com/cambridgetcg/kingdom-standard/blob/main/FOUNDATION.md)
  contains the exact seven commitments and their amendment path.
- [The KINGDOM Standard](https://github.com/cambridgetcg/kingdom-standard)
  contains the operational laws, checks, release pins, and translations.
- [The living atlas](https://thekingdom.dev/) is the maintained public map. It
  can lag the homes it links; each home remains authoritative for itself.
- [DISCOVERY.md](DISCOVERY.md) records the finite search and outreach strategy
  behind this front door.

Read, co-learn, build, offer, adopt, and enter a civic relationship are separate
choices. None silently starts another.

## Public files

- `index.html` — the visible front door and truthful `WebSite` metadata.
- `build/index.html` — the visible no-account builder guide and local card
  maker. Its form sends no field data; ordinary hosting still receives page,
  script, and icon requests.
- `build/builder.mjs` — the dependency-free card maker; it uses no storage,
  analytics, or form-data request.
- `BUILD.md` — the same route in plain text for agents and text readers.
- `starter/` — five CC0 files that can be copied into an independent project.
- `.github/ISSUE_TEMPLATE/share-a-project.md` — an optional public,
  account-requiring offer route with publication and retention disclosed
  before submission.
- `robots.txt` — crawl policy and sitemap location.
- `sitemap.xml` — the canonical indexable page inventory.
- `404.html` — a real not-found response for missing doors.
- `icon.svg` — the dependency-free public door mark.
- `llms.txt` — voluntary machine orientation, not a search requirement or
  authority grant.
- `spectrum/index.html` — a dated opinion archive marked `noindex`, with a
  correction and removal door.

## View locally

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. No build step or package install is needed.

## Check locally

```sh
node --test test.mjs
node starter/check-card.mjs starter/kingdom.yaml
```

The test and card check make no network request and write nothing.

## Corrections

The current [correction or removal route](https://github.com/cambridgetcg/kingdom-os-hub/issues/new)
is public on GitHub and requires an account. No accountless intake is presently
claimed. Later use should carry material corrections rather than silently
leaving a superseded claim in circulation.

## License

The repository is licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) unless a file
states another license. Files inside `starter/` are separately offered under
[CC0 1.0](starter/LICENSE). The separate KINGDOM Standard is also offered
under CC0 in its own authoritative repository.
