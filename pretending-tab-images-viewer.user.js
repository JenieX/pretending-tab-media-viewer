// ==UserScript==
// @name           Pretending Tab - Images Viewer
// @namespace      PretendingTab
// @description    Open the full size image when you click the link of that image's page in tab like view. Click toggles the view, right click closes it
// @version        0.01
// @author         FlowrForWar
// @include        *
// @grant          GM_xmlhttpRequest
// @noframes
// @license        MIT
// ==/UserScript==

const supported_websites = ['pixiv.net', 'flickr.com'];
let parentDiv, div, image, state, scrollPosition, directLink, imageWidth, imageHeight;
let ready = !1;

function toggle_tab(show = !1) {
	if (show) {
		scrollPosition = window.scrollY;
		document.body.style.setProperty('overflow', 'hidden', 'important');
		parentDiv.style.removeProperty('display');
	} else {
		parentDiv.style.setProperty('display', 'none');
		document.body.style.removeProperty('overflow');
		window.scrollTo(0, scrollPosition);

		image.removeAttribute('src');
		image.removeAttribute('style');
		directLink = null;
		state = 'exit';
	}
}

function fill_view() {
	console.log('Using fill view');
	image.setAttribute(
		'style',
		[
			'inset: 0; position: absolute',
			imageWidth / imageHeight < window.innerWidth / window.innerHeight && 'width: 100%; height: auto',
			!(imageWidth / imageHeight < window.innerWidth / window.innerHeight) && 'width: auto; height: 100%',
			'max-width: unset !important',
			'max-height: unset !important',
			'min-width: unset !important',
			'min-height: unset !important',
		]
			.filter(Boolean)
			.join(';')
	);

	div.style.setProperty('width', '100%');
	scrollTo(0, 0);
	state = 'fill';
}

function original_view() {
	console.log('Using origianl');
	image.setAttribute(
		'style',
		[
			'inset: 0; position: absolute',
			`width: ${imageWidth}px; height: ${imageHeight}px`,
			'max-width: unset !important',
			'max-height: unset !important',
			'min-width: unset !important',
			'min-height: unset !important',
		]
			.filter(Boolean)
			.join(';')
	);
	div.style.setProperty('width', imageWidth < window.innerWidth ? '100%' : 'max-content');
	if (imageWidth > window.innerWidth && imageHeight > window.innerHeight) {
		parentDiv.scrollTo((parentDiv.scrollWidth - parentDiv.clientWidth) / 2, (parentDiv.scrollHeight - parentDiv.clientHeight) / 2);
	}
	state = 'original';
}

function fit_view() {
	console.log('Using fit view');
	image.setAttribute(
		'style',
		[
			'inset: 0; position: absolute',
			imageWidth / imageHeight > window.innerWidth / window.innerHeight && 'width: 100%; height: auto',
			!(imageWidth / imageHeight > window.innerWidth / window.innerHeight) && 'width: auto; height: 100%',
			'max-width: unset !important',
			'max-height: unset !important',
			'min-width: unset !important',
			'min-height: unset !important',
		]
			.filter(Boolean)
			.join(';')
	);

	div.style.setProperty('width', '100%');
	state = 'fit';
}

function scale_image(event) {
	if (state === 'fit') {
		event.preventDefault();
		fill_view();
	} else if (state === 'fill') {
		if (imageWidth <= innerWidth) event.preventDefault();
		original_view();
	} else if (state === 'original') {
		event.preventDefault();
		fit_view();
	}
	image.style.setProperty('margin', (image.height > window.innerHeight ? '0px ' : '') + 'auto');
}

window.addEventListener('mousedown', event => {
	if (!ready || event.button !== 1 || parentDiv.style.display === 'none') return;
	scale_image(event);
});

window.addEventListener(
	'click',
	async event => {
		if (parentDiv.style.display !== 'none') {
			scale_image(event);
			return;
		}

		const closestAElement = event.target.closest('a');

		if (!ready || !closestAElement || !closestAElement.href || closestAElement.getAttribute('href') === '#' || closestAElement.getAttribute('href').startsWith('javascript')) return;

		event.preventDefault();
		event.stopPropagation();

		const href = closestAElement.href;
		const website = get_website(href);
		// const childImgElement = closestAElement.querySelector('img');

		if (!supported_websites.includes(website)) {
			location.href = href;
			return;
		}

		if (/https:\/\/www\.pixiv\.net\/(en\/)?artworks\/\d+?$/.test(href)) {
			toggle_tab(!0);
			const responseText = (await request(href)).responseText;
			const match = responseText.match(/meta name="preload-data" id="meta-preload-data" content='([^']+)'/);
			if (match) {
				const temp = JSON.parse(match[1]).illust;
				const illust = temp[Object.keys(temp)[0]];
				if (illust.pageCount !== 1 && confirm('There are more images on this link, Open the page as well?')) window.open(href);
				directLink = illust.urls.original;
			}
		} else if (/https:\/\/www\.flickr\.com\/photos\/[^/]+\/\d/.test(href)) {
			toggle_tab(!0);
			const responseText = (await request(href)).responseText;
			const match = responseText.match(/sizesForAlbum":(\{.+\}),"visibilitySource/);
			if (match) {
				const photos = JSON.parse(match[1]);
				const best_photo = photos.o || photos.k || photos.h || photos.l || photos.c || photos.z || photos.m || photos.w || photos.n || photos.s;
				directLink = best_photo.url;
			}
		}

		if (!directLink) {
			location.href = href;
			return;
		}
		image.setAttribute('src', directLink);
		image.style.setProperty('display', 'none');

		// Seems to be the fastest way to get image.naturalWidth and image.naturalHeight
		const hack_1 = setInterval(() => {
			if (image.naturalWidth) {
				imageWidth = Math.round(image.naturalWidth / window.devicePixelRatio);
				imageHeight = Math.round(image.naturalHeight / window.devicePixelRatio);
				clearInterval(hack_1);
				image.style.removeProperty('display');
				if ((imageWidth < innerWidth && imageHeight < innerHeight) || (imageWidth < innerWidth && imageHeight / imageWidth > 3.5)) original_view();
				else fit_view();
				image.style.setProperty('margin', (image.height > window.innerHeight ? '0px ' : '') + 'auto');
			}
		}, 10);
	},
	!0
);

window.addEventListener('contextmenu', event => {
	if (!ready || event.shiftKey || parentDiv.style.display === 'none') return;
	event.preventDefault();
	toggle_tab();
});

function start() {
	parentDiv = document.createElement('div');
	parentDiv.setAttribute('style', 'position:fixed;background-color: #1f1f1f;z-index:3000;top:0;left:0;bottom:0;right:0;overflow: auto;display:none');
	parentDiv.setAttribute('id', 'pretending-tab');

	div = document.createElement('div');
	div.setAttribute('style', 'height: auto;width: max-content;background-color: #1f1f1f;position: absolute;top: 0;left: 0;bottom: 0;right: 0;');
	parentDiv.appendChild(div);
	image = document.createElement('img');
	div.appendChild(image);
	document.documentElement.appendChild(parentDiv);
	ready = !0;
}

if (document.readyState !== 'loading') start();
else document.addEventListener('DOMContentLoaded', start);

function get_website(href) {
	try {
		return new URL(href).host
			.split('.')
			.slice(-2)
			.join('.');
	} catch (error) {
		console.log(error);
		return '';
	}
}

function request(url) {
	return new Promise(resolve => {
		GM_xmlhttpRequest({ method: 'GET', url, onload: response => resolve(response) });
	});
}
