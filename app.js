// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Artem Barkov

/*****************/
/* EDITABLE INFO */
/*****************/

/* -------------------------------------------------------- */

const NAME = "R1ck";

// Icons for cards without "img" come from here (dashboard-icons layout:
// <base>/svg/<name>.svg). Point it at your own mirror to self-host them.
const ICON_REPOSITORY = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons";

// Server widget: reads the file written by server/b3rry-stats.
// The widget stays hidden when the file does not exist.
const MONITOR_URL = "./stats.json";

// "img" is optional and replaces the lookup: an icon name from the
// repository ("arch-linux"), a file path ("./icons/x.svg") or a URL.

const CARDS = [
	{
		name: "NextCloud",
		link: "https://cloud.h0stb3rry.org",
		img: "./icons/cl0udb3rry.png"
	},
	{
		name: "Invidious",
		link: "https://iv.h0stb3rry.org",
		img: "invidious"
	},
	{
		name: "RedLib",
		link: "https://redlib.h0stb3rry.org",
		img: "redlib"
	},
	{
		name: "Vaultwarden",
		link: "https://vault.h0stb3rry.org",
		img: "vaultwarden"
	},
	{
		name: "Forgejo",
		link: "https://git.h0stb3rry.org",
		img: "forgejo"
	},
	{
		name: "SearXNG",
		link: "https://search.h0stb3rry.org",
		img: "searxng"
	},
	{
		name: "Syncthing",
		link: "https://sync.h0stb3rry.org",
		img: "syncthing"
	},
];

/* -------------------------------------------------------- */

/******************/
/* CLOCK FUNCTION */
/******************/
const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const updateDate = () => {
	// Create a new Date object and get the complete Date/Time information
	const completeDate = new Date();

	// Time Variables
	let currentHour = formatDigit(completeDate.getHours());
	let currentMinute = formatDigit(completeDate.getMinutes());

	// Date Variables
	let currentDay = completeDate.getDay();
	let currentNumber = completeDate.getDate();
	let currentMonth = completeDate.getMonth();
	let currentYear = completeDate.getFullYear();

	// Update the Time
	currentTime.innerHTML = `${currentHour}:${currentMinute}`;

	// Update the Date
	currentDate.innerHTML = `${DAYS[currentDay]} ${currentNumber}, ${MONTHS[currentMonth]} ${currentYear}`;

	// Create a Loop
	setTimeout(() => {
		updateDate();
	}, 1000);
};

const formatDigit = (digit) => {
	return digit > 9 ? `${digit}` : `0${digit}`;
};


/***********************/
/* ICON CARDS FUNCTION */
/***********************/

// Regular expression to identify links belonging to h0stb3rry.org
const regex = /^(https?:\/\/)?([a-z0-9-]+\.)*h0stb3rry\.org/;

// Bookmarks added from the page live in localStorage (logic in bookmarks.js)
const loadStored = () => {
	try {
		return Bookmarks.parse(localStorage.getItem(Bookmarks.STORAGE_KEY));
	} catch (error) {
		console.error("Error reading bookmarks from storage:", error);
		return [];
	}
};

const saveStored = (list) => {
	try {
		localStorage.setItem(Bookmarks.STORAGE_KEY, Bookmarks.serialize(list));
		return true;
	} catch (error) {
		console.error("Error saving bookmarks to storage:", error);
		return false;
	}
};

let storedBookmarks = loadStored();

// Saves first, so the page never gets ahead of what is actually stored
const commitBookmarks = (list) => {
	if (!saveStored(list)) return false;
	storedBookmarks = list;
	printCards();
	return true;
};

const removeStored = (link) => commitBookmarks(Bookmarks.remove(storedBookmarks, link));

const allCards = () => [
	...CARDS,
	...storedBookmarks.map((bookmark) => ({ ...bookmark, custom: true }))
];

// One request per link, so redrawing the cards does not ping every service again
const statusCache = new Map();

