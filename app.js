(() => {
  const root = document.documentElement;
  const year = document.getElementById('year');
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('primary-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];
  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('.copy-status');

  if (year) year.textContent = String(new Date().getFullYear());

  const setHeaderState = () => header?.classList.toggle('scrolled', window.scrollY > 12);
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const closeMenu = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
  };

  navToggle?.addEventListener('click', () => {
    const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
    nav?.classList.toggle('open', willOpen);
    navToggle.setAttribute('aria-expanded', String(willOpen));
    navToggle.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
  });

  navLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', (event) => {
    if (!nav?.classList.contains('open')) return;
    if (nav.contains(event.target) || navToggle?.contains(event.target)) return;
    closeMenu();
  });

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible?.target?.id) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.25, 0.5] });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  copyButton?.addEventListener('click', async () => {
    const email = copyButton.dataset.email;
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      if (copyStatus) copyStatus.textContent = 'Email copied to clipboard.';
    } catch {
      if (copyStatus) copyStatus.textContent = `Email: ${email}`;
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  });

  root.classList.add('ready');
})();
