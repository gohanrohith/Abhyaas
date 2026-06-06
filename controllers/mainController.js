const crypto = require('crypto');
const { notifyAdmissionEnquiry, autoReplyAdmission, notifyContact } = require('../config/mailer');

async function db(sql, params = []) {
  try {
    const { query } = require('../config/db');
    return await query(sql, params);
  } catch { return []; }
}
async function db1(sql, params = []) {
  const rows = await db(sql, params);
  return rows[0] || null;
}

// ── Home ──────────────────────────────────────────────
exports.home = async (req, res) => {
  const [latestPosts, upcomingEvents, recentGallery, settings] = await Promise.all([
    db(`SELECT id, title, slug, excerpt, cover_image, category, published_at
        FROM posts WHERE status='published' ORDER BY published_at DESC LIMIT 3`),
    db(`SELECT * FROM events WHERE status='upcoming' ORDER BY event_date ASC LIMIT 3`),
    db(`SELECT ga.title, ga.slug, ga.cover_image
        FROM gallery_albums ga WHERE ga.is_active=1 ORDER BY ga.created_at DESC LIMIT 6`),
    db(`SELECT setting_key, value FROM settings WHERE setting_key IN ('admissions_open','admission_year','phone','whatsapp')`),
  ]);
  const settingsMap = {};
  settings.forEach(s => { settingsMap[s.setting_key] = s.value; });
  res.render('main/index', {
    title: 'Abhyaas The Global School | Bhimavaram',
    latestPosts, upcomingEvents, recentGallery, settings: settingsMap,
  });
};

// ── About ─────────────────────────────────────────────
exports.about = async (req, res) => {
  const faculty = await db(`SELECT * FROM faculty WHERE is_active=1 ORDER BY sort_order, name LIMIT 12`);
  res.render('main/about', {
    title: 'About Us | Abhyaas The Global School',
    faculty,
  });
};

// ── Academics ─────────────────────────────────────────
exports.academics = (req, res) => {
  res.render('main/academics', { title: 'Academics | Abhyaas The Global School' });
};

// ── Facilities ────────────────────────────────────────
exports.facilities = (req, res) => {
  res.render('main/facilities', { title: 'Facilities | Abhyaas The Global School' });
};

// ── Faculty ───────────────────────────────────────────
exports.faculty = async (req, res) => {
  const faculty = await db(`SELECT * FROM faculty WHERE is_active=1 ORDER BY sort_order, name`);
  res.render('main/faculty', { title: 'Our Faculty | Abhyaas The Global School', faculty });
};

// ── Achievements ──────────────────────────────────────
exports.achievements = async (req, res) => {
  const posts = await db(
    `SELECT * FROM posts WHERE status='published' AND category='achievement' ORDER BY published_at DESC`
  );
  res.render('main/achievements', {
    title: 'Achievements | Abhyaas The Global School', posts,
  });
};

// ── CBSE Disclosure ───────────────────────────────────
exports.disclosure = async (req, res) => {
  const docs = await db(`SELECT * FROM compliance_documents WHERE is_active=1 ORDER BY sort_order`);
  res.render('main/disclosure', {
    title: 'CBSE Mandatory Public Disclosure | Abhyaas The Global School', docs,
  });
};

// ── Downloads ─────────────────────────────────────────
exports.downloads = async (req, res) => {
  const downloads = await db(`SELECT * FROM downloads WHERE is_active=1 ORDER BY category, created_at DESC`);
  res.render('main/downloads', {
    title: 'Downloads | Abhyaas The Global School', downloads,
  });
};

// ── Admissions ────────────────────────────────────────
exports.admissions = async (req, res) => {
  const settings = await db(`SELECT setting_key, value FROM settings WHERE setting_key IN ('admissions_open','admission_year')`);
  const sm = {};
  settings.forEach(s => { sm[s.setting_key] = s.value; });
  res.render('main/admissions', {
    title: 'Admissions | Abhyaas The Global School',
    admissionsOpen: sm.admissions_open !== '0',
    admissionYear: sm.admission_year || '2025-26',
    success: req.query.success || null,
    error:   req.query.error   || null,
  });
};

