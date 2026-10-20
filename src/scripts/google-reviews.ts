/// <reference types="google.maps" />

// Fetch on each page visit near the section; never persist Google content in storage.
type MapsWindow = Window & {
  __mechanicalMapsReady?: () => void;
  gm_authFailure?: () => void;
};

type MapsScriptPolicy = { createScriptURL: (value: string) => unknown };
type TrustedMapsWindow = Window & {
  trustedTypes?: {
    createPolicy: (name: string, rules: { createScriptURL: (value: string) => string }) => MapsScriptPolicy;
  };
};
let mapsScriptPolicy: MapsScriptPolicy | undefined;

function mapsScriptURL(value: string): string {
  const trustedTypes = (window as TrustedMapsWindow).trustedTypes;
  if (!trustedTypes) return value;
  mapsScriptPolicy ??= trustedTypes.createPolicy('17mechanical-google-maps', {
    createScriptURL(input) {
      const url = new URL(input);
      if (url.origin !== 'https://maps.googleapis.com' || url.pathname !== '/maps/api/js'
        || url.username || url.password) {
        throw new TypeError('Only the Google Maps API script is allowed');
      }
      return url.href;
    },
  });
  // lib.dom types script.src as string; the runtime value remains TrustedScriptURL.
  return mapsScriptPolicy.createScriptURL(value) as string;
}

async function loadPlaces(key: string): Promise<google.maps.PlacesLibrary> {
  if (typeof google !== 'undefined' && google.maps?.importLibrary) {
    return google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>;
  }
  await new Promise<void>((resolve, reject) => {
    const mapsWindow = window as MapsWindow;
    const previousAuthFailure = mapsWindow.gm_authFailure;
    mapsWindow.__mechanicalMapsReady = () => {
      delete mapsWindow.__mechanicalMapsReady;
      resolve();
    };
    mapsWindow.gm_authFailure = () => {
      previousAuthFailure?.();
      reject(new Error('Google Maps authentication failed'));
    };
    const script = document.createElement('script');
    const params = new URLSearchParams({
      key, v: 'weekly', loading: 'async', language: 'en', region: 'CA',
      callback: '__mechanicalMapsReady',
    });
    script.src = mapsScriptURL(`https://maps.googleapis.com/maps/api/js?${params}`);
    script.async = true;
    script.onerror = () => reject(new Error('Google Maps could not load'));
    document.head.append(script);
  });
  return google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>;
}

async function withTimeout<T>(request: Promise<T>): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error('Google reviews timed out')), 15000);
      }),
    ]);
  } finally {
    window.clearTimeout(timer);
  }
}

function externalLink(href: string | null | undefined, text: string): HTMLAnchorElement | HTMLSpanElement {
  let url: URL | undefined;
  try { url = new URL(href || ''); } catch { /* Plain text when no usable URL is supplied. */ }
  if (!url || url.protocol !== 'https:') {
    const span = document.createElement('span');
    span.textContent = text;
    return span;
  }
  const link = document.createElement('a');
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = text;
  link.setAttribute('aria-label', `${text} (opens in a new tab)`);
  return link;
}

function renderReview(review: google.maps.places.Review): HTMLElement | null {
  const author = review.authorAttribution;
  if (!author?.displayName) return null;
  const article = document.createElement('article');
  article.className = 'google-review';
  const header = document.createElement('div');
  header.className = 'google-review-author';
  if (author.photoURI?.startsWith('https://')) {
    const photo = document.createElement('img');
    photo.src = author.photoURI;
    photo.alt = '';
    photo.width = photo.height = 36;
    photo.loading = 'lazy';
    photo.referrerPolicy = 'no-referrer';
    header.append(photo);
  }
  header.append(externalLink(author.uri, author.displayName));
  article.append(header);
  const meta = document.createElement('div');
  meta.className = 'google-review-meta';
  if (typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5) {
    const score = document.createElement('span');
    score.className = 'google-review-score';
    score.textContent = `${review.rating} / 5`;
    score.setAttribute('aria-label', `${review.rating} out of 5 stars`);
    meta.append(score);
  }
  if (review.publishTime instanceof Date && !Number.isNaN(review.publishTime.getTime())) {
    const time = document.createElement('time');
    time.dateTime = review.publishTime.toISOString();
    time.textContent = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(review.publishTime);
    meta.append(time);
  }
  article.append(meta);
  if (review.text || review.originalText) {
    const text = document.createElement('p');
    text.className = 'google-review-text';
    text.textContent = review.text || review.originalText;
    const language = review.text ? review.textLanguageCode : review.originalTextLanguageCode;
    if (language) text.lang = language;
    article.append(text);
  }
  if (review.googleMapsURI) article.append(externalLink(review.googleMapsURI, 'View review on Google Maps'));
  return article;
}

