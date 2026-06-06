// Abhyaas Admin JS

// Sidebar toggle (mobile)
const sidebar = document.getElementById('adminSidebar');
const menuBtn = document.getElementById('menuToggle');
if (menuBtn && sidebar) {
  menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// Confirm before destructive actions
document.querySelectorAll('[data-confirm]').forEach(el => {
  el.addEventListener('click', e => {
    if (!confirm(el.dataset.confirm || 'Are you sure?')) e.preventDefault();
  });
});
document.querySelectorAll('form[data-confirm]').forEach(form => {
  form.addEventListener('submit', e => {
    if (!confirm(form.dataset.confirm || 'Are you sure?')) e.preventDefault();
  });
});

// Upload zone click-to-browse
document.querySelectorAll('.upload-zone').forEach(zone => {
  const input = zone.querySelector('input[type=file]');
  if (input) {
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const names = Array.from(input.files).map(f => f.name).join(', ');
      const label = zone.querySelector('.upload-label');
      if (label && names) label.textContent = names;
    });
  }
});

// Auto-dismiss alerts
setTimeout(() => {
  document.querySelectorAll('.alert[data-auto-dismiss]').forEach(a => {
    a.style.transition = 'opacity .4s';
    a.style.opacity = '0';
    setTimeout(() => a.remove(), 400);
  });
}, 4000);

// Session keepalive every 10 minutes
setInterval(() => {
  fetch('/admin/keepalive').catch(() => {});
}, 10 * 60 * 1000);