exports.admissionEnquiry = async (req, res) => {
  const { parent_name, phone, email, student_name, class: cls, message } = req.body;
  try {
    const { query } = require('../config/db');
    await query(
      `INSERT INTO admission_enquiries (parent_name, phone, email, student_name, class_seeking, message) VALUES (?,?,?,?,?,?)`,
      [parent_name, phone, email || null, student_name || null, cls || null, message || null]
    );
    notifyAdmissionEnquiry({ parent_name, phone, email, student_name, class_seeking: cls, message }).catch(() => {});
    autoReplyAdmission({ parent_name, phone, email, student_name, class_seeking: cls }).catch(() => {});
  } catch (e) { console.error('Admission error:', e.message); }
  res.redirect('/admissions?success=1');
};

// ── Contact ───────────────────────────────────────────
exports.contact = (req, res) => {
  res.render('main/contact', {
    title: 'Contact Us | Abhyaas The Global School',
    success: req.query.success || null,
    error:   req.query.error   || null,
  });
};

exports.contactSubmit = async (req, res) => {
  const { name, phone, email, subject, message } = req.body;
  try {
    const { query } = require('../config/db');
    await query(
      `INSERT INTO contact_submissions (name, phone, email, subject, message) VALUES (?,?,?,?,?)`,
      [name, phone, email || null, subject || null, message]
    );
    notifyContact({ name, phone, email, subject, message }).catch(() => {});
  } catch (e) { console.error('Contact error:', e.message); }
  res.redirect('/contact?success=1');
};

// ── Blog ──────────────────────────────────────────────
exports.blog = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const perPage = 9;
  const offset  = (page - 1) * perPage;
  const [posts, countRow] = await Promise.all([
    db(`SELECT id, title, slug, excerpt, cover_image, category, published_at
        FROM posts WHERE status='published' ORDER BY published_at DESC LIMIT ? OFFSET ?`, [perPage, offset]),
    db1(`SELECT COUNT(*) AS c FROM posts WHERE status='published'`),
  ]);
  const total = countRow?.c || 0;
  res.render('main/blog', {
    title: 'Blog | Abhyaas The Global School',
    posts, page, perPage, total,
    totalPages: Math.ceil(total / perPage),
    category: null,
  });
};

exports.blogCategory = async (req, res) => {
  const cat = req.params.cat;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const perPage = 9;
  const offset  = (page - 1) * perPage;
  const [posts, countRow] = await Promise.all([
    db(`SELECT id, title, slug, excerpt, cover_image, category, published_at
        FROM posts WHERE status='published' AND category=? ORDER BY published_at DESC LIMIT ? OFFSET ?`, [cat, perPage, offset]),
    db1(`SELECT COUNT(*) AS c FROM posts WHERE status='published' AND category=?`, [cat]),
  ]);
  const total = countRow?.c || 0;
  res.render('main/blog', {
    title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} | Abhyaas Blog`,
    posts, page, perPage, total,
    totalPages: Math.ceil(total / perPage),
    category: cat,
  });
};

exports.blogPost = async (req, res) => {
  const post = await db1(
    `SELECT * FROM posts WHERE slug=? AND status='published'`, [req.params.slug]
  );
  if (!post) return res.status(404).render('404', { title: '404 | Abhyaas' });
  await db(`UPDATE posts SET views=views+1 WHERE id=?`, [post.id]);
  const related = await db(
    `SELECT id, title, slug, cover_image, published_at FROM posts
     WHERE status='published' AND category=? AND id!=? ORDER BY published_at DESC LIMIT 3`,
    [post.category, post.id]
  );
  res.render('main/blog-post', {
    title: `${post.title} | Abhyaas`,
    post, related,
  });
};

// ── Events ────────────────────────────────────────────
exports.events = async (req, res) => {
  const [upcoming, past] = await Promise.all([
    db(`SELECT * FROM events WHERE status='upcoming' ORDER BY event_date ASC`),
    db(`SELECT * FROM events WHERE status='completed' ORDER BY event_date DESC LIMIT 10`),
  ]);
  res.render('main/events', {
    title: 'Events | Abhyaas The Global School', upcoming, past,
  });
};

// ── Gallery ───────────────────────────────────────────
exports.gallery = async (req, res) => {
  const albums = await db(
    `SELECT ga.*, (SELECT gp.filename FROM gallery_photos gp WHERE gp.album_id=ga.id ORDER BY gp.sort_order LIMIT 1) AS first_photo
     FROM gallery_albums ga WHERE ga.is_active=1 ORDER BY ga.created_at DESC`
  );
  res.render('main/gallery', { title: 'Gallery | Abhyaas The Global School', albums });
};

exports.album = async (req, res) => {
  const album = await db1(`SELECT * FROM gallery_albums WHERE slug=? AND is_active=1`, [req.params.slug]);
  if (!album) return res.status(404).render('404', { title: '404 | Abhyaas' });
  const photos = await db(`SELECT * FROM gallery_photos WHERE album_id=? ORDER BY sort_order`, [album.id]);
  res.render('main/album', { title: `${album.title} | Gallery | Abhyaas`, album, photos });
};

// ── Search ────────────────────────────────────────────
exports.search = async (req, res) => {
  const q = (req.query.q || '').trim();
  let posts = [], events = [];
  if (q.length >= 2) {
    const like = `%${q}%`;
    [posts, events] = await Promise.all([
      db(`SELECT id, title, slug, excerpt, category, published_at FROM posts
          WHERE status='published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)
          ORDER BY published_at DESC LIMIT 10`, [like, like, like]),
      db(`SELECT * FROM events WHERE title LIKE ? OR description LIKE ?
          ORDER BY event_date DESC LIMIT 5`, [like, like]),
    ]);
  }
  res.render('main/search', {
    title: q ? `Search: ${q} | Abhyaas` : 'Search | Abhyaas',
    q, posts, events, total: posts.length + events.length,
  });
};

// ── Newsletter ────────────────────────────────────────
exports.newsletterSubscribe = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.redirect('back');
  try {
    const { query } = require('../config/db');
    const token = crypto.randomBytes(32).toString('hex');
    await query(
      `INSERT INTO newsletter_subscribers (email, name, token) VALUES (?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [email.trim().toLowerCase(), (name || '').trim() || null, token]
    );
  } catch { /* duplicate */ }
  res.redirect('/?newsletter=success');
};