const checkStatus = (link) => {
	if (!statusCache.has(link)) {
		statusCache.set(link, fetch(link)
			.then(response => response.status >= 200 && response.status < 300)
			.catch(error => {
				console.error("Error fetching webpage status:", error);
				return false;
			}));
	}
	return statusCache.get(link);
};

// Remembers which source worked, so redrawing does not walk the fallbacks again
const iconCache = new Map();

const applyIcon = (image, card) => {
	const key = `${card.name}\n${card.link}\n${card.img || ""}`;
	if (iconCache.has(key)) {
		image.onload = image.onerror = null; // the preview image is reused
		image.src = iconCache.get(key);
		return;
	}

	const sources = Bookmarks.iconSources(card, ICON_REPOSITORY);
	let next = 0;
	image.onload = () => iconCache.set(key, sources[next]);
	image.onerror = () => {
		next += 1;
		if (next < sources.length) image.src = sources[next];
	};
	image.src = sources[0];
};

const printCards = () => {
	// Create separate containers for each category
	let selfhostedContainer = document.createElement("div");
	selfhostedContainer.classList.add("category__container");

	let bookmarksContainer = document.createElement("div");
	bookmarksContainer.classList.add("category__container");

	// Create category titles
	let selfhostedTitle = document.createElement("div");
	selfhostedTitle.textContent = "Selfhosted";
	selfhostedTitle.classList.add("category__title");
	selfhostedContainer.appendChild(selfhostedTitle);

	let bookmarksTitle = document.createElement("div");
	bookmarksTitle.textContent = "Bookmarks";
	bookmarksTitle.classList.add("category__title");
	bookmarksContainer.appendChild(bookmarksTitle);

	// Loop through the built-in and user-added cards and categorize them
	for (const card of allCards()) {
		let currentCard = document.createElement("a");
		let currentCardText = document.createElement("p");
		currentCardText.appendChild(document.createTextNode(card.name));

		// Icon: image file
		let currentCardIcon = document.createElement("p");
		let iconImage = document.createElement("img");
		applyIcon(iconImage, card);
		iconImage.setAttribute("alt", "");
		currentCardIcon.appendChild(iconImage);

		// Style the Card Element
		currentCard.classList.add("card");
		currentCard.href = card.link;

		// Style the Icon
		currentCardIcon.classList.add("card__icon");

		// Style the Text
		currentCardText.classList.add("card__name");

		// Status dot (colors are set in styles.css)
		let notification = document.createElement("div");
		notification.classList.add("card__notification");
		currentCard.appendChild(notification);

		currentCard.append(currentCardIcon);
		currentCard.append(currentCardText);

		// Only cards added from the page can be removed from it
		if (card.custom) {
			currentCard.append(createRemoveButton(card));
		}

		// Determine which container the card should go into
		if (regex.test(card.link)) {
			// Add to selfhosted container
			selfhostedContainer.appendChild(currentCard);

			// Check the status of the selfhosted links for the notification color
			checkStatus(card.link).then(isUp => {
				notification.classList.add(isUp ? "card__notification--up" : "card__notification--down");
			});
		} else {
			// Add to bookmarks container
			bookmarksContainer.appendChild(currentCard);
		}
	}

	// The add card always closes the bookmarks group
	bookmarksContainer.appendChild(createAddCard());

	// Replace the contents of the card container, so printCards() can run again
	const cardContainer = document.getElementById("card-container");
	cardContainer.replaceChildren(selfhostedContainer, bookmarksContainer);
};

const createAddCard = () => {
	const addCard = document.createElement("a");
	addCard.classList.add("card", "card--add");
	addCard.href = "#";
	addCard.setAttribute("role", "button");
	addCard.setAttribute("aria-label", "Add bookmark");

	const icon = document.createElement("p");
	icon.classList.add("card__icon");
	icon.innerHTML = '<svg class="card__plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

	const text = document.createElement("p");
	text.classList.add("card__name");
	text.textContent = "Add";

	addCard.append(icon, text);

	const open = (event) => {
		event.preventDefault();
		openEditor();
	};
	addCard.addEventListener("click", open);
	addCard.addEventListener("keydown", (event) => {
		if (event.key === " ") open(event);
	});

	return addCard;
};

