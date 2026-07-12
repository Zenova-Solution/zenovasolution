# Zenova

Marketing site for Zenova — one agency for everything modern.

Built with **Vite 5 + React 18 + TypeScript 5**.

## Requirements

- Node.js **≥ 18.17** (LTS recommended)
- npm 9+ (or pnpm / yarn — lockfile is npm by default)

## Scripts

```bash
npm install        # install dependencies (first run)
npm run dev        # start the Vite dev server at http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ for a final smoke test
npm run typecheck  # tsc --noEmit
npm run lint       # eslint over .ts/.tsx
```

## Project structure

```
.
├── index.html                  Vite entry HTML
├── public/                     Static assets served at site root
│   ├── assets/                 Logo / mark images (referenced as /assets/…)
│   └── uploads/                User-supplied images
├── src/
│   ├── main.tsx                React mount point
│   ├── App.tsx                 Top-level composition
│   ├── styles/global.css       Single global stylesheet (extracted from the legacy <style> block)
│   ├── config/tweaks.ts        Tweaks defaults — keeps the EDITMODE-BEGIN/END markers
│   ├── types/                  Shared TypeScript types
│   ├── hooks/                  useTweaks, useReveal
│   ├── lib/                    palette helpers
│   ├── components/
│   │   ├── icons/              Inline SVG icon set
│   │   ├── layout/             Nav, Footer, Logo
│   │   ├── ui/                 SectionHeader, RotatingWords
│   │   └── sections/           Hero, Services, Process, Work, Testimonials, CTA, Marquee, …
│   └── dev/                    Dev-only tweaks panel (tree-shaken in production)
├── eslint.config.js
├── tsconfig.json               App TS config (paths: @/* → src/*)
├── tsconfig.node.json          TS config for Vite's node-side files
├── vite.config.ts
└── _legacy/                    Pre-refactor JSX + HTML, kept for reference (gitignored)
```

## The dev tweaks panel

`src/dev/ZenovaTweaks.tsx` mounts a floating live-tuning panel that adjusts
theme, palette, rotating-word speed, hero background, and section toggles.

It's loaded via a `lazy()` import gated on `import.meta.env.DEV`, so it is
**stripped from production builds** by Rollup's dead-code elimination. To
keep the host-editor handshake working, the persisted tweak defaults live in
`src/config/tweaks.ts` between `/*EDITMODE-BEGIN*/` and `/*EDITMODE-END*/`
markers — keep those literals JSON-shaped.

## Styling

Most components keep inline `style={...}` objects — that matches the original
hand-tuned visual design and avoids breakage during the refactor. Global
CSS (CSS variables for theming, animations, layout primitives, and the
mobile-nav rules) lives in `src/styles/global.css` and is imported once
from `src/main.tsx`.

## Theming

The initial `data-theme` attribute is set in a tiny inline script in
`index.html` *before* paint to avoid a first-frame flash. The `App`
component then keeps it in sync with the `theme` tweak and persists the
choice to `localStorage` under the key `zenova.theme`.

## Notes

- This project has no git history yet — `git init` from the project root
  once you're happy with the refactor.
- `_legacy/` contains the pre-refactor sources (`Zenova.html`,
  `zenova-bundle.jsx`, etc.). It's safe to delete once you've verified the
  port; it's already in `.gitignore`.



claude --resume f391840a-6dde-41e4-878b-fd0e054adfbb 