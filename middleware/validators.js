const { body, validationResult } = require('express-validator');

const admissionEnquiry = [
  body('parent_name').trim().notEmpty().withMessage('Parent name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
];

const contactForm = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
];

function handleErrors(redirectPath) {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect(`${redirectPath}?error=${encodeURIComponent(errors.array()[0].msg)}`);
    }
    next();
  };
}

module.exports = { admissionEnquiry, contactForm, handleErrors };
