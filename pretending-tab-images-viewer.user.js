// ==UserScript==
// @name           Pretending Tab - Images Viewer
// @namespace      PretendingTab
// @description    Opens the full size image in tab like view. Offering three view states. Fitting, filling, original.
// @version        0.07
// @author         FlowrForWar
// @include        *
// @grant          GM_xmlhttpRequest
// @grant          GM_setClipboard
// @noframes
// @license        MIT
// ==/UserScript==

const supported_websites = ['pixiv.net', 'flickr.com', 'imdb.com', 'reddit.com', 'redd.it', 'riotpixels.com'];
let parentDiv, div, image, zoomDiv, span, scrollPosition, imageWidth, imageHeight, directLink, state, responseText, match, temp1, temp2, start, end, timeOut;

async function get_image(target, closestAElement, href, childImgElement) {
	switch (!0) {
		// -----------------------------------------------------------------------
		// pixiv.net
		case /https:\/\/www\.pixiv\.net\/(en\/)?artworks\/\d+?$/.test(href):
			toggle_tab(!0);
			responseText = (await async_request(href)).responseText;
			match = responseText.match(/meta name="preload-data" id="meta-preload-data" content='([^']+)'/);
			if (match) {
				temp1 = JSON.parse(match[1]).illust;
				temp2 = temp1[Object.keys(temp1)[0]];
				directLink = temp2.urls.original;
			}
			break;
		// -----------------------------------------------------------------------
		// flickr.com
		case /https:\/\/www\.flickr\.com\/photos\/[^/]+\/\d/.test(href):
			toggle_tab(!0);
			responseText = (await async_request(href)).responseText;
			match = responseText.match(/sizesForAlbum":(\{.+\}),"visibilitySource/);
			if (match) {
				temp1 = JSON.parse(match[1]);
				temp2 = temp1.o || temp1.k || temp1.h || temp1.l || temp1.c || temp1.z || temp1.m || temp1.w || temp1.n || temp1.s;
				directLink = temp2.url;
			}
			break;
		// -----------------------------------------------------------------------
		// imdb.com
		case /https:\/\/www\.imdb\.com\/(name|title)\/[^/]+\/mediaviewer\//.test(href):
			toggle_tab(!0);
			temp1 = (childImgElement || target.closest('.ipc-photo').querySelector('img')).src;
			directLink = temp1.replace(/\._V1.+/, '');
			break;
		// -----------------------------------------------------------------------
		// reddit.com
		case /https:\/\/www\.reddit\.com\/r\/[^/]+\/comments\//.test(href):
			if (childImgElement && /https:\/\/(preview|i)\.redd\.it\//.test(childImgElement.src)) {
				toggle_tab(!0);
				directLink = childImgElement.src.replace(/https:\/\/preview\.redd\.it\/([^?]+)\?.+/, 'https://i.redd.it/$1');
			}
			break;
		// -----------------------------------------------------------------------
		// redd.it
		case /https:\/\/(preview|i)\.redd\.it\//.test(href):
			toggle_tab(!0);
			directLink = href.replace(/https:\/\/preview\.redd\.it\/([^?]+)\?.+/, 'https://i.redd.it/$1');
			break;
		// -----------------------------------------------------------------------
		// riotpixels.com
		case /riotpixels\.com\/games\//.test(href):
			if (childImgElement) {
				toggle_tab(!0);
				directLink = childImgElement.src.replace('jpg.240p.', '');
			}
			break;
	}

	if (!directLink) {
		if (!closestAElement.dataset.fake && !(end - start > 500)) location.href = href;
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
			tweaks();
		}
	}, 10);
}

function toggle_tab(show = !1) {
	if (show) {
		scrollPosition = window.scrollY;
		document.body.style.setProperty('overflow', 'hidden', 'important');
		parentDiv.style.removeProperty('display');
		window.addEventListener('contextmenu', contextmenu);
	} else {
		parentDiv.style.setProperty('display', 'none');
		zoomDiv.style.setProperty('display', 'none');
		document.body.style.removeProperty('overflow');
		window.scrollTo(0, scrollPosition);

		image.removeAttribute('src');
		image.removeAttribute('style');
		window.removeEventListener('contextmenu', contextmenu);
		clearTimeout(timeOut);
		span.innerHTML = '';
		scrollPosition = imageWidth = imageHeight = directLink = state = responseText = match = temp1 = temp2 = start = end = timeOut = null;
	}
}

