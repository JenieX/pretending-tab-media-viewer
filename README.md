## Pretending Tab - Images Viewer (This info for next update, soon)
A simple User Script that Opens the full size image in tab like view. Offering three view states. Fitting, filling, original, to the view.


Action | Trigger
---|---
**Activate** | left click, on links or hyperlinked images of supported websites
**Deactivate** | right click
**Toggle view** | middle click, left click
**Force context menu** | long right click, right click + shift


Its basic idea is to mimic opening the full size image when you click the link of that image's page, that is supported by this script.

Clicking (or middle clicking) the image, would toggle between three view states. Fitting the view, filling the view, and the original size. Right click, would close the container and get you back. [Here is a video](https://streamable.com/9pj87x) that illustrates that.

Since it's just me using the script, obviously not many links are supported, but if someone is interested in the script, I can add support for few more websites

Here are some notes though:

* I will not be supporting websites that offer NSFW images on their main page
* At some point, I may consider custom rules, like Mouseover Popup Image Viewer has
* Tested on Violentmonkey only, with Edge browser


```JavaScript
const supported_websites = ['pixiv.net', 'flickr.com'];
```

## Similar User Scripts
that offer more features, as this User Script aims to be more simple
* [Mouseover Popup Image Viewer](https://github.com/tophf/mpiv)
* [Picviewer CE+](https://github.com/hoothin/UserScripts/tree/master/Picviewer%20CE%2B)
* [HandyImage](https://github.com/Owyn/HandyImage)