function renderPlace(section: HTMLElement, place: google.maps.places.Place) {
  const summary = section.querySelector<HTMLElement>('[data-google-rating]')!;
  const date = section.querySelector<HTMLElement>('[data-rating-date]')!;
  const count = place.userRatingCount;
  if (!Number.isInteger(count) || count == null || count < 0) throw new Error('Missing Google review count');
  if (count > 0 && (typeof place.rating !== 'number' || place.rating < 1 || place.rating > 5)) {
    throw new Error('Missing Google rating');
  }
  summary.hidden = count === 0;
  if (count > 0) {
    const rating = place.rating!;
    summary.querySelector('strong')!.textContent = rating.toFixed(1);
    summary.querySelector('.google-rating-count')!.textContent = `${count} Google ${count === 1 ? 'review' : 'reviews'}`;
    summary.querySelector<HTMLElement>('.google-rating-stars')!.style.setProperty('--rating-fill', `${rating / 5 * 100}%`);
    summary.setAttribute('aria-label', `${rating.toFixed(1)} out of 5, based on ${count} Google ${count === 1 ? 'review' : 'reviews'}`);
  }
  date.textContent = count === 0 ? 'No Google reviews yet. Be the first to share your experience.' : 'Rating and reviews loaded from Google Maps.';

  const list = section.querySelector<HTMLElement>('[data-reviews-list]')!;
  const fragment = document.createDocumentFragment();
  // Google supplies up to five selected reviews. Preserve its relevance order.
  for (const review of (place.reviews || []).slice(0, 5)) {
    const article = renderReview(review);
    if (article) fragment.append(article);
  }
  list.replaceChildren(fragment);
  section.querySelector<HTMLElement>('[data-live-reviews]')!.hidden = !list.childElementCount;
  const attributions = section.querySelector<HTMLElement>('[data-place-attributions]')!;
  attributions.replaceChildren();
  for (const attribution of place.attributions || []) {
    if (attribution.provider) attributions.append(externalLink(attribution.providerURI, attribution.provider));
  }
  attributions.hidden = !attributions.childElementCount;
}

const section = document.querySelector<HTMLElement>('[data-google-reviews]');
const key = section?.dataset.apiKey;
if (section && key) {
  const load = async () => {
    const status = section.querySelector<HTMLElement>('[data-reviews-status]')!;
    section.dataset.reviewsState = 'loading';
    section.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = 'Loading reviews from Google…';
    try {
      const place = await withTimeout((async () => {
        const { Place } = await loadPlaces(key);
        if (section.dataset.reviewsState !== 'loading') throw new Error('Google reviews request expired');
        const result = new Place({ id: section.dataset.placeId!, requestedLanguage: 'en', requestedRegion: 'CA' });
        await result.fetchFields({ fields: ['rating', 'userRatingCount', 'reviews', 'attributions'] });
        return result;
      })());
      renderPlace(section, place);
      section.dataset.reviewsState = 'live';
      status.textContent = 'Google reviews updated.';
      status.classList.add('sr-only');
    } catch {
      section.dataset.reviewsState = 'unavailable';
      status.textContent = 'Live reviews are temporarily unavailable. View the latest reviews on Google.';
      // Keep the dated manual snapshot and working Google links as a fallback.
    } finally {
      section.removeAttribute('aria-busy');
    }
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        void load();
      }
    }, { rootMargin: '300px' });
    observer.observe(section);
  } else {
    void load();
  }
}
