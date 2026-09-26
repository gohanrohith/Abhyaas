# Abhyaas The Global School — Session Memory

**Client:** Abhyaas The Global School (Virora International client)
**Repo:** `D:\Abhyaas`
**Type:** Single-school website — full end-to-end management by Virora

---

## Stack
| Layer | Detail |
|---|---|
| Framework | Node.js + Express.js 5 |
| Templates | EJS + express-ejs-layouts |
| Database | MySQL (session store + content) |
| Session | express-session + MySQLStore |
| Email | Nodemailer |
| Port | 3000 |

## Run locally
```bash
npm run dev    # http://localhost:3000
```

---

## Architecture
Single Express app: main site (`/`) + admin panel (`/admin`).
Upload dirs auto-created on startup: `blog`, `events`, `gallery`, `faculty`, `compliance`, `downloads`, `avatars`.

---

## Current Status
Active. Similar structure to Greenwood but single-campus (no campus routing).

---

## Last Session (2026-07-27)
- Read and understood project structure
- No code changes made

---

## Key Files
| File | Purpose |
|---|---|
| `app.js` | Express app entry |
| `routes/main.js` | Public site routes |
| `routes/admin.js` | Admin panel routes |
| `controllers/` | Page handlers |
| `views/` | EJS templates |
| `BRAND.md` | Abhyaas brand colors and logo info |
