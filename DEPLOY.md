# Deploying to GitHub Pages

The site auto-deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.

## One-time setup

Before the first deploy works you have to point Pages at the workflow:

1. Open the repo on GitHub → **Settings** → **Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   *(Not "Deploy from a branch" — that serves raw source files, which is what
   caused the `application/octet-stream` MIME error on `.tsx` files.)*
3. Push to `main` (or run the workflow manually from the **Actions** tab).

That's it. The site lives at `https://<owner>.github.io/<repo>/`.

## How the base path is resolved

`vite.config.ts` reads two environment variables:

| Source | What it does |
|---|---|
| `GITHUB_ACTIONS` + `GITHUB_REPOSITORY` | Auto-set by GitHub Actions. Base becomes `/<repo>/` for a project site, or `/` for a `<owner>.github.io` user/org site. |
| `BASE_PATH` (optional) | Manual override if you need a custom base. Example: `BASE_PATH=/foo/ npm run build`. |
| neither | Base stays `/`. Used for local `npm run build`. |

Vite logs the resolved base on every build (`[vite] base=…`). The CI workflow
also fails the build if `dist/index.html` still references raw TypeScript
source — that would mean Pages is serving `.tsx` files instead of the
compiled bundle.

## SPA deep links (`/work/foo`, `/services/web`, etc.)

GitHub Pages doesn't natively support SPA routes. We use a two-file trick:

- `public/404.html` catches the 404, encodes the deep path into a query
  string, and redirects to the project root.
- `index.html` has a tiny script that decodes the query back into a real path
  before React Router boots.

The `404.html` script derives the number of leading base segments from the
URL automatically. If you ever switch to a custom domain or a user/org site
(`<owner>.github.io`), add this to `index.html` and `404.html`:

```html
<meta name="base-segments" content="0" />
```

(Default is `1`, matching a project-site URL.)

## Troubleshooting

**"Failed to load module script … application/octet-stream"**
Pages is serving raw source. Set **Source → GitHub Actions** as above and
re-run the workflow.

**Assets 404 at `/assets/index-XXX.js`**
The base path didn't make it into the build. Look at the workflow run log
for `[vite] base=…`. It should print `/<repo>/`, not `/`.

**Deep links 404 on refresh**
The Pages site is missing `404.html`. Verify `dist/404.html` exists after
the build — it ships from `public/404.html`.
