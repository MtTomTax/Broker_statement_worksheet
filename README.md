# Montana Broker Statement Adjustment Worksheet

A small, static web tool that replaces the Excel version of the same name. It walks a preparer through the four Montana interest/dividend adjustments from a consolidated 1099 and produces the numbers to enter into TaxSlayer — same math, same wording, in a browser instead of a spreadsheet.

No backend, no build step, no dependencies. It's three files: `index.html`, `styles.css`, `app.js`.

**Data stays local.** Nothing is sent anywhere — all calculations run in the browser, and "Save to this browser" just writes to that browser's `localStorage`. There's no server, no database, no analytics. Client names and dollar amounts never leave the preparer's machine unless *they* export and share the file themselves.

## Run it locally

Just open `index.html` in a browser — that's it, no server needed. Or, if you want a local server (only needed for some browsers' file:// restrictions):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub

1. Create a new repository on GitHub (e.g. `mt-broker-worksheet`) — leave it empty, no README/license.
2. From inside this folder:
   ```bash
   git init
   git add .
   git commit -m "Montana broker statement adjustment worksheet"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/mt-broker-worksheet.git
   git push -u origin main
   ```
3. Optional — host it for free on **GitHub Pages**: repo Settings → Pages → Deploy from branch → `main` / `/ (root)`. It'll be live at `https://YOUR-USERNAME.github.io/mt-broker-worksheet/` within a minute or two.

## Deploy to Netlify

Easiest path — drag and drop, no Git needed:

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag this whole folder onto the page.
3. Netlify gives you a live URL immediately (something like `random-name-123.netlify.app`). You can rename it under Site settings → Domain management.

Or connect it to the GitHub repo for auto-deploys on every push:

1. Push the folder to GitHub first (steps above).
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build command: leave blank. Publish directory: `.` (the `netlify.toml` in this folder already sets this).
4. Deploy — every future `git push` redeploys automatically.

## File map / formula reference

Each calculation mirrors a named cell in the original spreadsheet, so you can sanity-check the logic against the workbook:

| Step | Spreadsheet cell(s) | What it computes |
|---|---|---|
| Step 1 | `F10 = F7` | Box 3 amount, passed straight through as the subtraction |
| Step 2 | `E_i = IF(D≠"",D,IF(C≠"",B*C,0))`, addition `= F8 - SUM(E)` | Per-fund Montana $ from either a direct amount or a %, then the non-Montana remainder |
| Step 3 | `D_i = B - C`, `G_i = IF(F≠"",F,IF(D≠"" AND E≠"",D*E,0))`, subtraction `= SUM(G)` | Dividend distribution net of cap gains, then the U.S. Treasury interest portion of it |
| Step 4 | Same shape as Step 2, addition `= F9 - SUM(G)` | Per-fund Montana $ from either a direct amount or a %, then the non-Montana remainder |

## Customizing

- **Colors/fonts**: everything is driven by CSS custom properties at the top of `styles.css` (`:root { ... }`).
- **Add a row by default**: change `blankRow2()` / `blankRow3()` calls in `defaultState()` in `app.js`.
- **Rename for another state**: the Montana-specific logic (MT bond exemption, non-MT addback) is specific to how Montana treats municipal bond interest — check your state's rule before reusing this for somewhere else.

## Not included on purpose

This tool doesn't validate tax law, doesn't check TaxSlayer field names against the current software version, and doesn't replace a preparer's judgment on whether an adjustment applies. It just does the arithmetic the spreadsheet did.
