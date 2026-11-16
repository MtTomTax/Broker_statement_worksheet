# Montana Broker Statement Adjustment Worksheet

A small, static web tool that replaces the Excel version of the same name. It walks a preparer through the four Montana interest/dividend adjustments from a consolidated 1099 and produces the numbers to enter into TaxSlayer — same math, same wording, in a browser instead of a spreadsheet.

No backend, no build step, no dependencies. It's three files: `index.html`, `styles.css`, `app.js`.

**Data stays local — and isn't saved anywhere at all.** All calculations run in the browser. There's no server, no database, no analytics, and no `localStorage`/`sessionStorage`/cookies either — dollar amounts and fund names exist only in the page's memory while it's open, and disappear the moment you reload, close the tab, or click "New worksheet." That's intentional, for client confidentiality: nothing about a client ever persists on the machine running this. The tool also has no field for the client's name at all — the printout has a blank line for the preparer to handwrite it.

## Both % and $ on one line

If a preparer fills in both the % and the direct $ on the same fund line, the two boxes turn red, a warning appears under the table, and the printout carries the same warning. The math uses the $ amount in that case, as the original spreadsheet did.

## Printing

There is one **Print full worksheet** button (left side, under the step list). It prints a single combined report: Summary first, then the detail for each step that was used, with the **Stmt page** numbers entered for each line. Steps with no entries print as a one-line "Step N – not used". Each section is kept whole, so if everything doesn't fit on one sheet the next section starts cleanly on page 2. Ctrl/Cmd+P prints the same report.

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

## Keyboard navigation in the fund tables

- **Tab / Shift+Tab** — move between cells in browser default order (unchanged, works everywhere).
- **Up / Down** — move to the same column in the row above/below. Overrides the browser's native number-input spinner, since accidentally bumping a dollar value while navigating was worse than losing the spinner.
- **Left / Right** — jump cells too, but only in the Fund name column, and only when the cursor is already at the very start/end of the text. Numeric cells keep native Left/Right for editing digits (number inputs can't reliably report cursor position across browsers, so this is the safe choice there — use Tab to move across them instead).
- **Enter** — moves down a row; Shift+Enter moves up. Pressing Enter on the last row adds a new fund row and drops you straight into it.

## Not included on purpose

This tool doesn't validate tax law, doesn't check TaxSlayer field names against the current software version, and doesn't replace a preparer's judgment on whether an adjustment applies. It just does the arithmetic the spreadsheet did.
