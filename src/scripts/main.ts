const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const navigation = document.querySelector<HTMLElement>('#navigation');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
  navigation?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  navigation?.classList.toggle('is-open', expanded);
  document.body.classList.toggle('menu-open', expanded);
});
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
  if (event.key === 'Tab' && menuButton?.getAttribute('aria-expanded') === 'true') {
    const links = navigation?.querySelectorAll<HTMLAnchorElement>('a');
    const lastLink = links?.[links.length - 1];
    if (event.shiftKey && document.activeElement === menuButton && lastLink) {
      event.preventDefault(); lastLink.focus();
    } else if (!event.shiftKey && document.activeElement === lastLink) {
      event.preventDefault(); menuButton.focus();
    }
  }
});
const desktopMedia = matchMedia('(min-width: 851px)');
desktopMedia.addEventListener('change', event => { if (event.matches) closeMenu(); });

// Progressive enhancement: content remains visible if JavaScript or IO is unavailable.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
form?.querySelector<HTMLButtonElement>('button[type="submit"]')?.removeAttribute('disabled');
form?.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const value = (key: string) => String(values.get(key) || '').trim();
  const subject = `Commercial HVAC enquiry — ${value('service')}`;
  const body = `To: ${form.dataset.company}\n\nName: ${value('name')}\nEmail: ${value('email')}\nCompany: ${value('company')}\nPhone: ${value('phone')}\nService: ${value('service')}\n\nProject details:\n${value('message')}`;
  const status = form.querySelector<HTMLElement>('.form-status');
  if (form.dataset.email) {
    window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (status) status.textContent = 'Your email draft is ready. Please review and send it in your email app. Your enquiry has not been submitted through this website.';
  } else {
    const url = URL.createObjectURL(new Blob([`${subject}\n\n${body}\n\nThis enquiry has not been sent.\n`], { type: 'text/plain;charset=utf-8' }));
    const download = document.createElement('a');
    download.href = url;
    download.download = '17-mechanical-project-enquiry.txt';
    document.body.append(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (status) status.textContent = 'Your enquiry has been prepared as a text file. It has not been sent. Direct contact details will be available here soon.';
  }
});
