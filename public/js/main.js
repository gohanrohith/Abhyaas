// Hero slider
(function() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.dot');
  if (!slides.length) return;
  let current = 0;
  function goTo(i) {
    slides[current].classList.remove('active');
    dots[current] && dots[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current] && dots[current].classList.add('active');
  }
  dots.forEach(function(d) { d.addEventListener('click', function() { goTo(parseInt(d.dataset.index)); }); });
  setInterval(function() { goTo(current + 1); }, 5000);
})();

// Mobile nav burger
(function() {
  const burger = document.getElementById('navBurger');
  const links  = document.getElementById('navLinks');
  if (!burger) return;
  burger.addEventListener('click', function() {
    const open = links.classList.toggle('open');
    document.body.classList.toggle('nav-open', open);
  });
  document.addEventListener('click', function(e) {
    if (links.classList.contains('open') && !links.contains(e.target) && !burger.contains(e.target)) {
      links.classList.remove('open');
      document.body.classList.remove('nav-open');
    }
  });
  document.querySelectorAll('.has-dropdown > a').forEach(function(a) {
    a.addEventListener('click', function(e) {
      if (window.innerWidth < 768) {
        e.preventDefault();
        this.parentElement.classList.toggle('open');
      }
    });
  });
})();

// Sticky nav compact
(function() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  function update() { nav.classList.toggle('scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// Admin keepalive
if (window.location.pathname.startsWith('/admin')) {
  setInterval(function() { fetch('/admin/keepalive'); }, 10 * 60 * 1000);
}

// Right-click image protection
(function() {
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') { e.preventDefault(); }
  });
  document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') { e.preventDefault(); }
  });
})();

// Scroll-reveal + staggered grid children
(function() {
  document.querySelectorAll('.blog-cards, .faculty-grid, .events-list, .gallery-grid, .facilities-grid, .albums-grid, .achievements-icons, .about-snippet-grid, .achievements-band-inner').forEach(function(grid) {
    Array.from(grid.children).forEach(function(child, i) {
      if (!child.hasAttribute('data-reveal')) {
        child.setAttribute('data-reveal', '');
        child.style.setProperty('--delay', (i * 80) + 'ms');
      }
    });
  });
  document.querySelectorAll('.section-header').forEach(function(el) {
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
  });
  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function(el) { obs.observe(el); });
})();

// CountUp for numeric stats
(function() {
  const stats = document.querySelectorAll('.stat-num[data-count]');
  if (!stats.length) return;
  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const duration = 1200;
      let start = null;
      function tick(now) {
        if (!start) start = now;
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(p * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  stats.forEach(function(el) { obs.observe(el); });
})();
