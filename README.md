# usecoherence.dev

Source repository for the Coherence public website.

This is a small [Eleventy](https://www.11ty.dev/) static site:

```text
src/      Markdown, templates, and assets
public/   generated HTML/CSS output
```

## Commands

```bash
npm install
npm run dev
npm run build
npm run deploy
```

`npm run deploy` builds the site and uploads `public/` to `pgs.sh` with `rsync`.

Copy `.env.example` to `.env` and fill local values:

```bash
cp .env.example .env
```

Configure Cloudflare DNS for `usecoherence.dev`:

```bash
npm run dns:setup
```

The token only needs `Zone:Read` and `DNS:Edit` for `usecoherence.dev`.

Environment variables:

```bash
CLOUDFLARE_ZONE=usecoherence.dev
PGS_TARGET=<pico-user>-usecoherence
PGS_HOST=pgs.sh
PGS_USER=<pico-user>
PGS_PROJECT=usecoherence
PGS_IDENTITY=~/.ssh/specific-key  # optional
```

## Purpose

This repository is the public narrative layer for Coherence:

- explain the project
- publish documentation
- write blog posts and design notes
- keep a versioned source of everything published on the site

The core code, specs, examples, and executable plans live in:

- https://github.com/usecoherence/coherence
