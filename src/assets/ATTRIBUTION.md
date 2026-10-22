# Calgary skyline photograph

- Local asset: `calgary-skyline.jpg`
- Photographer: Mahesh Gupta (@snapper542).
- Location specified by the photographer: Calgary, Alberta, Canada.
- Photo page: https://unsplash.com/photos/a-city-with-a-river-running-through-it-Q3hxoJk4Sgw
- Source image: https://images.unsplash.com/photo-1662099782192-f7ba7bf67236
- Published on Unsplash: September 2, 2022.
- Downloaded: October 11, 2026, at 2000 pixels wide.
- License: Unsplash License, https://unsplash.com/license. The photo page marks this photo as free to use under that license, including commercial use.
- Website use: Background source for the edited About image `technician-calgary.png`. The source skyline JPEG is retained unchanged. Astro produces responsive AVIF and WebP variants of the final composite; CSS adjusts its visible crop.
- The visible skyline credit links to the original photographer's photo page.

# Technician composite

- Local website asset: `technician-calgary.png`.
- Original foreground: the generated mechanic and rooftop HVAC equipment in `technician.png`.
- Background source/reference: `calgary-skyline.jpg`, credited above.
- Built-in imagegen edited the original image using both input images, preserving the person, tools and HVAC equipment and replacing the fictional distant skyline with the Calgary photographic reference.
- This is an AI-assisted illustrative composite; it is not an unaltered photograph of company staff or a documented company project.
- Edit date: October 11, 2026.
- Full prompt: `technician-calgary.prompt.md`.

# Services gallery

- Thirty-three unique images supplied by the owner in `Downloads/12` and `Downloads/7`, added October 19, 2026. One exact duplicate in folder `7` (`Unknown.png`, identical to `Unknown-7.png`) is omitted.
- Source copies are retained in `src/assets/gallery/`; `src/data/gallery.ts` defines their order and descriptions.
- Astro generates responsive AVIF thumbnails with WebP fallbacks and larger WebP images for the viewer. The supplied source images are not altered.
- The gallery is labelled as HVAC/R imagery; it does not assert that every image documents a completed company project.

# Google Maps attribution

- `public/google-maps-attribution.svg` is the unmodified official `GoogleMaps_Logo_DarkGray.svg` from Google's [attribution assets](https://developers.google.com/static/maps/documentation/images/Google_Maps_Attribution_Assets.zip).
- Displayed beside Google reviews at 18px high with the required clear space. Source and usage guidance: https://developers.google.com/maps/documentation/javascript/policies
