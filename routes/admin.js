const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const { csrfProtect }  = require('../middleware/csrf');

// Auth (public)
router.get('/login',  ctrl.loginPage);
router.post('/login', csrfProtect, ctrl.loginSubmit);
router.get('/logout', ctrl.logout);

// All routes below require login
router.use(requireAdmin);
router.use((req, res, next) => {
  if (req.method === 'POST') return csrfProtect(req, res, next);
  next();
});

// Dashboard
router.get('/', ctrl.dashboard);

// Blog posts
router.get('/blog',                ctrl.blogList);
router.get('/blog/new',            ctrl.blogNew);
router.post('/blog/create',        ctrl.blogCreate);
router.get('/blog/:id/edit',       ctrl.blogEdit);
router.post('/blog/:id/update',    ctrl.blogUpdate);
router.post('/blog/:id/delete',    ctrl.blogDelete);
router.post('/blog/:id/publish',   ctrl.blogPublish);
router.post('/blog/:id/unpublish', ctrl.blogUnpublish);

// Events
router.get('/events',               ctrl.eventsList);
router.get('/events/new',           ctrl.eventNew);
router.post('/events/create',       ctrl.eventCreate);
router.get('/events/:id/edit',      ctrl.eventEdit);
router.post('/events/:id/update',   ctrl.eventUpdate);
router.post('/events/:id/delete',   ctrl.eventDelete);

// Gallery
router.get('/gallery',                    ctrl.galleryList);
router.get('/gallery/new-album',          ctrl.albumNew);
router.post('/gallery/album/create',      ctrl.albumCreate);
router.get('/gallery/album/:id',          ctrl.albumView);
router.post('/gallery/album/:id/upload',  ctrl.albumUpload);
router.post('/gallery/album/:id/delete',  ctrl.albumDelete);
router.post('/gallery/photo/:id/delete',  ctrl.photoDelete);

// Faculty
router.get('/faculty',               ctrl.facultyList);
router.post('/faculty/create',       ctrl.facultyCreate);
router.post('/faculty/:id/delete',   ctrl.facultyDelete);

// Admissions
router.get('/admissions',            ctrl.admissionsList);
router.get('/admissions/:id',        ctrl.admissionDetail);
router.post('/admissions/:id/status',ctrl.admissionStatus);

// Contact submissions
router.get('/contacts',              ctrl.contactsList);

// Compliance documents
router.get('/compliance',            ctrl.complianceList);
router.post('/compliance/upload',    ctrl.complianceUpload);
router.post('/compliance/:id/delete',ctrl.complianceDelete);

// Downloads
router.get('/downloads',             ctrl.downloadsList);
router.post('/downloads/upload',     ctrl.downloadUpload);
router.post('/downloads/:id/delete', ctrl.downloadDelete);

// Newsletter
router.get('/newsletter',              ctrl.newsletterList);
router.post('/newsletter/:id/delete',  ctrl.newsletterDelete);

// Session keepalive
router.get('/keepalive', (req, res) => { req.session.touch(); res.sendStatus(204); });

// Settings
router.get('/settings',  ctrl.settings);
router.post('/settings', ctrl.saveSettings);

module.exports = router;