const createRemoveButton = (card) => {
	const removeButton = document.createElement("span");
	removeButton.classList.add("card__remove");
	removeButton.textContent = "×";
	removeButton.setAttribute("role", "button");
	removeButton.setAttribute("tabindex", "0");
	removeButton.setAttribute("aria-label", `Remove ${card.name}`);

	// The button sits inside the card link, so it must not trigger the link
	const remove = (event) => {
		event.preventDefault();
		event.stopPropagation();
		removeStored(card.link);
	};
	removeButton.addEventListener("click", remove);
	removeButton.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") remove(event);
	});

	return removeButton;
};

/***************************/
/* BOOKMARK EDITOR DIALOG  */
/***************************/

const downloadBookmarks = () => {
	const blob = new Blob([Bookmarks.serialize(storedBookmarks)], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = "b3rryboard-bookmarks.json";
	document.body.appendChild(link);
	link.click();
	link.remove();

	setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const createEditor = () => {
	const dialog = document.createElement("dialog");
	dialog.innerHTML = `
		<form class="bookmark-form">
			<div class="bookmark-form__header">
				<h2>Add bookmark</h2>
				<img class="bookmark-form__preview" alt="" hidden>
			</div>
			<label>Name<input type="text" name="name" maxlength="30" autocomplete="off" required></label>
			<label>URL<input type="text" name="link" inputmode="url" autocomplete="off" placeholder="example.com" required></label>
			<label>Icon<input type="text" name="img" autocomplete="off" placeholder="auto, or arch-linux, ./icons/x.svg, https://..."></label>
			<p class="bookmark-form__message" role="status"></p>
			<div class="bookmark-form__actions">
				<button type="submit" class="pill-button">Add</button>
				<button type="button" class="pill-button" data-action="close">Close</button>
			</div>
			<div class="bookmark-form__actions">
				<button type="button" class="pill-button" data-action="export">Export</button>
				<button type="button" class="pill-button" data-action="import">Import</button>
				<input type="file" accept="application/json,.json" hidden>
			</div>
		</form>`;

	const form = dialog.querySelector("form");
	const message = dialog.querySelector(".bookmark-form__message");
	const fileInput = dialog.querySelector("input[type=file]");
	const preview = dialog.querySelector(".bookmark-form__preview");
	const say = (text) => { message.textContent = text; };
	const SAVE_FAILED = "Could not save: browser storage is blocked.";

	const readForm = () => {
		const data = new FormData(form);
		return { name: data.get("name"), link: data.get("link"), img: data.get("img") };
	};

	// Shows the icon the card will get, once name and URL are valid
	const updatePreview = () => {
		const result = Bookmarks.validate(readForm());
		preview.hidden = !result.ok;
		if (result.ok) applyIcon(preview, result.bookmark);
	};

	let previewTimer;
	form.addEventListener("input", () => {
		clearTimeout(previewTimer);
		previewTimer = setTimeout(updatePreview, 300);
	});

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const result = Bookmarks.add(storedBookmarks, readForm(), CARDS);

		if (!result.ok) {
			say(result.error);
		} else if (!commitBookmarks(result.list)) {
			say(SAVE_FAILED);
		} else {
			form.reset();
			say("");
			dialog.close();
		}
	});

	dialog.addEventListener("click", (event) => {
		const button = event.target.closest("[data-action]");
		const action = button && button.dataset.action;

		if (action === "close") dialog.close();
		if (action === "export") downloadBookmarks();
		if (action === "import") fileInput.click();
	});

	fileInput.addEventListener("change", async () => {
		const file = fileInput.files[0];
		fileInput.value = "";
		if (!file) return;

		const incoming = Bookmarks.parse(await file.text());
		if (incoming.length === 0) {
			say("No valid bookmarks found in that file.");
			return;
		}

		const merged = Bookmarks.addAll(storedBookmarks, incoming, CARDS);
		if (commitBookmarks(merged.list)) {
			say(`Imported ${merged.added}, skipped ${merged.skipped} already on the board.`);
		} else {
			say(SAVE_FAILED);
		}
	});

	document.body.appendChild(dialog);

	// Opens the dialog; the add card calls this
	return () => {
		say("");
		updatePreview();
		dialog.showModal();
	};
};