exports.newsletterUnsubscribe = async (req, res) => {
  const { token } = req.query;
  if (token) {
    try {
      const { query } = require('../config/db');
      await query(`DELETE FROM newsletter_subscribers WHERE token=?`, [token]);
    } catch { /* ignore */ }
  }
  res.render('main/unsubscribe', { title: 'Unsubscribed | Abhyaas', done: !!token });
};

// ── Legal ─────────────────────────────────────────────
const legalTitles = {
  'privacy-policy':   'Privacy Policy',
  'terms':            'Terms & Conditions',
  'child-protection': 'Child Protection Policy',
  'posh':             'POSH Policy',
  'anti-bullying':    'Anti-Bullying Policy',
  'refund':           'Refund Policy',
  'cookie':           'Cookie Policy',
};
exports.legal = (page) => (req, res) => {
  res.render(`main/legal/${page}`, {
    title: `${legalTitles[page] || page} | Abhyaas The Global School`,
  });
};

// ── Sitemap ───────────────────────────────────────────
exports.sitemap = async (req, res) => {
  const domain = process.env.MAIN_DOMAIN || 'abhyaastheglobalschool.com';
  const base = `https://${domain}`;
  const staticPages = [
    '', '/about', '/academics', '/facilities', '/faculty',
    '/admissions', '/achievements', '/disclosure', '/downloads',
    '/blog', '/events', '/gallery', '/contact', '/search',
  ];
  const posts  = await db(`SELECT slug, updated_at FROM posts WHERE status='published'`);
  const albums = await db(`SELECT slug FROM gallery_albums WHERE is_active=1`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  staticPages.forEach(p => {
    xml += `  <url><loc>${base}${p}</loc><changefreq>weekly</changefreq></url>\n`;
  });
  posts.forEach(p => {
    xml += `  <url><loc>${base}/blog/${p.slug}</loc><changefreq>monthly</changefreq></url>\n`;
  });
  albums.forEach(a => {
    xml += `  <url><loc>${base}/gallery/${a.slug}</loc><changefreq>monthly</changefreq></url>\n`;
  });
  xml += `</urlset>`;
  res.set('Content-Type', 'application/xml');
  res.send(xml);
};

// ── Robots ────────────────────────────────────────────
exports.robots = (req, res) => {
  const domain = process.env.MAIN_DOMAIN || 'abhyaastheglobalschool.com';
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: https://${domain}/sitemap.xml\n`);
};
