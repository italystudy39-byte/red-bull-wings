# Red Bull Wings — 3D flavor showcase

An unofficial, non-commercial fan project: a one-page site with a 3D carousel of Red Bull flavors,
a scroll-driven "story" of the selected can and an animated pour into a glass.

**Not affiliated with, endorsed or sponsored by Red Bull GmbH.** "Red Bull", the double bull logo and the
can designs are trademarks of Red Bull GmbH; product images and nutrition facts are taken from redbull.com
for demonstration only.

## What's inside

- Intro: the "Red Bull" word slams in, the sun rises and two bulls gallop in from the sides
- 3D carousel of 9 flavors (three.js), with official facts per 250 ml can
- Scroll section: the selected can turns while facts change, finale "GIVES YOU WINGS"
- Footer: open the can and pour it into a glass, with foam, bubbles, splashes and synthesized sound

## Structure

```
index.html       markup
css/style.css    styles
js/flavors.js    flavor list (names, colors, facts, images) — edit here
js/carousel.js   3D scenes: carousel, story can, pour
js/bulls.js      bulls intro animation
js/intro.js      intro sequence
js/sound.js      pour sound (Web Audio, no files)
img/             can images
```

## Run locally

It needs a local server (the bulls and textures are processed from images in the browser):

```
npx serve .
```

or `python -m http.server`, then open the printed address.
