# Mahalaxmi Agro Industries — Website + Backend

A full-stack version of the site: the original static design, plus a Node.js/Express
backend that stores wholesale quote requests permanently in **MongoDB Atlas** (a free,
cloud-hosted database) and gives you an admin dashboard to manage them.

## What's included

- `public/index.html` — the website (same design as before). The "Request a wholesale
  quote" form submits to the backend.
- `server.js` — Express server: serves the site, exposes the API, and serves the
  admin dashboard. Stores data in MongoDB Atlas.
- `admin/index.html` — a password-protected dashboard to view, update the status of,
  and delete incoming quote requests.

## One-time setup: create your free MongoDB Atlas database

1. Go to **https://www.mongodb.com/cloud/atlas/register** and create a free account
   (no credit card required for the free tier).
2. When prompted to create a cluster, choose the **free "M0"** tier and any region
   close to you. Give it any name (e.g. `mahalaxmi-cluster`).
3. **Create a database user**: in the left sidebar go to **Database Access** → **Add New
   Database User**. Set a username and password (write these down — you'll need them).
4. **Allow network access**: in the left sidebar go to **Network Access** → **Add IP
   Address** → choose **Allow Access from Anywhere** (`0.0.0.0/0`). This is needed so
   your hosting provider (e.g. Render) can reach the database.
5. **Get your connection string**: go to **Database** → click **Connect** on your
   cluster → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@mahalaxmi-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with the database user credentials from step 3.
   You can also add a database name before the `?`, e.g. `.../mahalaxmi?retryWrites=...`

Keep this connection string handy — it goes into an environment variable in the next step.

## Setup

```bash
npm install
```

Set the `MONGODB_URI` environment variable to your Atlas connection string, then start
the server:

```bash
# Mac/Linux
MONGODB_URI="mongodb+srv://..." npm start

# Windows (Command Prompt)
set MONGODB_URI=mongodb+srv://...
npm start
```

The site will be running at **http://localhost:3000**. The server will refuse to start
if `MONGODB_URI` isn't set — this is intentional, since there's nowhere to save data
without it.

## Admin dashboard

Visit **http://localhost:3000/admin**.

- Username: `admin`
- Password: `changeme123` (default)

**Change the password before going live** by also setting `ADMIN_USER` /
`ADMIN_PASSWORD` environment variables alongside `MONGODB_URI`.

## API

| Method | Route              | Auth   | Purpose                               |
|--------|--------------------|--------|----------------------------------------|
| POST   | `/api/quotes`      | Public | Submit a wholesale quote request       |
| GET    | `/api/quotes`      | Admin  | List all quote requests                |
| PATCH  | `/api/quotes/:id`  | Admin  | Update a request's status              |
| DELETE | `/api/quotes/:id`  | Admin  | Delete a request                       |

Quote request statuses: `new`, `contacted`, `quoted`, `won`, `lost`.

## Deploying (e.g. on Render)

1. Push this project to GitHub (make sure `public/` and `admin/` folders are included).
2. Create a new Web Service on Render, connected to that repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Under the service's **Environment** tab, add:
   - `MONGODB_URI` → your Atlas connection string
   - `ADMIN_USER` → your chosen admin username
   - `ADMIN_PASSWORD` → your chosen admin password
5. Deploy. Your data now persists permanently in MongoDB Atlas — it will **not** be
   lost on redeploys, restarts, or free-tier spin-downs, unlike local file storage.

## Custom domain

Once deployed, you can attach a custom domain (e.g. `mahalaxmi-agro-industries.com`):

1. Buy the domain from any registrar (GoDaddy, Namecheap, Hostinger, etc.).
2. On Render: your service → **Settings** → **Custom Domains** → **Add Custom Domain**.
3. Add the DNS records Render gives you at your domain registrar.
4. Render automatically issues a free SSL certificate once DNS propagates.
