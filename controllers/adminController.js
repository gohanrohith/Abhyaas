const bcrypt = require('bcrypt');
const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const { isValidImage, isValidDocument } = require('../utils/magicBytes');
const { slugify } = require('../utils/slug');

const UPLOADS_BASE = process.env.UPLOADS_DIR || path.join(__dirname, '../public/uploads');

function imageUpload(dest, maxCount = 20) {
  const dir = path.join(UPLOADS_BASE, dest);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename:    (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ok = /jpeg|jpg|png|gif|webp/.test(file.mimetype);
      cb(ok ? null : new Error('Images only'), ok);
    },
  }).array('images', maxCount);
}

function fileUpload(dest) {
  const dir = path.join(UPLOADS_BASE, dest);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename:    (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  }).single('file');
}

function singleImage(dest) {
  const dir = path.join(UPLOADS_BASE, dest);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename:    (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ok = /jpeg|jpg|png|gif|webp/.test(file.mimetype);
      cb(ok ? null : new Error('Images only'), ok);
    },
  }).single('image');
}

const galleryUpload    = imageUpload('gallery');
const blogImageUpload  = singleImage('blog');
const eventImageUpload = singleImage('events');
const facultyUpload    = singleImage('faculty');
const complianceUpload = fileUpload('compliance');
const downloadUpload   = fileUpload('downloads');

async function q(sql, params = []) {
  try {
    const { query } = require('../config/db');
    return await query(sql, params);
  } catch (e) { console.error(e.message); return []; }
}
async function q1(sql, params = []) {
  const rows = await q(sql, params);
  return rows[0] || null;
}

// ── Auth ──────────────────────────────────────────────
exports.loginPage = (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { layout: false, title: 'Admin Login | Abhyaas', error: null });
};

exports.loginSubmit = async (req, res) => {
  const { username, password } = req.body;
  try {
    const { queryOne } = require('../config/db');
    const admin = await queryOne('SELECT * FROM admins WHERE username=?', [username]);
    if (admin && await bcrypt.compare(password, admin.password)) {
      req.session.adminId   = admin.id;
      req.session.adminName = admin.name;
      req.session.adminRole = admin.role;
      return res.redirect('/admin');
    }
  } catch (e) { console.error('Login error:', e.message); }
  res.render('admin/login', { layout: false, title: 'Admin Login | Abhyaas', error: 'Invalid credentials' });
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};

// ── Dashboard ─────────────────────────────────────────
exports.dashboard = async (req, res) => {
  const [posts, events, enquiries, gallery, contacts] = await Promise.all([
    q1(`SELECT COUNT(*) AS c FROM posts WHERE status='published'`),
    q1(`SELECT COUNT(*) AS c FROM events WHERE status='upcoming'`),
    q1(`SELECT COUNT(*) AS c FROM admission_enquiries WHERE status='new'`),
    q1(`SELECT COUNT(*) AS c FROM gallery_albums WHERE is_active=1`),
    q1(`SELECT COUNT(*) AS c FROM contact_submissions`),
  ]);
  const recentEnquiries = await q(`SELECT * FROM admission_enquiries ORDER BY created_at DESC LIMIT 5`);
  const recentPosts     = await q(`SELECT id, title, status, published_at FROM posts ORDER BY created_at DESC LIMIT 5`);
  res.render('admin/dashboard', {
    title: 'Dashboard | Abhyaas Admin',
    adminName: req.session.adminName,
    stats: {
      posts:     posts?.c     || 0,
      events:    events?.c    || 0,
      enquiries: enquiries?.c || 0,
      gallery:   gallery?.c   || 0,
      contacts:  contacts?.c  || 0,
    },
    recentEnquiries, recentPosts,
  });
};

// ── Blog Posts ────────────────────────────────────────
exports.blogList = async (req, res) => {
  const posts = await q(`SELECT id, title, slug, category, status, featured, views, published_at, created_at FROM posts ORDER BY created_at DESC`);
  res.render('admin/blog', { title: 'Blog Posts | Abhyaas Admin', posts, error: req.query.error || null, success: req.query.success || null });
};

exports.blogNew = (req, res) => {
  res.render('admin/blog-form', { title: 'New Post | Abhyaas Admin', post: null, error: null });
};

