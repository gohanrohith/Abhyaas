const school = require('../config/school');

module.exports = function siteMiddleware(req, res, next) {
  const domain = process.env.MAIN_DOMAIN || 'abhyaastheglobalschool.com';
  res.locals.school       = school;
  res.locals.currentYear  = new Date().getFullYear();
  res.locals.canonicalUrl = `https://${domain}${req.path}`;
  res.locals.currentPath  = req.path;
  next();
};
