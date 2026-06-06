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
  dots.forEach(d => d.addEventListener('click', () => goTo(parseInt(d.dataset.index))));
  setInterval(() => goTo(current + 1), 5000);
})();

// Mobile nav burger
(function() {
  const burger = document.getElementById('navBurger');
  const links  = document.getElementById('navLinks');
  if (!burger) return;
  burger.addEventListener('click', () => links.classList.toggle('open'));

  // Dropdown toggle on mobile
  document.querySelectorAll('.has-dropdown > a').forEach(a => {
    a.addEventListener('click', function(e) {
      if (window.innerWidth < 768) {
        e.preventDefault();
        this.parentElement.classList.toggle('open');
      }
    });
  });
})();

// Sticky nav shadow
(function() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.08)';
  });
})();

// Admin keepalive
if (window.location.pathname.startsWith('/admin')) {
  setInterval(() => fetch('/admin/keepalive'), 10 * 60 * 1000);
}
