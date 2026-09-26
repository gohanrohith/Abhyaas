# Abhyaas Site

Product: Client website — coaching centre
Domain: abhyaastheglobalschool.com
Virora AI agents: D:\Virora-AI\agents\ | Shared context: D:\Virora-AI\

## Stack
- Runtime: Node.js + Express.js
- Templates: EJS
- Database: MySQL2 (express-mysql-session for sessions)
- Session: express-session
- Email: Nodemailer (Hostinger SMTP — office@abhyaastheglobalschool.com)
- File upload: Multer (uploads stored at UPLOADS_DIR, outside repo)
- Security: Helmet, express-rate-limit, express-validator
- Port: 3000

## MVC structure
- app.js — entry point
- controllers/, routes/, views/, models/, middleware/, services/, utils/, public/

## Architecture constraints
- Uploads: UPLOADS_DIR env var — persistent path OUTSIDE repo on production
- Trilingual content (check views before adding new text)
- Bento gallery layout (check existing components before building new gallery)
- Telegram bot notifications: optional (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID env vars)

## Context rule
Repository is the source of truth. If this file conflicts with current code/config, flag CONTEXT DRIFT.
