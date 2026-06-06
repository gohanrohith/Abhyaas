const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/mainController');
const { formLimiter } = require('../middleware/rateLimiter');
const { csrfProtect } = require('../middleware/csrf');
const { admissionEnquiry, contactForm, handleErrors } = require('../middleware/validators');

// Core pages
router.get('/',            ctrl.home);
router.get('/about',       ctrl.about);
router.get('/academics',   ctrl.academics);
router.get('/facilities',  ctrl.facilities);
router.get('/faculty',     ctrl.faculty);
router.get('/achievements',ctrl.achievements);
router.get('/disclosure',  ctrl.disclosure);
router.get('/downloads',   ctrl.downloads);
router.get('/search',      ctrl.search);

// Admissions
router.get('/admissions',  ctrl.admissions);
router.post('/admissions/enquiry', formLimiter, csrfProtect, ...admissionEnquiry, handleErrors('/admissions'), ctrl.admissionEnquiry);

// Contact
router.get('/contact',     ctrl.contact);
router.post('/contact',    formLimiter, csrfProtect, ...contactForm, handleErrors('/contact'), ctrl.contactSubmit);

// Blog
router.get('/blog',               ctrl.blog);
router.get('/blog/:slug',         ctrl.blogPost);
router.get('/blog/category/:cat', ctrl.blogCategory);

// Events
router.get('/events',      ctrl.events);

// Gallery
router.get('/gallery',         ctrl.gallery);
router.get('/gallery/:slug',   ctrl.album);

// Newsletter
router.post('/newsletter/subscribe',   formLimiter, csrfProtect, ctrl.newsletterSubscribe);
router.get('/newsletter/unsubscribe',  ctrl.newsletterUnsubscribe);

// Legal pages
router.get('/privacy-policy',    ctrl.legal('privacy-policy'));
router.get('/terms',             ctrl.legal('terms'));
router.get('/child-protection',  ctrl.legal('child-protection'));
router.get('/posh',              ctrl.legal('posh'));
router.get('/anti-bullying',     ctrl.legal('anti-bullying'));
router.get('/refund-policy',     ctrl.legal('refund'));
router.get('/cookie-policy',     ctrl.legal('cookie'));

// SEO
router.get('/sitemap.xml', ctrl.sitemap);
router.get('/robots.txt',  ctrl.robots);

module.exports = router;
