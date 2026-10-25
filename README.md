# B3rryBoard

My browser start page: a greeting with the date and time, a search bar, and quick links to my self-hosted services and the sites I use most.

## Features

- **Self-hosted search.** The search bar sends queries to my own SearXNG instance.
- **Automatic grouping.** Links are sorted into two groups: services hosted on my own domain go under *Selfhosted*, everything else under *Bookmarks*.
- **Status dots.** Each self-hosted service shows a dot that turns blue when it answers and red when it doesn't, so I can see at a glance if something is down.
- **Clock and date** that update live.
- **Personal page link** in the header.
- **Rosé Pine theme** (main, dark), matching the rest of my setup.
- **Responsive.** On narrow screens the header collapses to the clock and date.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure: header, search bar, card container |
| `styles.css` | Layout and the Rosé Pine color palette |
| `app.js` | The list of links, card generation, status checks and the clock |
| `icons/` | One icon per link |
| `jquery-3.7.1.min.js` | jQuery, used by the accordion code in `app.js` |

## Editing

- **Links:** add, remove or reorder entries in the `CARDS` array at the top of `app.js`. Each entry needs a `name`, a `link` and an `img` path in `icons/`.
- **Name in the greeting:** change `NAME` in `app.js`.
- **Colors:** all colors are CSS custom properties in `:root` at the top of `styles.css`.

## License

The code is released under the GNU General Public License v3.0 (see `LICENSE`). Service and brand icons in `icons/` belong to their respective owners and are not covered by it.
