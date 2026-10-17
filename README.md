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

The contact details in `src/data/company.ts` come from the supplied business card: Roman Aloshyn, +1 (403) 708-6905, and 17hvac@gmail.com. The phone and email are clickable and included in the business JSON-LD. To override them or configure a custom domain, copy `.env.example` to `.env`:

```dotenv
SITE_URL=https://your-company-domain.ca
PUBLIC_CONTACT_EMAIL=17hvac@gmail.com
PUBLIC_CONTACT_PHONE="+1 (403) 708-6905"
```

Rebuild after changing these values. The actual domain is used for canonical, Open Graph, sitemap, robots and JSON-LD URLs. Do not deploy example contact information.

Without an email address, the form downloads an enquiry text file and explicitly says it has not been sent. With an email address, it opens a reviewable `mailto:` draft in the visitor's email app. For automatic delivery, connect a real form backend and update the explanatory copy; this version does not claim server delivery.

## Google reviews

The customer feedback section links to the company Google Maps profile supplied by the owner. The same profile is linked in the contact section and business JSON-LD. Override its URL with `PUBLIC_GOOGLE_MAPS_URL` if needed.

This first version does not fetch or display review text, ratings or review counts. No Google API credentials were supplied. Automatic review loading is a separate integration: [Google Maps JavaScript Place reviews](https://developers.google.com/maps/documentation/javascript/place-reviews) requires a configured Google Cloud project and website-restricted API key. Google Places returns a limited selection of reviews rather than the entire review history; author and Google attribution must accompany API content. Keep the static site lightweight by loading that integration only when the section is needed.

## Design and performance

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
