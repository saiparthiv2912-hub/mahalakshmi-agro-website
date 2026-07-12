# Mahalaxmi Agro Industries — Website + Backend

A full-stack version of the site: the original static design, plus a Node.js/Express
backend that stores wholesale quote requests in a simple JSON file and gives you an
admin dashboard to manage them. It only depends on Express — no native modules to
compile, so `npm install` works cleanly on any machine with Node.js installed.

## What's included

- `public/index.html` — the website (same design as before). The "Request a wholesale
  quote" form now submits to the backend instead of just changing a button label.
- `server.js` — Express server: serves the site, exposes the API, and serves the
  admin dashboard.
- `admin/index.html` — a password-protected dashboard to view, update the status of,
  and delete incoming quote requests.
- `data/quotes.json` — where quote requests are stored (created automatically on
  first run).

## Setup

```bash
npm install
npm start
```

The site will be running at **http://localhost:3000**.

## Admin dashboard

Visit **http://localhost:3000/admin**.

- Username: `admin`
- Password: `changeme123` (default)

**Change the password before deploying** by setting an environment variable:

```bash
ADMIN_USER=youruser ADMIN_PASSWORD=your-strong-password npm start
```

Or create a `.env`-style startup script / set these in your hosting provider's
environment variable settings.

## API

| Method | Route              | Auth   | Purpose                               |
|--------|--------------------|--------|----------------------------------------|
| POST   | `/api/quotes`      | Public | Submit a wholesale quote request       |
| GET    | `/api/quotes`      | Admin  | List all quote requests                |
| PATCH  | `/api/quotes/:id`  | Admin  | Update a request's status              |
| DELETE | `/api/quotes/:id`  | Admin  | Delete a request                       |

Quote request statuses: `new`, `contacted`, `quoted`, `won`, `lost`.

## Deploying

This is a normal Node.js app, so it runs on any host that supports Node
(Render, Railway, a VPS, etc.):

1. Upload the project (excluding `node_modules` and `data/`).
2. Run `npm install` on the server.
3. Set `ADMIN_USER` / `ADMIN_PASSWORD` (and optionally `PORT`) as environment variables.
4. Run `npm start`, or point your process manager (pm2, systemd) at `server.js`.

The `data/quotes.json` file persists your quote requests between restarts — back it up
periodically if you rely on it long-term. For higher-traffic production use, you could
swap this out for a real database (SQLite, Postgres, etc.) later without changing the
API shape much.