exports.blogCreate = (req, res) => {
  blogImageUpload(req, res, async err => {
    if (err) return res.render('admin/blog-form', { title: 'New Post | Abhyaas Admin', post: req.body, error: err.message });
    const { title, excerpt, content, category, status, featured } = req.body;
    if (!title) return res.render('admin/blog-form', { title: 'New Post | Abhyaas Admin', post: req.body, error: 'Title is required' });
    let cover_image = null;
    if (req.file) {
      const fp = path.join(UPLOADS_BASE, 'blog', req.file.filename);
      if (!isValidImage(fp)) { fs.unlinkSync(fp); return res.render('admin/blog-form', { title: 'New Post | Abhyaas Admin', post: req.body, error: 'Invalid image file' }); }
      cover_image = req.file.filename;
    }
    let slug = slugify(title);
    const existing = await q1(`SELECT id FROM posts WHERE slug=?`, [slug]);
    if (existing) slug = `${slug}-${Date.now()}`;
    const published_at = status === 'published' ? new Date() : null;
    await q(
      `INSERT INTO posts (title, slug, excerpt, content, cover_image, category, status, featured, published_at, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [title, slug, excerpt || null, content || null, cover_image, category || 'news',
       status || 'draft', featured === '1' ? 1 : 0, published_at, req.session.adminId]
    );
    res.redirect('/admin/blog?success=Post+created');
  });
};

exports.blogEdit = async (req, res) => {
  const post = await q1(`SELECT * FROM posts WHERE id=?`, [req.params.id]);
  if (!post) return res.redirect('/admin/blog');
  res.render('admin/blog-form', { title: 'Edit Post | Abhyaas Admin', post, error: null });
};

exports.blogUpdate = (req, res) => {
  blogImageUpload(req, res, async err => {
    if (err) return res.redirect(`/admin/blog/${req.params.id}/edit?error=${encodeURIComponent(err.message)}`);
    const { title, excerpt, content, category, status, featured } = req.body;
    const post = await q1(`SELECT * FROM posts WHERE id=?`, [req.params.id]);
    if (!post) return res.redirect('/admin/blog');
    let cover_image = post.cover_image;
    if (req.file) {
      const fp = path.join(UPLOADS_BASE, 'blog', req.file.filename);
      if (!isValidImage(fp)) { fs.unlinkSync(fp); }
      else cover_image = req.file.filename;
    }
    const published_at = status === 'published' && !post.published_at ? new Date() : post.published_at;
    await q(
      `UPDATE posts SET title=?, excerpt=?, content=?, cover_image=?, category=?, status=?, featured=?, published_at=? WHERE id=?`,
      [title, excerpt || null, content || null, cover_image, category || 'news',
       status || 'draft', featured === '1' ? 1 : 0, published_at, req.params.id]
    );
    res.redirect('/admin/blog?success=Post+updated');
  });
};

exports.blogDelete = async (req, res) => {
  await q(`UPDATE posts SET status='deleted' WHERE id=?`, [req.params.id]);
  res.redirect('/admin/blog');
};

exports.blogPublish = async (req, res) => {
  await q(`UPDATE posts SET status='published', published_at=COALESCE(published_at, NOW()) WHERE id=?`, [req.params.id]);
  res.redirect('/admin/blog');
};

exports.blogUnpublish = async (req, res) => {
  await q(`UPDATE posts SET status='draft' WHERE id=?`, [req.params.id]);
  res.redirect('/admin/blog');
};

// ── Events ────────────────────────────────────────────
exports.eventsList = async (req, res) => {
  const events = await q(`SELECT * FROM events ORDER BY event_date DESC`);
  res.render('admin/events', { title: 'Events | Abhyaas Admin', events });
};

exports.eventNew = (req, res) => {
  res.render('admin/event-form', { title: 'New Event | Abhyaas Admin', event: null, error: null });
};

exports.eventCreate = (req, res) => {
  eventImageUpload(req, res, async err => {
    if (err) return res.render('admin/event-form', { title: 'New Event | Abhyaas Admin', event: req.body, error: err.message });
    const { title, description, event_date, event_time, location, status } = req.body;
    let cover_image = null;
    if (req.file) {
      const fp = path.join(UPLOADS_BASE, 'events', req.file.filename);
      if (isValidImage(fp)) cover_image = req.file.filename;
      else fs.unlinkSync(fp);
    }
    await q(
      `INSERT INTO events (title, description, event_date, event_time, location, cover_image, status, created_by) VALUES (?,?,?,?,?,?,?,?)`,
      [title, description || null, event_date || null, event_time || null, location || null, cover_image, status || 'upcoming', req.session.adminId]
    );
    res.redirect('/admin/events');
  });
};

exports.eventEdit = async (req, res) => {
  const event = await q1(`SELECT * FROM events WHERE id=?`, [req.params.id]);
  if (!event) return res.redirect('/admin/events');
  res.render('admin/event-form', { title: 'Edit Event | Abhyaas Admin', event, error: null });
};

exports.eventUpdate = (req, res) => {
  eventImageUpload(req, res, async err => {
    if (err) return res.redirect(`/admin/events/${req.params.id}/edit?error=${encodeURIComponent(err.message)}`);
    const { title, description, event_date, event_time, location, status } = req.body;
    const ev = await q1(`SELECT * FROM events WHERE id=?`, [req.params.id]);
    if (!ev) return res.redirect('/admin/events');
    let cover_image = ev.cover_image;
    if (req.file) {
      const fp = path.join(UPLOADS_BASE, 'events', req.file.filename);
      if (isValidImage(fp)) cover_image = req.file.filename;
      else fs.unlinkSync(fp);
    }
    await q(
      `UPDATE events SET title=?, description=?, event_date=?, event_time=?, location=?, cover_image=?, status=? WHERE id=?`,
      [title, description || null, event_date || null, event_time || null, location || null, cover_image, status || 'upcoming', req.params.id]
    );
    res.redirect('/admin/events');
  });
};

exports.eventDelete = async (req, res) => {
  await q(`DELETE FROM events WHERE id=?`, [req.params.id]);
  res.redirect('/admin/events');
};

// ── Gallery ───────────────────────────────────────────
exports.galleryList = async (req, res) => {
  const albums = await q(`SELECT ga.*, COUNT(gp.id) AS photo_count FROM gallery_albums ga LEFT JOIN gallery_photos gp ON gp.album_id=ga.id WHERE ga.is_active=1 GROUP BY ga.id ORDER BY ga.created_at DESC`);
  res.render('admin/gallery', { title: 'Gallery | Abhyaas Admin', albums });
};

exports.albumNew = (req, res) => {
  res.render('admin/album-form', { title: 'New Album | Abhyaas Admin', album: null, error: null });
};

exports.albumCreate = (req, res) => {
  singleImage('gallery')(req, res, async err => {
    if (err) return res.render('admin/album-form', { title: 'New Album | Abhyaas Admin', album: req.body, error: err.message });
    const { title, description } = req.body;
    let slug = slugify(title);
    const existing = await q1(`SELECT id FROM gallery_albums WHERE slug=?`, [slug]);
    if (existing) slug = `${slug}-${Date.now()}`;
    let cover_image = null;
    if (req.file) {
      const fp = path.join(UPLOADS_BASE, 'gallery', req.file.filename);
      if (isValidImage(fp)) cover_image = req.file.filename;
      else fs.unlinkSync(fp);
    }
    await q(
      `INSERT INTO gallery_albums (title, slug, description, cover_image, created_by) VALUES (?,?,?,?,?)`,
      [title, slug, description || null, cover_image, req.session.adminId]
    );
    res.redirect('/admin/gallery');
  });
};

exports.albumView = async (req, res) => {
  const album  = await q1(`SELECT * FROM gallery_albums WHERE id=?`, [req.params.id]);
  if (!album) return res.redirect('/admin/gallery');
  const photos = await q(`SELECT * FROM gallery_photos WHERE album_id=? ORDER BY sort_order`, [album.id]);
  res.render('admin/album-view', { title: `${album.title} | Gallery Admin`, album, photos, error: req.query.error || null });
};

exports.albumUpload = (req, res) => {
  galleryUpload(req, res, async err => {
    if (err) return res.redirect(`/admin/gallery/album/${req.params.id}?error=${encodeURIComponent(err.message)}`);
    const { caption } = req.body;
    let uploaded = 0;
    for (const file of (req.files || [])) {
      const fp = path.join(UPLOADS_BASE, 'gallery', file.filename);
      if (!isValidImage(fp)) { fs.unlinkSync(fp); continue; }
      await q(`INSERT INTO gallery_photos (album_id, filename, caption) VALUES (?,?,?)`,
        [req.params.id, file.filename, caption || null]);
      uploaded++;
    }
    if (uploaded === 0 && (req.files || []).length > 0) {
      return res.redirect(`/admin/gallery/album/${req.params.id}?error=No+valid+images`);
    }
    res.redirect(`/admin/gallery/album/${req.params.id}`);
  });
};

exports.albumDelete = async (req, res) => {
  await q(`UPDATE gallery_albums SET is_active=0 WHERE id=?`, [req.params.id]);
  res.redirect('/admin/gallery');
};

exports.photoDelete = async (req, res) => {
  const photo = await q1(`SELECT * FROM gallery_photos WHERE id=?`, [req.params.id]);
  if (photo) {
    await q(`DELETE FROM gallery_photos WHERE id=?`, [req.params.id]);
    res.redirect(`/admin/gallery/album/${photo.album_id}`);
  } else {
    res.redirect('/admin/gallery');
  }
};

// ── Faculty ───────────────────────────────────────────
exports.facultyList = async (req, res) => {
  const faculty = await q(`SELECT * FROM faculty WHERE is_active=1 ORDER BY sort_order, name`);
  res.render('admin/faculty', { title: 'Faculty | Abhyaas Admin', faculty, error: req.query.error || null });
};

exports.facultyCreate = (req, res) => {
  facultyUpload(req, res, async err => {
    if (err) return res.redirect('/admin/faculty?error=' + encodeURIComponent(err.message));
    const { name, designation, subject, qualification, experience, sort_order } = req.body;
    let photo = null;
    if (req.file) {
      const fp = path.join(UPLOADS_BASE, 'faculty', req.file.filename);
      if (isValidImage(fp)) photo = req.file.filename;
      else fs.unlinkSync(fp);
    }
    await q(
      `INSERT INTO faculty (name, designation, subject, qualification, experience, photo, sort_order) VALUES (?,?,?,?,?,?,?)`,
      [name, designation, subject || null, qualification || null, experience || null, photo, sort_order || 0]
    );
    res.redirect('/admin/faculty');
  });
};

exports.facultyDelete = async (req, res) => {
  await q(`UPDATE faculty SET is_active=0 WHERE id=?`, [req.params.id]);
  res.redirect('/admin/faculty');
};

// ── Admissions ────────────────────────────────────────
exports.admissionsList = async (req, res) => {
  const { status } = req.query;
  let sql = `SELECT * FROM admission_enquiries WHERE 1=1`;
  const params = [];
  if (status) { sql += ` AND status=?`; params.push(status); }
  sql += ` ORDER BY created_at DESC`;
  const enquiries = await q(sql, params);
  res.render('admin/admissions', { title: 'Admissions | Abhyaas Admin', enquiries, filterStatus: status || '' });
};

exports.admissionDetail = async (req, res) => {
  const admission = await q1(`SELECT * FROM admission_enquiries WHERE id=?`, [req.params.id]);
  res.render('admin/admission-detail', { title: 'Admission Detail | Abhyaas Admin', admission });
};

exports.admissionStatus = async (req, res) => {
  await q(`UPDATE admission_enquiries SET status=? WHERE id=?`, [req.body.status, req.params.id]);
  res.redirect(`/admin/admissions/${req.params.id}`);
};

// ── Contact submissions ───────────────────────────────
exports.contactsList = async (req, res) => {
  const contacts = await q(`SELECT * FROM contact_submissions ORDER BY created_at DESC`);
  res.render('admin/contacts', { title: 'Contact Submissions | Abhyaas Admin', contacts });
};

// ── Compliance ────────────────────────────────────────
exports.complianceList = async (req, res) => {
  const docs = await q(`SELECT * FROM compliance_documents WHERE is_active=1 ORDER BY sort_order`);
  res.render('admin/compliance', { title: 'Compliance Docs | Abhyaas Admin', docs, error: req.query.error || null, success: req.query.success || null });
};

exports.complianceUpload = (req, res) => {
  complianceUpload(req, res, async err => {
    if (err) return res.redirect('/admin/compliance?error=' + encodeURIComponent(err.message));
    if (!req.file) return res.redirect('/admin/compliance?error=No+file+uploaded');
    const fp = path.join(UPLOADS_BASE, 'compliance', req.file.filename);
    if (!isValidDocument(fp)) {
      fs.unlinkSync(fp);
      return res.redirect('/admin/compliance?error=Invalid+file+type.+PDF%2C+DOC%2C+DOCX+only.');
    }
    const { doc_type, label, year, sort_order } = req.body;
    await q(
      `INSERT INTO compliance_documents (doc_type, label, filename, year, sort_order, uploaded_by) VALUES (?,?,?,?,?,?)`,
      [doc_type, label, req.file.filename, year || null, sort_order || 0, req.session.adminId]
    );
    res.redirect('/admin/compliance?success=Document+uploaded');
  });
};

exports.complianceDelete = async (req, res) => {
  await q(`UPDATE compliance_documents SET is_active=0 WHERE id=?`, [req.params.id]);
  res.redirect('/admin/compliance');
};

// ── Downloads ─────────────────────────────────────────
exports.downloadsList = async (req, res) => {
  const downloads = await q(`SELECT * FROM downloads WHERE is_active=1 ORDER BY category, created_at DESC`);
  res.render('admin/downloads', { title: 'Downloads | Abhyaas Admin', downloads });
};

exports.downloadUpload = (req, res) => {
  downloadUpload(req, res, async err => {
    if (err) return res.redirect('/admin/downloads?error=' + encodeURIComponent(err.message));
    if (!req.file) return res.redirect('/admin/downloads?error=No+file+uploaded');
    const fp = path.join(UPLOADS_BASE, 'downloads', req.file.filename);
    if (!isValidDocument(fp)) {
      fs.unlinkSync(fp);
      return res.redirect('/admin/downloads?error=Invalid+file+type');
    }
    const { label, category } = req.body;
    await q(
      `INSERT INTO downloads (label, filename, category, uploaded_by) VALUES (?,?,?,?)`,
      [label, req.file.filename, category || 'other', req.session.adminId]
    );
    res.redirect('/admin/downloads');
  });
};

exports.downloadDelete = async (req, res) => {
  await q(`UPDATE downloads SET is_active=0 WHERE id=?`, [req.params.id]);
  res.redirect('/admin/downloads');
};

// ── Newsletter ────────────────────────────────────────
exports.newsletterList = async (req, res) => {
  const subscribers = await q(`SELECT * FROM newsletter_subscribers ORDER BY created_at DESC`);
  res.render('admin/newsletter', { title: 'Newsletter | Abhyaas Admin', subscribers });
};

exports.newsletterDelete = async (req, res) => {
  await q(`DELETE FROM newsletter_subscribers WHERE id=?`, [req.params.id]);
  res.redirect('/admin/newsletter');
};

// ── Settings ──────────────────────────────────────────
exports.settings = async (req, res) => {
  const rows = await q(`SELECT setting_key, value FROM settings`);
  const map = {};
  rows.forEach(s => { map[s.setting_key] = s.value; });
  res.render('admin/settings', {
    title: 'Settings | Abhyaas Admin',
    settings: map,
    success: req.query.success || null,
    error:   req.query.error   || null,
  });
};

exports.saveSettings = async (req, res) => {
  const { admissions_open, admission_year, phone, whatsapp,
          current_password, new_password, confirm_password } = req.body;
  const upsert = async (key, val) => {
    if (val !== undefined)
      await q(`INSERT INTO settings (setting_key, value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=?`, [key, val, val]);
  };
  await Promise.all([
    upsert('admissions_open', admissions_open === '1' ? '1' : '0'),
    upsert('admission_year',  admission_year),
    upsert('phone',           phone),
    upsert('whatsapp',        whatsapp),
  ]);
  if (new_password) {
    if (new_password !== confirm_password) return res.redirect('/admin/settings?error=Passwords+do+not+match');
    try {
      const { queryOne } = require('../config/db');
      const admin = await queryOne(`SELECT password FROM admins WHERE id=?`, [req.session.adminId]);
      if (!admin || !await bcrypt.compare(current_password, admin.password))
        return res.redirect('/admin/settings?error=Wrong+current+password');
      const hash = await bcrypt.hash(new_password, 10);
      await q(`UPDATE admins SET password=? WHERE id=?`, [hash, req.session.adminId]);
    } catch { /* DB issue */ }
  }
  res.redirect('/admin/settings?success=1');
};
