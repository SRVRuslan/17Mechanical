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

The pages are a static build in `dist/`; a small Cloudflare Worker handles `/api/contact`. No Astro server adapter is required. `npm run dev` starts Astro and the local Worker on port 8788, with the form API proxied through Astro. The normal dev form sends real emails through the verified remote binding and requires Cloudflare login (`npx wrangler login`). Use `npm run dev:preview` for an offline preview that never sends email. `npm run preview:cloudflare` serves the built site and API together; `npm run preview` alone serves only static pages.

## Company details

The company contact details in `src/data/company.ts` come from the supplied business card: +1 (403) 708-6905 and 17hvac@gmail.com. The phone and email are clickable and included in the business JSON-LD. The email is shared by the public site and the Worker in `src/data/contact.ts`. To override the phone or configure a custom domain, copy `.env.example` to `.env`:

```dotenv
SITE_URL=https://your-company-domain.ca
PUBLIC_CONTACT_PHONE="+1 (403) 708-6905"
```

Rebuild after changing these values. The default public URL is `https://17mechanical.ca/`, used for canonical, Open Graph, sitemap, robots and JSON-LD URLs. `SITE_URL` can override it for another deployment. Do not deploy example contact information.

The contact form posts JSON to the same-origin `/api/contact` endpoint. The Worker validates field lengths, email, service, origin and request size, rejects the hidden spam field, and limits requests to five per minute per IP using Cloudflare's rate-limiting binding. The recipient is fixed server-side to **17hvac@gmail.com**, and the sender is **website@17mechanical.ca**. The visitor's address is used only as Reply-To. The public email and the server recipient use the same value from `src/data/contact.ts`. Update it and the verified `send_email.destination_address` together if the inbox changes; a test verifies that they match.

Production delivery uses Cloudflare's native `send_email` binding. Activate Email Routing for `17mechanical.ca` with its required DNS records and verify `17hvac@gmail.com` under Email Service → Destination Addresses. No Gmail password or browser-visible email API key is needed. Cloudflare permits sending to a verified destination on its free plan; see [destination address setup](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/) and the [Workers sending API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/). On October 20, 2026, the destination was verified and Email Routing was enabled with its managed DNS records. A single technical test through the Cloudflare sending API reported delivery to the Gmail recipient. The updated site still needs publication before visitors can use this endpoint.

The button reads “Send”, prevents duplicate submissions while pending, and resets the fields only after the email service accepts the request. Failed delivery retains all entries and shows a retry/direct-email option. The response confirms submission to the service, not that Gmail has placed the message in the inbox. `npm run dev` sends real emails; `npm run dev:preview` and `npm run preview:cloudflare` explicitly disable remote bindings and set `CONTACT_MODE:preview`. Preview never calls the email binding, reports that no email was sent, and retains the fields. Never set this variable on the production Worker. `npm test` covers validation, recipient restrictions, delivery failure, rate limiting and honest preview behavior without sending actual email.

## Google reviews

The customer feedback section has separate links to the company Google Maps profile, Google review viewer, and Google review form. The review links use the company Place ID `ChIJV2Io1Ps3ri8RP6Zr7v5dtGI`, verified against its Google profile (CID `7112413061027964479`). Writing a review requires Google sign-in. The same profile is linked in the contact section and business JSON-LD. Override the destinations with `PUBLIC_GOOGLE_MAPS_URL`, `PUBLIC_GOOGLE_REVIEWS_URL`, and `PUBLIC_GOOGLE_WRITE_REVIEW_URL` if needed; when changing businesses, update all three together.