function fill_view() {
	// console.log('Fill view');
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
	// console.log('Origianl View');
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
	// console.log('Fit view');
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

function tweaks() {
	image.style.setProperty('margin', (image.height > window.innerHeight ? '0px ' : '') + 'auto');
	span.innerHTML = Math.round((image.width / imageWidth) * 100) + '%';
	zoomDiv.style.removeProperty('display');
	timeOut = setTimeout(() => {
		zoomDiv.style.setProperty('display', 'none');
	}, 2500);
}

function scale_image(event) {
	clearTimeout(timeOut);
	switch (state) {
		case 'fit':
			event.preventDefault();
			fill_view();
			break;
		case 'fill':
			if (imageWidth <= innerWidth) event.preventDefault();
			original_view();
			break;
		case 'original':
			event.preventDefault();
			fit_view();
			break;
	}
	tweaks();
}

function create_viewer() {
	parentDiv = document.createElement('div');
	parentDiv.setAttribute('style', 'position:fixed; background-color:#1f1f1f; z-index:30000; inset:0; overflow:auto; display:none');
	parentDiv.setAttribute('id', 'pretending-tab');
	div = document.createElement('div');
	div.setAttribute('style', 'height:auto; width:max-content; background-color:#1f1f1f; position:absolute; inset:0');
	parentDiv.appendChild(div);
	image = document.createElement('img');
	div.appendChild(image);
	document.documentElement.appendChild(parentDiv);

	zoomDiv = document.createElement('div');
	zoomDiv.setAttribute('style', 'position:fixed; background-color:#000; z-index:30001; bottom:10px; right:10px; padding:10px; border-radius:5px; display:none');
	zoomDiv.setAttribute('id', 'pretending-tab-zoom-level');
	span = document.createElement('span');
	span.setAttribute('style', 'font-size:large; font-family:sans-serif; color:#fff');
	zoomDiv.appendChild(span);
	document.documentElement.appendChild(zoomDiv);

	window.addEventListener('mousedown', mousedown);
	window.addEventListener('click', click, !0);
}

if (document.readyState !== 'loading') create_viewer();
else document.addEventListener('DOMContentLoaded', create_viewer);

// -----------------------------------------------------------------------
// Gestures part of the code is by Peer Zeng
// https://greasyfork.org/en/scripts/4776-my-mouse-gestures

const gestures = {
	U: function() {
		parentDiv.scrollTo(0, 0);
	},
	D: function() {
		parentDiv.scrollTo(0, 1073741824);
	},
	LR: function() {
		window.open(image.src);
	},
	RL: function() {
		GM_setClipboard(image.src);
	},
	// RD: function() {},
};

const SENSITIVITY = 3; // 1 ~ 5
const TOLERANCE = 3; // 1 ~ 5

const s = 1 << ((7 - SENSITIVITY) << 1);
const t1 = Math.tan(0.15708 * TOLERANCE),
	t2 = 1 / t1;

let x, y, path;

const tracer = function(e) {
	let cx = e.clientX,
		cy = e.clientY,
		deltaX = cx - x,
		deltaY = cy - y,
		distance = deltaX * deltaX + deltaY * deltaY;
	if (distance > s) {
		let slope = Math.abs(deltaY / deltaX),
			direction = '';
		if (slope > t1) {
			direction = deltaY > 0 ? 'D' : 'U';
		} else if (slope <= t2) {
			direction = deltaX > 0 ? 'R' : 'L';
		}
		if (path.charAt(path.length - 1) !== direction) {
			path += direction;
		}
		x = cx;
		y = cy;
	}
};

// -----------------------------------------------------------------------

function click(event) {
	if (parentDiv.style.display !== 'none') {
		scale_image(event);
		return;
	}

	end = performance.now();
	const { target } = event;

	let closestAElement;
	if (target.closest('a')) closestAElement = target.closest('a');
	else if (target.tagName === 'IMG' && target.src && target.src.startsWith('http')) {
		closestAElement = document.createElement('a');
		closestAElement.setAttribute('href', target.src);
		closestAElement.dataset.fake = !0;
	}

	if (!closestAElement || !closestAElement.href || closestAElement.getAttribute('href') === '#' || closestAElement.getAttribute('href').startsWith('javascript')) {
		return;
	}

	const href = closestAElement.href;
	const website = get_website(href);

	if (!supported_websites.includes(website)) {
		if (end - start > 500) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
		} else if (!closestAElement.dataset.fake) {
			location.href = href;
		}
		return;
	}

	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();

	const childImgElement = closestAElement.querySelector('img');
	get_image(target, closestAElement, href, childImgElement);
}

function contextmenu(event) {
	end = performance.now();
	window.removeEventListener('mousemove', tracer, false);
	if (event.shiftKey || end - start > 500) return;
	event.preventDefault();
	if (path !== '' && gestures.hasOwnProperty(path)) gestures[path]();
	else toggle_tab();
}

function mousedown(event) {
	switch (event.button) {
		// Left Click
		case 0:
			start = performance.now();
			break;
		// Middle Click
		case 1:
			if (parentDiv.style.display !== 'none') scale_image(event);
			break;
		// Right Click
		case 2:
			start = performance.now();
			x = event.clientX;
			y = event.clientY;
			path = '';
			window.addEventListener('mousemove', tracer, false);
			break;
	}
}

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

function async_request(url) {
	return new Promise(resolve => {
		GM_xmlhttpRequest({ method: 'GET', url, onload: response => resolve(response) });
	});
}
