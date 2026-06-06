const nodemailer = require('nodemailer');
const https = require('https');

let transport = null;

function getTransport() {
  if (transport) return transport;
  if (!process.env.MAIL_PASS) return null;
  const port = parseInt(process.env.MAIL_PORT || '465');
  transport = nodemailer.createTransport({
    host:   process.env.MAIL_HOST || 'smtp.hostinger.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  return transport;
}

async function sendMail({ to, subject, html }) {
  const t = getTransport();
  if (!t) return;
  await t.sendMail({
    from: process.env.MAIL_FROM || `Abhyaas The Global School <${process.env.MAIL_USER}>`,
    to, subject, html,
  });
}

async function sendTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  return new Promise(resolve => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => { res.resume(); resolve(); });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

async function notifyAdmissionEnquiry(data) {
  const msg = [
    `📋 *New Admission Enquiry — Abhyaas*`,
    `👤 Parent: ${data.parent_name}`,
    `📞 Phone: ${data.phone}`,
    data.email ? `✉️ Email: ${data.email}` : null,
    `🎓 Student: ${data.student_name || '—'} (Class ${data.class_seeking || '—'})`,
    data.message ? `💬 ${data.message.slice(0, 200)}` : null,
  ].filter(Boolean).join('\n');
  await Promise.all([
    sendTelegram(msg),
    sendMail({
      to: process.env.MAIL_USER,
      subject: `New Admission Enquiry — ${data.parent_name}`,
      html: `<h2>New Admission Enquiry</h2>
        <p><strong>Parent:</strong> ${data.parent_name}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Email:</strong> ${data.email || '—'}</p>
        <p><strong>Student:</strong> ${data.student_name || '—'}, Class ${data.class_seeking || '—'}</p>
        <p><strong>Message:</strong> ${data.message || '—'}</p>`,
    }),
  ]);
}

async function autoReplyAdmission(data) {
  if (!data.email) return;
  await sendMail({
    to: data.email,
    subject: 'Thank you for your enquiry — Abhyaas The Global School',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <div style="background:#292275;padding:24px;border-radius:8px 8px 0 0">
        <h2 style="color:#fff;margin:0">Abhyaas The Global School</h2>
        <p style="color:#a83705;margin:4px 0 0;font-size:.85rem">Sramayeva Jayathe</p>
      </div>
      <div style="padding:24px;background:#f9f9f9;border-radius:0 0 8px 8px">
        <p>Dear ${data.parent_name},</p>
        <p>Thank you for your interest in Abhyaas The Global School! We have received your enquiry for <strong>${data.student_name || 'your child'}</strong> (Class ${data.class_seeking || '—'}).</p>
        <p>Our admissions team will contact you shortly on <strong>${data.phone}</strong>.</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
        <p style="font-size:.85rem;color:#666">— Admissions Team, Abhyaas The Global School, Bhimavaram</p>
      </div>
    </div>`,
  });
}

async function notifyContact(data) {
  const msg = [
    `📩 *Contact Form — Abhyaas*`,
    `👤 ${data.name}`,
    `📞 ${data.phone}`,
    data.email ? `✉️ ${data.email}` : null,
    data.subject ? `📌 ${data.subject}` : null,
    `💬 ${(data.message || '').slice(0, 200)}`,
  ].filter(Boolean).join('\n');
  await Promise.all([
    sendTelegram(msg),
    sendMail({
      to: process.env.MAIL_USER,
      subject: `Contact Form — ${data.subject || 'General Enquiry'}`,
      html: `<h2>Contact Form</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Email:</strong> ${data.email || '—'}</p>
        <p><strong>Subject:</strong> ${data.subject || '—'}</p>
        <p><strong>Message:</strong> ${data.message}</p>`,
    }),
  ]);
}

module.exports = { notifyAdmissionEnquiry, autoReplyAdmission, notifyContact };