/*****************/
/* SERVER WIDGET */
/*****************/

const formatClock = (seconds) => {
	const date = new Date(seconds * 1000);
	return `${formatDigit(date.getHours())}:${formatDigit(date.getMinutes())}`;
};

const createTile = (tile) => {
	const box = document.createElement("div");
	box.classList.add("monitor__tile", `monitor__tile--${tile.level}`);

	for (const [part, text] of [["label", tile.label], ["value", tile.value], ["detail", tile.detail]]) {
		const span = document.createElement("span");
		span.classList.add(`monitor__${part}`);
		span.textContent = text;
		box.append(span);
	}

	if (typeof tile.percent === "number") {
		const meter = document.createElement("div");
		meter.classList.add("monitor__meter");
		const fill = document.createElement("div");
		fill.classList.add("monitor__meter-fill");
		fill.style.width = `${Math.min(Math.max(tile.percent, 0), 100)}%`;
		meter.append(fill);
		box.append(meter);
	}
	return box;
};

const createServiceRow = (row) => {
	const item = document.createElement("li");
	item.classList.add("monitor__service", `monitor__service--${row.level}`);

	const dot = document.createElement("span");
	dot.classList.add("monitor__dot");
	const name = document.createElement("span");
	name.textContent = row.name;
	const value = document.createElement("span");
	value.classList.add("monitor__service-value");
	value.textContent = row.value;

	item.append(dot, name, value);
	return item;
};

const createMonitor = () => {
	const section = document.createElement("section");
	section.classList.add("category__container", "monitor");
	section.setAttribute("aria-label", "Server");
	section.hidden = true;

	const title = document.createElement("div");
	title.classList.add("category__title");
	title.textContent = "Server";
	const status = document.createElement("span");
	status.classList.add("monitor__status");
	title.append(status);

	const grid = document.createElement("div");
	grid.classList.add("monitor__grid");
	const services = document.createElement("ul");
	services.classList.add("monitor__services");

	section.append(title, grid, services);
	document.getElementById("card-container").before(section);

	let last = null; // last good stats, kept when a request fails
	let timer;

	const draw = () => {
		section.hidden = last === null;
		if (last === null) return;

		grid.replaceChildren(...Monitor.tiles(last).map(createTile));
		services.replaceChildren(...Monitor.serviceRows(last).map(createServiceRow));
		services.hidden = last.services.length === 0;

		const stale = Monitor.isStale(last, Date.now() / 1000);
		section.classList.toggle("monitor--stale", stale);
		status.textContent = stale ? `no data since ${formatClock(last.time)}` : "";
	};

	const poll = async () => {
		clearTimeout(timer);
		try {
			const response = await fetch(MONITOR_URL, { cache: "no-store" });
			// Not set up on this server: stay hidden and stop asking
			if (response.status === 404 && last === null) return;
			if (response.ok) {
				const stats = Monitor.parse(await response.json());
				if (stats) last = stats;
			}
		} catch (error) {
			console.error("Error fetching server stats:", error);
		}
		draw();
		// Background tabs do not poll; coming back polls at once
		if (!document.hidden) {
			timer = setTimeout(poll, (last ? last.interval : 10) * 1000);
		}
	};

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			clearTimeout(timer);
		} else {
			poll();
		}
	});
	poll();
};

/****************/
/* STARTER CODE */
/****************/

userName.innerHTML = NAME;
const openEditor = createEditor();
printCards();
createMonitor();
updateDate();
