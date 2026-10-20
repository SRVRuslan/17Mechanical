const galleryElement = document.querySelector<HTMLElement>('[data-service-gallery]');

if (galleryElement) {
  const gallery = galleryElement;
  const track = gallery.querySelector<HTMLElement>('[data-gallery-track]')!;
  const photos = Array.from(gallery.querySelectorAll<HTMLAnchorElement>('[data-gallery-photo]'));
  const previous = gallery.querySelector<HTMLButtonElement>('[data-gallery-previous]')!;
  const next = gallery.querySelector<HTMLButtonElement>('[data-gallery-next]')!;
  const autoplay = gallery.querySelector<HTMLButtonElement>('[data-gallery-autoplay]')!;
  const pauseIcon = autoplay.querySelector<HTMLSpanElement>('[data-autoplay-pause]')!;
  const playIcon = autoplay.querySelector<HTMLSpanElement>('[data-autoplay-play]')!;
  const progress = gallery.querySelector<HTMLElement>('[data-gallery-progress]')!;
  const status = gallery.querySelector<HTMLElement>('[data-gallery-status]')!;
  const viewer = gallery.querySelector<HTMLDialogElement>('[data-gallery-viewer]')!;
  const image = viewer.querySelector<HTMLImageElement>('[data-viewer-image]')!;
  const frame = viewer.querySelector<HTMLElement>('[data-viewer-frame]')!;
  const stage = viewer.querySelector<HTMLElement>('[data-viewer-stage]')!;
  const loading = viewer.querySelector<HTMLElement>('[data-viewer-loading]')!;
  const caption = viewer.querySelector<HTMLElement>('[data-viewer-caption]')!;
  const zoom = viewer.querySelector<HTMLButtonElement>('[data-viewer-zoom]')!;
  const zoomSymbol = zoom.querySelector<HTMLElement>('[data-zoom-symbol]')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let opener: HTMLAnchorElement | null = null;
  let scrollFrame = 0;
  let touchStart: { x: number; y: number } | null = null;
  let autoplayEnabled = !reducedMotion.matches;
  let autoplayTimer: number | undefined;
  let galleryVisible = false;
  let pointerInside = false;
  let pointerHeld = false;
  let focusPaused = gallery.contains(document.activeElement);

  function updateAutoplay() {
    window.clearTimeout(autoplayTimer);
    autoplay.setAttribute('aria-pressed', String(autoplayEnabled));
    autoplay.setAttribute('aria-label', autoplayEnabled ? 'Pause automatic slideshow' : 'Start automatic slideshow');
    pauseIcon.toggleAttribute('hidden', !autoplayEnabled);
    playIcon.toggleAttribute('hidden', autoplayEnabled);
    const playing = autoplayEnabled && galleryVisible && !document.hidden && !viewer.open
      && !pointerInside && !pointerHeld && !focusPaused && track.scrollWidth > track.clientWidth + 2;
    gallery.dataset.autoplay = playing ? 'playing' : autoplayEnabled ? 'paused' : 'stopped';
    status.setAttribute('aria-live', playing ? 'off' : 'polite');
    if (playing) {
      autoplayTimer = window.setTimeout(() => {
        if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) {
          // Return directly to the beginning instead of animating past all photos.
          track.scrollTo({ left: 0, behavior: 'auto' });
        } else {
          moveTrack(1);
        }
        updateAutoplay();
      }, 2000);
    }
  }

  const step = () => {
    const slides = track.querySelectorAll<HTMLElement>('.gallery-slide');
    return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
  };

  function updateControls() {
    const maximum = track.scrollWidth - track.clientWidth;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= maximum - 2;
    const percentage = track.scrollWidth ? (track.scrollLeft + track.clientWidth) / track.scrollWidth * 100 : 100;
    progress.style.setProperty('--gallery-progress', `${Math.min(100, percentage)}%`);
    const distance = step();
    const first = Math.floor((track.scrollLeft + 1) / distance) + 1;
    const last = Math.min(photos.length, Math.ceil((track.scrollLeft + track.clientWidth - 1) / distance));
    status.textContent = `Photos ${first} to ${last} of ${photos.length}`;
  }

  function moveTrack(direction: number) {
    track.scrollBy({ left: direction * step(), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  previous.addEventListener('click', () => moveTrack(-1));
  next.addEventListener('click', () => moveTrack(1));
  autoplay.addEventListener('click', () => {
    autoplayEnabled = !autoplayEnabled;
    // Explicitly starting playback permits it while this button retains focus.
    focusPaused = false;
    updateAutoplay();
  });
  gallery.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { pointerInside = true; updateAutoplay(); }
  });
  gallery.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') { pointerInside = false; updateAutoplay(); }
  });
  gallery.addEventListener('focusin', () => { focusPaused = true; updateAutoplay(); });
  gallery.addEventListener('focusout', () => window.setTimeout(() => {
    if (!gallery.contains(document.activeElement)) focusPaused = false;
    updateAutoplay();
  }, 0));
  track.addEventListener('pointerdown', () => { pointerHeld = true; updateAutoplay(); }, { passive: true });
  const releasePointer = () => { pointerHeld = false; updateAutoplay(); };
  window.addEventListener('pointerup', releasePointer, { passive: true });
  window.addEventListener('pointercancel', releasePointer, { passive: true });
  document.addEventListener('visibilitychange', updateAutoplay);
  reducedMotion.addEventListener('change', event => {
    if (event.matches) autoplayEnabled = false;
    updateAutoplay();
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updateControls);
  }, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveTrack(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  });

  function resetZoom() {
    viewer.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.setAttribute('aria-label', 'Zoom in');
    zoomSymbol.textContent = '+';
    frame.scrollTo({ left: 0, top: 0, behavior: 'auto' });
  }

  function toggleZoom() {
    if (zoom.disabled) return;
    if (viewer.classList.contains('is-zoomed')) {
      resetZoom();
      return;
    }
    viewer.style.setProperty('--zoom-width', `${image.getBoundingClientRect().width * 2}px`);
    viewer.classList.add('is-zoomed');
    zoom.setAttribute('aria-pressed', 'true');
    zoom.setAttribute('aria-label', 'Zoom out');
    zoomSymbol.textContent = '−';
    requestAnimationFrame(() => frame.scrollTo({
      left: (frame.scrollWidth - frame.clientWidth) / 2,
      top: (frame.scrollHeight - frame.clientHeight) / 2,
      behavior: 'auto',
    }));
  }

  function showPhoto(index: number) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    resetZoom();
    image.hidden = true;
    zoom.disabled = true;
    loading.hidden = false;
    loading.textContent = 'Loading photo…';
    frame.setAttribute('aria-busy', 'true');
    image.alt = photo.dataset.caption || '';
    caption.textContent = `Photo ${current + 1} of ${photos.length} · ${image.alt}`;
    image.src = photo.href;
  }

  image.addEventListener('load', () => {
    image.hidden = false;
    loading.hidden = true;
    zoom.disabled = false;
    frame.removeAttribute('aria-busy');
  });
  image.addEventListener('error', () => {
    loading.textContent = 'This photo could not be loaded. Please try another photo.';
    frame.removeAttribute('aria-busy');
  });
  photos.forEach((photo, index) => photo.addEventListener('click', event => {
    // Without dialog support, the link still opens the full-size image normally.
    if (typeof viewer.showModal !== 'function') return;
    event.preventDefault();
    opener = photo;
    viewer.showModal();
    updateAutoplay();
    document.body.classList.add('gallery-viewer-open');
    showPhoto(index);
  }));
  viewer.querySelector('[data-viewer-close]')!.addEventListener('click', () => viewer.close());
  viewer.querySelector('[data-viewer-previous]')!.addEventListener('click', () => showPhoto(current - 1));
  viewer.querySelector('[data-viewer-next]')!.addEventListener('click', () => showPhoto(current + 1));
  zoom.addEventListener('click', toggleZoom);
  image.addEventListener('dblclick', toggleZoom);
  viewer.addEventListener('click', event => {
    if (event.target === viewer || event.target === frame || event.target === stage) viewer.close();
  });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const controls = Array.from(viewer.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || viewer.classList.contains('is-zoomed')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('gallery-viewer-open');
    resetZoom();
    opener?.focus({ preventScroll: true });
    updateAutoplay();
  });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && !viewer.classList.contains('is-zoomed')) {
      touchStart = { x: event.clientX, y: event.clientY };
    }
  }, { passive: true });
  stage.addEventListener('pointerup', event => {
    if (!touchStart || viewer.classList.contains('is-zoomed')) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) showPhoto(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
  stage.addEventListener('pointercancel', () => { touchStart = null; });
  window.addEventListener('resize', () => {
    if (viewer.open) resetZoom();
    updateControls();
    updateAutoplay();
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(updateControls).observe(track);
  gallery.classList.add('is-ready');
  updateControls();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      galleryVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
      updateAutoplay();
    }, { threshold: [0, .15] }).observe(gallery);
  } else {
    galleryVisible = true;
  }
  updateAutoplay();
}
