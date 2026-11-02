# B3rryBoard

My browser start page: a greeting with the date and time, a search bar, a small widget with the health of my server, and quick links to my self-hosted services and the sites I use most.

## Features

- **Self-hosted search.** The search bar sends queries to my own SearXNG instance.
- **Automatic grouping.** Links are sorted into two groups: services hosted on my own domain go under *Selfhosted*, everything else under *Bookmarks*.
- **Bookmarks from the page.** The *+* card at the end of *Bookmarks* opens a dialog to add a link. Added links are kept in the browser (`localStorage`), can be removed with the *×* on their card, and can be exported to and imported from a JSON file.
- **Icons without files.** Cards without an icon get one from [dashboard-icons](https://github.com/homarr-labs/dashboard-icons), looked up by name and then by domain, then the site's favicon, then a letter. An explicit icon always wins: an icon name from the repository, a file path or a URL.
- **Server widget.** CPU, memory, temperature, uptime, RAID arrays, disk usage and the response time of each service, read from a small collector running on the server. It goes yellow or red on high values, greys out when the data stops updating, and stays hidden when the collector is not installed.
- **Status dots.** Each self-hosted service shows a dot that turns blue when it answers and red when it doesn't, so I can see at a glance if something is down.
- **Clock and date** that update live.
- **Personal page link** in the header.
- **Rosé Pine theme** (main, dark), matching the rest of my setup.
- **Responsive.** On narrow screens the header collapses to the clock and date.
- **No dependencies.** Plain HTML, CSS and JavaScript; no framework, no build step.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure: header, search bar, card container |
| `styles.css` | Layout and the Rosé Pine color palette |
| `app.js` | Settings, the list of links, everything that builds the page: cards, dialog, icons, Server widget, clock |
| `bookmarks.js` | Logic for added bookmarks and icon lookup, no page code |
| `monitor.js` | Logic for the Server widget: reading `stats.json`, thresholds, text, no page code |
| `icons/` | Local icons used by the links in `CARDS` |
| `server/` | The collector for the Server widget; runs on the server, not in the browser |

`server/` holds:

| File | Purpose |
| --- | --- |
| `b3rry-stats` | Bash script that writes `stats.json` every 10 seconds |
| `b3rry-stats.service` | systemd unit for it |
| `services.example` | The services whose response time is measured |
| `nginx-stats.conf` | nginx snippet that serves `stats.json` to the page |

## Editing

- **Links:** add, remove or reorder entries in the `CARDS` array at the top of `app.js`. Each entry needs a `name` and a `link`. `img` is optional: an icon name from dashboard-icons (`arch-linux`), a path (`./icons/x.svg`) or a URL. Without it the icon is looked up automatically.
- **Links from the page:** use the *+* card. These live only in the browser that added them; use *Export* and *Import* in the dialog to move them.
- **Icon source:** `ICON_REPOSITORY` in `app.js`. Point it at your own copy of dashboard-icons to avoid requests to jsDelivr.
- **Name in the greeting:** change `NAME` in `app.js`.
- **Colors:** all colors are CSS custom properties in `:root` at the top of `styles.css`.
- **Widget limits:** the yellow and red thresholds are in `THRESHOLDS` at the top of `monitor.js`.

## Server widget

The page reads `/stats.json` from its own server. The collector writing it needs `bash`, `jq`, `curl` and util-linux (`findmnt`), all available on Debian 12. RAID arrays are read from `/proc/mdstat` (mdadm).

```sh
sudo apt install jq curl
sudo useradd --system --no-create-home --shell /usr/sbin/nologin b3rry-stats
sudo install -m 755 server/b3rry-stats /usr/local/bin/
sudo install -D -m 644 server/services.example /etc/b3rry-stats/services
sudo install -m 644 server/b3rry-stats.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now b3rry-stats
jq . /run/b3rry-stats/stats.json
```

Then:

1. Edit `/etc/b3rry-stats/services`: one service per line, the URL last (`http://`, `https://` or `tcp://host:port`).
2. Paste `server/nginx-stats.conf` into the `server { }` block that serves the page, and set the allowed subnets to your VPN and LAN.
3. Check and reload nginx: `sudo nginx -t && sudo systemctl reload nginx`.

The file lives in `/run` (tmpfs), so writing it every 10 seconds causes no disk writes. Service checks run every 30 seconds. Both intervals, the reported disks and the check timeout are set with `Environment=` lines in the unit; see the top of `server/b3rry-stats`.

If the page is deployed by cloning this repository into the web root, keep `server/` and `.git/` out of reach:

```nginx
location ~ ^/(\.git|server)/ {
	deny all;
}
```

## License

The code is released under the GNU General Public License v3.0 (see `LICENSE`). Service and brand icons in `icons/`, and icons loaded from dashboard-icons, belong to their respective owners and are not covered by it.
