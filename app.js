/*****************/
/* EDITABLE INFO */
/*****************/

/* -------------------------------------------------------- */

const NAME = "R1ck";

const CARDS = [
	{
		name: "NextCloud",
		link: "https://cloud.h0stb3rry.org",
		img: "./icons/cl0udb3rry.png"
	},
	{
		name: "Invidious",
		link: "https://iv.h0stb3rry.org",
		img: "./icons/invidious.svg"
	},
	{
		name: "RedLib",
		link: "https://redlib.h0stb3rry.org",
		img: "./icons/redlib.svg"
	},
	{
		name: "Vaultwarden",
		link: "https://vault.h0stb3rry.org",
		img: "./icons/bitwarden.png"
	},
	{
		name: "Forgejo",
		link: "https://git.h0stb3rry.org",
		img: "./icons/forgejo.svg"
	},
	{
		name: "SearXNG",
		link: "https://search.h0stb3rry.org",
		img: "./icons/searxng.svg"
	},
	{
		name: "Syncthing",
		link: "https://sync.h0stb3rry.org",
		img: "./icons/syncthing.png"
	},
	{
		name: "ArchWiki",
		link: "https://wiki.archlinux.org",
		img: "./icons/archlinux.svg"
	},
	{
		name: "HyprWiki",
		link: "https://wiki.hypr.land",
		img: "./icons/hyprland.svg"
	},
	{
		name: "Deezer",
		link: "https://deezer.com",
		img: "./icons/deezer.svg"
	},
	{
		name: "TutaMail",
		link: "https://app.tuta.com",
		img: "./icons/tuta.svg"
	},
	{
		name: "Z-Library",
		link: "https://z-library.ec",
		img: "./icons/z-library.svg"
	},
	{
		name: "Telegram",
		link: "https://web.telegram.org",
		img: "./icons/telegram.png"
	},
	{
		name: "Claude",
		link: "https://claude.ai",
		img: "./icons/claude.png"
	},
	{
		name: "1337x",
		link: "https://x1337x.eu",
		img: "./icons/1337x.svg"
	},
	{
		name: "Njalla",
		link: "https://njal.la",
		img: "./icons/njalla.svg"
	}
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

	// Loop through the CARDS array and categorize them
	for (const card of CARDS) {
		let currentCard = document.createElement("a");
		let currentCardText = document.createElement("p");
		currentCardText.appendChild(document.createTextNode(card.name));

		// Icon: image file
		let currentCardIcon = document.createElement("p");
		let iconImage = document.createElement("img");
		iconImage.setAttribute("src", card.img);
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

		// Determine which container the card should go into
		if (regex.test(card.link)) {
			// Add to selfhosted container
			selfhostedContainer.appendChild(currentCard);

			// Check the status of the selfhosted links for the notification color
			fetch(card.link)
				.then(response => {
					if (response.status >= 200 && response.status < 300) {
						notification.classList.add("card__notification--up");
					} else {
						notification.classList.add("card__notification--down");
					}
				})
				.catch(error => {
					console.error("Error fetching webpage status:", error);
					notification.classList.add("card__notification--down");
				});
		} else {
			// Add to bookmarks container
			bookmarksContainer.appendChild(currentCard);
		}
	}

	// Append both containers to the card container in the DOM
	const cardContainer = document.getElementById("card-container");
	cardContainer.appendChild(selfhostedContainer);
	cardContainer.appendChild(bookmarksContainer);
};

/****************/
/* STARTER CODE */
/****************/

userName.innerHTML = NAME;
printCards();
updateDate();

$(document).ready(function() {
	var accordionTitle = $('.accordion-title');
	var accordionText = $('.accordion-text');
	var speed = 300;

	accordionTitle.on('click', function() {
		var thisAccordion = $(this);
		var isActive = thisAccordion.hasClass('active');

		if (isActive) {
			thisAccordion
				.removeClass('active')
				.parent().find('.accordion-text').slideUp(speed);
		} else {
			accordionTitle.removeClass('active');
			accordionText.slideUp(speed);
			thisAccordion
				.addClass('active')
				.parent().find('.accordion-text').slideDown(speed);
		}
	});

	if ($(window).width() >= 1024) {
		accordionTitle.first().click();
	}
});
