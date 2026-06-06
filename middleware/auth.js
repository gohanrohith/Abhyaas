function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect('/admin/login');
  }
  res.locals.layout    = 'layouts/admin';
  res.locals.adminName = req.session.adminName;
  res.locals.adminRole = req.session.adminRole;
  next();
}

module.exports = { requireAdmin };
