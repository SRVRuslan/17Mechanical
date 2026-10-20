# 17 Mechanical HVAC/R Ltd.

Responsive, single-page residential and commercial HVAC website for Calgary and surrounding areas, built with Astro and TypeScript. The supplied logo is preserved in `src/assets/company-logo.jpeg` and `public/company-logo.jpeg`. The header, footer, favicon and JSON-LD use `company-emblem.png`: the central emblem extracted with built-in imagegen, with the outer circular lettering removed and a transparent background. The edit prompt is saved in `src/assets/company-emblem.prompt.md`.

## Run locally

Use Node.js 22.12 or newer:

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
npm run preview
```

The production site is a static build in `dist/`; it does not require a server adapter.

## Company details

The company contact details in `src/data/company.ts` come from the supplied business card: +1 (403) 708-6905 and 17hvac@gmail.com. The phone and email are clickable and included in the business JSON-LD. To override them or configure a custom domain, copy `.env.example` to `.env`:

```dotenv
SITE_URL=https://your-company-domain.ca
PUBLIC_CONTACT_EMAIL=17hvac@gmail.com
PUBLIC_CONTACT_PHONE="+1 (403) 708-6905"
```

Rebuild after changing these values. The actual domain is used for canonical, Open Graph, sitemap, robots and JSON-LD URLs. Do not deploy example contact information.

Without an email address, the form downloads an enquiry text file and explicitly says it has not been sent. With an email address, it opens a reviewable `mailto:` draft in the visitor's email app. For automatic delivery, connect a real form backend and update the explanatory copy; this version does not claim server delivery.

## Google reviews

The customer feedback section has separate links to the company Google Maps profile, Google review viewer, and Google review form. The review links use the company Place ID `ChIJV2Io1Ps3ri8RP6Zr7v5dtGI`, verified against its Google profile (CID `7112413061027964479`). Writing a review requires Google sign-in. The same profile is linked in the contact section and business JSON-LD. Override the destinations with `PUBLIC_GOOGLE_MAPS_URL`, `PUBLIC_GOOGLE_REVIEWS_URL`, and `PUBLIC_GOOGLE_WRITE_REVIEW_URL` if needed; when changing businesses, update all three together.

Automatic loading uses [Google Maps JavaScript Place reviews](https://developers.google.com/maps/documentation/javascript/place-reviews) and the new `Place.fetchFields` API. When the visitor approaches the section, the site requests the current rating, total review count, up to five reviews selected by Google in relevance order, and provider attributions. Author names, profile links, photos when available, dates, review links and Google Maps attribution accompany the reviews. Each new page visit fetches fresh data; it does not poll in the background, cache API content in browser storage, or require a scheduled build.

To activate locally:

1. In a Google Cloud project, enable billing, **Maps JavaScript API** and **Places API (New)**. Create a browser API key. Google may charge for the requested review fields; configure quotas in that project.
2. Restrict the key to these APIs and **Websites (HTTP referrers)**. For development allow `http://localhost:4321/*` and `http://127.0.0.1:4321/*`; for publication add the exact public website origin. Do not use a server key: the browser key is intentionally public.
3. Add `PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key` to the ignored `.env` file. `PUBLIC_GOOGLE_PLACE_ID` defaults to `ChIJV2Io1Ps3ri8RP6Zr7v5dtGI` for this company. Restart the dev server after changing `.env`; rebuild for a static production deployment. No key was supplied or committed with this integration.
4. Open `http://localhost:4321/#reviews`. A successful response replaces the dated fallback and shows customer reviews. Invalid keys, denied requests, missing APIs, network failures and a 15-second timeout retain the dated fallback with a link to Google. A genuine response with zero reviews removes the previous rating instead of showing stale review counts.

Without a configured key, no Google SDK or API request is made. The fallback rating (5.0, 5 reviews, dated October 17, 2026) is a manual snapshot from the owner's Google Maps screenshot, stored in `src/data/google-reviews.ts`. It is labelled with its date and does not update automatically. The supplied short profile link resolves to the same company CID and Place ID used by the review buttons. Update the snapshot and its date together after verifying the latest profile; review text is not copied or invented. See Google's [API security guidance](https://developers.google.com/maps/api-security-best-practices) and [attribution policies](https://developers.google.com/maps/documentation/javascript/policies) before activating a public deployment.

## Design and performance

The services photo gallery uses 33 unique owner-supplied images from `Downloads/12` and `Downloads/7`, copied into `src/assets/gallery/`. One exact duplicate from folder `7` is omitted. It supports horizontal touch scrolling, centered previous/pause/next controls, keyboard navigation, and a full-screen image viewer with an additional 2× zoom. Automatic scrolling advances every two seconds while the gallery is visible and returns to the beginning after the final photos. It pauses on mouse hover, keyboard focus, touch interaction, an open viewer, and hidden browser tabs. Visitors can stop/resume it; reduced-motion preferences disable automatic playback by default. Escape and the close button dismiss the viewer and restore focus; image links remain usable without JavaScript. Astro produces responsive WebP thumbnails and larger viewer images, loaded only as needed. Update the gallery order and descriptions in `src/data/gallery.ts`.

- Brand colours: white `#FFFFFF`, orange `#F65607`, black `#040404`, silver `#BDBBBC`, royal blue `#0562E4`.
- Original logo, generated editorial hero and mechanical-room images, and an edited technician image. The About image preserves the original generated mechanic and rooftop equipment; its background was replaced with a Calgary skyline based on a real photograph by [Mahesh Gupta on Unsplash](https://unsplash.com/photos/a-city-with-a-river-running-through-it-Q3hxoJk4Sgw), using built-in imagegen. It is an illustrative composite, not an unaltered documentary photo or a photograph of company staff. See `src/assets/ATTRIBUTION.md` and `src/assets/technician-calgary.prompt.md` for provenance and the edit prompt.
- Astro Picture components generate responsive AVIF/WebP assets. Only the hero is loaded eagerly; other photographs are lazy-loaded.
- Locally bundled Manrope font; no third-party font request, UI framework or animation library at runtime.
- Flexible grids, fluid typography, mobile menu, visible keyboard focus, skip link, native FAQ accordions and labelled form controls.
- IntersectionObserver section reveals respect reduced motion. Content remains visible without JavaScript.
- JSON-LD includes HVACBusiness, service offers, WebSite and visible FAQ content. No fabricated address, credentials, testimonials, ratings or opening hours.

SEO implementation follows [Astro image documentation](https://docs.astro.build/en/guides/images/) and the [Schema.org HVACBusiness vocabulary](https://schema.org/HVACBusiness).

## Hosting

`.openai/hosting.json` identifies the private Sites deployment. It serves the static `dist/` directory. Keep source credentials out of repository files and environment examples.

The service scope covers residential and commercial properties in Calgary and surrounding areas. Refrigeration remains explicitly commercial. The same service area is stated in the hero, About, FAQ, contacts and business/service JSON-LD, without inventing a radius or specific surrounding towns.