Automatic loading uses [Google Maps JavaScript Place reviews](https://developers.google.com/maps/documentation/javascript/place-reviews) and the new `Place.fetchFields` API. When the visitor approaches the section, the site requests the current rating, total review count, up to five reviews selected by Google in relevance order, and provider attributions. Author names, profile links, photos when available, dates, review links and Google Maps attribution accompany the reviews. Each new page visit fetches fresh data; it does not poll in the background, cache API content in browser storage, or require a scheduled build.

To activate locally:

1. In a Google Cloud project, enable billing, **Maps JavaScript API** and **Places API (New)**. Create a browser API key. Google may charge for the requested review fields; configure quotas in that project.
2. Restrict the key to these APIs and **Websites (HTTP referrers)**. For development allow `http://localhost:4321/*` and `http://127.0.0.1:4321/*`; for publication add the exact public website origin. Do not use a server key: the browser key is intentionally public.
3. Add `PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key` to the ignored `.env` file. `PUBLIC_GOOGLE_PLACE_ID` defaults to `ChIJV2Io1Ps3ri8RP6Zr7v5dtGI` for this company. Restart the dev server after changing `.env`; rebuild for a static production deployment. No key was supplied or committed with this integration.
4. Open `http://localhost:4321/#reviews`. A successful response replaces the dated fallback and shows customer reviews. Invalid keys, denied requests, missing APIs, network failures and a 15-second timeout retain the dated fallback with a link to Google. A genuine response with zero reviews removes the previous rating instead of showing stale review counts.

The reviews card includes the unmodified official Google Maps attribution asset and links to `/privacy/` and `/terms/`. These pages explain form delivery, the browser-to-Google request and the applicable Google terms. In the Google Cloud project `17 Mechanical` (`mechanical-512304`), no API key or linked billing account was present when checked on October 20, 2026. A key-creation form has been prepared in the authenticated console with website restrictions, but Google requires API selection/activation before it can be saved. No key has been added to the local environment yet. Finish billing setup, enable Maps JavaScript API and Places API (New), and restrict the key to those two APIs before activation.

Without a configured key, no Google SDK or API request is made. The fallback rating (5.0, 5 reviews, dated October 17, 2026) is a manual snapshot from the owner's Google Maps screenshot, stored in `src/data/google-reviews.ts`. It is labelled with its date and does not update automatically. The supplied short profile link resolves to the same company CID and Place ID used by the review buttons. Update the snapshot and its date together after verifying the latest profile; review text is not copied or invented. See Google's [API security guidance](https://developers.google.com/maps/api-security-best-practices) and [attribution policies](https://developers.google.com/maps/documentation/javascript/policies) before activating a public deployment.

## Design and performance

The services photo gallery uses 33 unique owner-supplied images from `Downloads/12` and `Downloads/7`, copied into `src/assets/gallery/`. One exact duplicate from folder `7` is omitted. It supports horizontal touch scrolling, centered previous/pause/next controls, keyboard navigation, and a full-screen image viewer with an additional 2× zoom. Automatic scrolling advances every two seconds while the gallery is visible and returns to the beginning after the final photos. It keeps playing while the mouse hovers over the gallery or clicks its arrow controls. It pauses for keyboard focus, touch interaction, an open viewer, and hidden browser tabs. Visitors can stop/resume it; reduced-motion preferences disable automatic playback by default. Escape and the close button dismiss the viewer and restore focus; image links remain usable without JavaScript. Astro produces responsive AVIF thumbnails with WebP fallbacks and separate, higher-quality WebP viewer images, loaded only as needed. Update the gallery order and descriptions in `src/data/gallery.ts`.

- Brand colours: white `#FFFFFF`, orange `#F65607`, black `#040404`, silver `#BDBBBC`, royal blue `#0562E4`.
- Original logo, generated editorial hero and mechanical-room images, and an edited technician image. The About image preserves the original generated mechanic and rooftop equipment; its background was replaced with a Calgary skyline based on a real photograph by [Mahesh Gupta on Unsplash](https://unsplash.com/photos/a-city-with-a-river-running-through-it-Q3hxoJk4Sgw), using built-in imagegen. It is an illustrative composite, not an unaltered documentary photo or a photograph of company staff. See `src/assets/ATTRIBUTION.md` and `src/assets/technician-calgary.prompt.md` for provenance and the edit prompt.
- Astro Picture components generate responsive AVIF/WebP assets. Only the hero is loaded eagerly; other photographs are lazy-loaded.
- Locally bundled Latin Manrope font, preloaded to avoid a stylesheet-to-font request chain; no third-party font request, UI framework or animation library at runtime.
- Responsive photo and emblem sizes match their rendered widths; thumbnail compression does not change the original files or the higher-quality gallery viewer images.
- `public/_headers` gives content-hashed `/_astro/` assets a one-year immutable browser cache on Cloudflare. HTML keeps the platform's default revalidation behavior.
- Flexible grids, fluid typography, visible keyboard focus, skip link, native FAQ accordions and labelled form controls. The mobile menu closes via its toggle, backdrop, a navigation link, Escape, or page scrolling. It does not lock the page scroll; short screens keep a 48px dismissal area beneath the independently scrollable menu. Keyboard focus stays in the open menu and returns without changing the page scroll position when dismissed.
- IntersectionObserver section reveals respect reduced motion. Content remains visible without JavaScript.
- JSON-LD includes HVACBusiness, service offers, WebSite and visible FAQ content. No fabricated address, credentials, testimonials, ratings or opening hours.

SEO implementation follows [Astro image documentation](https://docs.astro.build/en/guides/images/) and the [Schema.org HVACBusiness vocabulary](https://schema.org/HVACBusiness).

## Hosting

`.openai/hosting.json` identifies the private Sites deployment. It serves the static `dist/` directory. Keep source credentials out of repository files and environment examples.

`wrangler.jsonc` configures the public Cloudflare Worker `17mechanical` to serve `dist/` as static assets. Only `/api/*` is routed to `worker/index.ts` first. Static pages and images keep their generated `_headers` rules; the contact API sets its own no-store/security headers. The Git build uses `npm run build`, followed by `npx wrangler deploy`; the explicit configuration prevents automatic framework/adapter setup during deployment.

The public domain is `https://17mechanical.ca/`. The supplied [PageSpeed report](https://pagespeed.web.dev/analysis/http-17mechanical-ca/w06ljnh54h?form_factor=mobile) tested the HTTP URL and reported that HTTP did not redirect to HTTPS. **Always Use HTTPS** was enabled for the `17mechanical.ca` Cloudflare zone on October 20, 2026; HTTP requests to the apex and `www` were verified to return 301 redirects to HTTPS. Keep this edge setting enabled. It is independent of Git pushes and cannot be configured through Astro's static build or Workers static-asset `_redirects`. See [Cloudflare's Always Use HTTPS documentation](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/).

The report's legacy JavaScript and short cache-TTL findings refer to the Cloudflare Web Analytics beacon, which Cloudflare injects outside the site bundle. The site does not override or disable that analytics integration.

The service scope covers residential and commercial properties in Calgary and surrounding areas. Refrigeration remains explicitly commercial. The same service area is stated in the hero, About, FAQ, contacts and business/service JSON-LD, without inventing a radius or specific surrounding towns.


## Security headers

`npm run build` runs `scripts/security-headers.mjs` after Astro. The script hashes the actual emitted inline scripts, including the inline application bundle and JSON-LD, and inserts the CSP into `dist/_headers`. Always use the full build command before deploying: a plain `astro build` does not generate the CSP. Never edit CSP hashes by hand or deploy the `public/_headers` template directly.

Cloudflare static-asset responses apply the generated CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy: same-origin`, `X-Frame-Options: DENY`, and a one-year HSTS policy. CSP also sets `frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'`, blocks inline event handlers, and upgrades insecure resource URLs. The site is intentionally protected against embedding in frames, including third-party preview frames.

Script execution allows the local bundles, the exact hashes of the built inline scripts, Google Maps API script hosts, and the Cloudflare Analytics beacon. It does not allow arbitrary inline scripts, `eval`, or every HTTPS script host. Inline CSS remains permitted for the existing image/reveal/zoom styles and Google SDK styling. This is a host-and-hash policy that preserves the optional Google SDK and Cloudflare analytics, not a nonce-based strict-dynamic policy.

Trusted Types enforcement blocks unsafe DOM HTML/script sinks in supporting browsers. The Google Maps loader uses a narrowly validated `TrustedScriptURL` policy that only accepts `https://maps.googleapis.com/maps/api/js`. No permissive default HTML policy is created. Browsers without Trusted Types continue using CSP and the existing safe DOM/text APIs. The reviews SDK remains inactive without an API key; supplying a valid key is still required to fetch real reviews.

HSTS applies only to the responding host. `includeSubDomains` and preload enrollment are deliberately omitted so the site does not silently impose permanent HTTPS requirements on unknown future subdomains. No HSTS preload submission is performed. These code-based response headers become live only after publication; the Cloudflare HTTPS redirect is already enabled independently.
