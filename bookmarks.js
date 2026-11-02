// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Artem Barkov

/*
 * Pure logic for user-added bookmarks. No DOM, no storage access here:
 * everything that comes in from localStorage or an imported file goes
 * through parse(), everything that comes in from the form goes through
 * validate(). Past that point the data can be trusted.
 *
 * A bookmark is { name, link, img? }. Without img the icon is looked up in
 * an icon repository (dashboard-icons layout: <base>/svg/<name>.svg), then
 * the site's favicon, then a letter. An explicit img replaces the lookup:
 * a repository name ("arch-linux"), a file path or an http(s) URL.
 */
const Bookmarks = (() => {
	const STORAGE_KEY = "b3rryboard.bookmarks";
	const MAX_NAME_LENGTH = 30;
	const ICON_COLOR = "#c4a7e7"; // Rosé Pine iris (--primary)

	const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

	// Returns the canonical https/http link, or null if input is not a web link
	const normalizeLink = (input) => {
		if (typeof input !== "string") return null;
		const trimmed = input.trim();
		if (trimmed === "") return null;

		try {
			const url = new URL(SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`);
			return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
		} catch {
			return null;
		}
	};

	const REPOSITORY_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
	const SAFE_PATH = /^(?!\/\/)[^\s"'<>\\:]+$/;
	const MAX_ICON_LENGTH = 2048;

	// Returns { ok, img } where img is undefined when no icon was given
	const validateIcon = (input) => {
		if (input === undefined || input === null) return { ok: true };
		if (typeof input !== "string") return { ok: false };

		const img = input.trim();
		if (img === "") return { ok: true };
		if (img.length > MAX_ICON_LENGTH) return { ok: false };
		if (SAFE_PATH.test(img)) return { ok: true, img };

		// Anything with a scheme must be a real http(s) URL
		try {
			const url = new URL(img);
			const isWeb = url.protocol === "http:" || url.protocol === "https:";
			return isWeb && !/[\s"'<>\\]/.test(img) ? { ok: true, img } : { ok: false };
		} catch {
			return { ok: false };
		}
	};

	const validate = (input) => {
		if (input === null || typeof input !== "object") {
			return { ok: false, error: "Invalid bookmark." };
		}

		const name = typeof input.name === "string" ? input.name.trim() : "";
		if (name === "") {
			return { ok: false, error: "Name is required." };
		}
		if (name.length > MAX_NAME_LENGTH) {
			return { ok: false, error: `Name must be at most ${MAX_NAME_LENGTH} characters.` };
		}

		const link = normalizeLink(input.link);
		if (link === null) {
			return { ok: false, error: "Link must be a valid http or https URL." };
		}

		const icon = validateIcon(input.img);
		if (!icon.ok) {
			return { ok: false, error: "Icon must be an icon name, a file path or an http(s) URL." };
		}

		const bookmark = { name, link };
		if (icon.img !== undefined) bookmark.img = icon.img;
		return { ok: true, bookmark };
	};

	// Merges one candidate into a list; never mutates, never adds a link twice
	const add = (list, input, builtins = []) => {
		const result = validate(input);
		if (!result.ok) {
			return { ok: false, error: result.error, list };
		}

		const taken = new Set([...list, ...builtins].map((card) => normalizeLink(card.link)));
		if (taken.has(result.bookmark.link)) {
			return { ok: false, error: "That link is already on the board.", list };
		}

		return { ok: true, list: [...list, result.bookmark] };
	};

	const addAll = (list, incoming, builtins = []) => {
		let current = list;
		let added = 0;
		for (const candidate of incoming) {
			const result = add(current, candidate, builtins);
			if (result.ok) {
				current = result.list;
				added += 1;
			}
		}
		return { list: current, added, skipped: incoming.length - added };
	};

	// Reads untrusted text (localStorage or an imported file), never throws
	const parse = (raw) => {
		let data;
		try {
			data = JSON.parse(raw);
		} catch {
			return [];
		}
		return Array.isArray(data) ? addAll([], data).list : [];
	};

	const remove = (list, link) => {
		const target = normalizeLink(link);
		return list.filter((bookmark) => normalizeLink(bookmark.link) !== target);
	};

	const serialize = (list) => JSON.stringify(list, null, "\t");

	const escapeXml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

	// Cards the user adds have no icon file, so they get their first letter
	const letterIcon = (name) => {
		const letter = escapeXml((Array.from(name.trim())[0] || "?").toUpperCase());
		const svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
			'<text x="50" y="50" text-anchor="middle" dominant-baseline="central" ' +
			`font-family="sans-serif" font-size="72" font-weight="700" fill="${ICON_COLOR}">` +
			`${letter}</text></svg>`;
		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	};

	// "Tuta Mail" -> "tuta-mail", the naming used by dashboard-icons
	const slug = (text) => text
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

	// "https://wiki.archlinux.org" -> "archlinux"; nothing for IPs and "localhost"
	const domainSlug = (link) => {
		const host = new URL(link).hostname;
		const labels = host.split(".");
		if (host.startsWith("[") || IPV4.test(host) || labels.length < 2) return "";
		return slug(labels[labels.length - 2]);
	};

	const repositoryIcons = (base, name) => [`${base}/svg/${name}.svg`, `${base}/png/${name}.png`];

	// Every URL to try for a card's icon, in order; the last one never fails
	const iconSources = (card, base) => {
		const fallback = letterIcon(card.name);

		if (card.img) {
			return REPOSITORY_NAME.test(card.img)
				? [...repositoryIcons(base, card.img), fallback]
				: [card.img, fallback];
		}

		const names = [...new Set([slug(card.name), domainSlug(card.link)])].filter(Boolean);
		return [
			...names.flatMap((name) => repositoryIcons(base, name)),
			`${new URL(card.link).origin}/favicon.ico`,
			fallback
		];
	};

	return { STORAGE_KEY, normalizeLink, validate, add, addAll, parse, remove, serialize, letterIcon, slug, iconSources };
})();

if (typeof module !== "undefined" && module.exports) {
	module.exports = Bookmarks;
}
