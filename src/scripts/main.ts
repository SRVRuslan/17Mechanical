const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const navigation = document.querySelector<HTMLElement>('#navigation');
const header = document.querySelector<HTMLElement>('.site-header');
const menuDismiss = document.querySelector<HTMLButtonElement>('.menu-dismiss');
if (header) {
  const updateHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
    if (menuButton?.getAttribute('aria-expanded') === 'true') closeMenu();
  };
  updateHeader();
  document.documentElement.classList.add('header-overlay-ready');
  window.addEventListener('scroll', updateHeader, { passive: true });
}
function closeMenu() {
  const restoreFocus = navigation?.contains(document.activeElement)
    || document.activeElement === menuDismiss;
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
  navigation?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  if (menuDismiss) menuDismiss.hidden = true;
  if (restoreFocus) menuButton?.focus({ preventScroll: true });
}
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  navigation?.classList.toggle('is-open', expanded);
  document.body.classList.toggle('menu-open', expanded);
  if (menuDismiss) menuDismiss.hidden = !expanded;
});
menuDismiss?.addEventListener('click', closeMenu);
document.addEventListener('click', event => {
  if (menuButton?.getAttribute('aria-expanded') !== 'true' || !(event.target instanceof Node)) return;
  if (!navigation?.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
  if (event.key === 'Tab' && menuButton?.getAttribute('aria-expanded') === 'true') {
    const links = Array.from(navigation?.querySelectorAll<HTMLAnchorElement>('a') || []);
    const controls: HTMLElement[] = [menuButton, ...links];
    const index = controls.indexOf(document.activeElement as HTMLElement);
    const next = index < 0 ? (event.shiftKey ? controls.length - 1 : 0)
      : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    event.preventDefault();
    controls[next].focus();
  }
});
const desktopMedia = matchMedia('(min-width: 1201px)');
desktopMedia.addEventListener('change', event => { if (event.matches) closeMenu(); });

// Progressive enhancement: content remains visible if JavaScript or IO is unavailable.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const emblemButtons = document.querySelectorAll<HTMLButtonElement>('[data-emblem-toggle]');
emblemButtons.forEach(button => {
  button.addEventListener('click', () => {
    const paused = button.classList.toggle('is-paused');
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} rotating service text around the company emblem`);
    button.title = paused ? 'Resume rotation' : 'Pause rotation';
  });
});
if (emblemButtons.length) document.documentElement.classList.add('emblem-ready');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  document.documentElement.classList.add('reveal-ready');
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight) element.classList.add('is-visible');
    else observer.observe(element);
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); document.documentElement.classList.remove('reveal-ready'); }
  });
}

const serviceSelect = document.querySelector<HTMLSelectElement>('#enquiry-service');
document.querySelectorAll<HTMLAnchorElement>('[data-service]').forEach(link => {
  link.addEventListener('click', () => { if (serviceSelect) serviceSelect.value = link.dataset.service || ''; });
});

const form = document.querySelector<HTMLFormElement>('#enquiry-form');
const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
submitButton?.removeAttribute('disabled');
const contactEmail = form?.dataset.email || '17hvac@gmail.com';
let sendingEnquiry = false;
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (sendingEnquiry || !form.reportValidity()) return;
  const values = new FormData(form);
  const status = form.querySelector<HTMLElement>('.form-status');
  const label = submitButton?.querySelector<HTMLElement>('[data-submit-label]');
  sendingEnquiry = true;
  form.setAttribute('aria-busy', 'true');
  if (submitButton) submitButton.disabled = true;
  if (label) label.textContent = 'Sending…';
  if (status) { status.textContent = 'Sending your enquiry…'; delete status.dataset.state; }
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.fromEntries(values)),
      signal: AbortSignal.timeout(30_000),
    });
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object') throw new Error('Invalid response');
    const data = result as { ok?: boolean; preview?: boolean; message?: unknown };
    const message = typeof data.message === 'string' ? data.message : '';
    if (response.ok && data.ok === true) {
      form.reset();
      if (status) { status.textContent = message || 'Thank you! Your enquiry has been sent.'; status.dataset.state = 'success'; }
    } else {
      // Failed submissions and local previews keep every field for another attempt.
      if (status) {
        status.textContent = message || `Your request could not be sent. Please try again or email ${contactEmail} directly.`;
        status.dataset.state = data.preview ? 'preview' : 'error';
      }
    }
  } catch {
    if (status) {
      status.textContent = `We could not confirm delivery. Your details are still here. Please try again or email ${contactEmail} directly.`;
      status.dataset.state = 'error';
    }
  } finally {
    sendingEnquiry = false;
    form.removeAttribute('aria-busy');
    if (submitButton) submitButton.disabled = false;
    if (label) label.textContent = 'Send';
  }
});
