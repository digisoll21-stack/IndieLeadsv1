# IndieLeads Enterprise - Production Deployment Guide 🚀

Now that the codebase is completely patched and all core features are integrated, this guide details the exact steps required to deploy the application and make it public for beta users.

---

## 🏗️ 1. Infrastructure Architecture & Services

For a secure, scalable production release, you should use the following third-party infrastructure:

```mermaid
graph TD
    Client[Client Browser] -->|DNS records| Vercel[Vercel: Frontend Web hosting]
    Client -->|HTTPS requests| API[Railway/Fly.io: NestJS Backend API]
    API -->|Read/Write| Postgres[(Neon/Supabase: PostgreSQL DB)]
    API -->|Queue Jobs| Redis[(Upstash: Redis Cache/Queues)]
    Workers[Railway/Fly.io: Background Workers] -->|Read/Write| Postgres
    Workers -->|Consume Jobs| Redis
```

| Component | Recommended Service | Price Tier (Beta) |
| :--- | :--- | :--- |
| **Database** | [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) | Free Tier (PostgreSQL) |
| **Cache & Queue** | [Upstash](https://upstash.com) | Free Tier (Redis) |
| **Backend (API & Workers)** | [Railway.app](https://railway.app) or [Fly.io](https://fly.io) | Hobby Tier ($5/mo) |
| **Web Dashboard** | [Vercel](https://vercel.com) or [Render Static](https://render.com) | Free Tier (React Static) |
| **AI Content** | [Google AI Studio](https://aistudio.google.com) | Pay-as-you-go (Gemini 2.5 Flash) |

---

## 🔑 2. Environment Variables Configuration (`.env`)

You need to configure the following environment variables on your backend hosting platform (Railway/Fly.io):

### A. Core Server Settings
* `PORT`: `3000`
* `NODE_ENV`: `production`
* `FRONTEND_URL`: The URL of your deployed Vercel frontend (e.g., `https://app.indieleads.ai`)
* `API_URL`: The URL of your deployed Railway backend (e.g., `https://api.indieleads.ai`)

### B. Databases & Caching
* `DATABASE_URL`: Your Neon/Supabase PostgreSQL connection string. (e.g. `postgresql://user:pass@host:port/dbname?sslmode=require`)
* `RUN_MIGRATIONS`: `true` (Triggers `prisma db push` on container startup to populate the schema)
* `REDIS_URL`: Your Upstash Redis connection string. (e.g. `rediss://default:pass@host:port`)

### C. Security Keys
* `JWT_SECRET`: A secure, random 32-character key. Generate one using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
* `MASTER_ENCRYPTION_KEY`: A cryptographically secure key of **exactly 32 characters** (used for AES-256 encryption of user SMTP/IMAP passwords). **CRITICAL:** Do not change this key once users start connecting inboxes, or you will lose access to decrypting credentials.

### D. Third-Party Integrations
* `API_KEY`: Your Google Gemini API Key (from AI Studio).
* `STRIPE_SECRET_KEY`: Your Stripe secret key (from your Stripe Dashboard under Developers > API Keys).
* `STRIPE_WEBHOOK_SECRET`: Your Stripe Webhook signing secret (generated when you register your webhook callback to `https://api.indieleads.ai/api/v1/billing/webhook`).
* `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Credentials to support Gmail/Google Workspace OAuth.
* `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET`: Credentials to support Outlook/Office 365 OAuth.
* `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM`: Transactional SMTP credentials (e.g., Resend or SendGrid) to send transactional emails like signups, resets, and invites.

---

## 🚀 3. Step-by-Step Deployment Protocol

### Step 1: Initialize Database & Cache
1. Create a PostgreSQL project on Neon.tech. Copy the connection string.
2. Create a Serverless Redis instance on Upstash. Copy the Redis URL connection string.

### Step 2: Configure Stripe Checkout & Webhooks
1. Log into your Stripe Dashboard. In **Developers > API Keys**, copy your Secret Key.
2. Go to **Developers > Webhooks** and click **Add Endpoint**.
   * Set Endpoint URL to: `https://<YOUR_DEPI_API_DOMAIN>/api/v1/billing/webhook`
   * Select events to listen to: `checkout.session.completed`
   * Copy the generated Webhook Signing Secret (`whsec_...`).

### Step 3: Deploy the Backend API & Workers
On **Railway.app**:
1. Click **New Project** > **Deploy from GitHub repo**. Choose `IndieLeads`.
2. In the **Variables** tab, paste all your environment variables.
3. In the **Settings** tab, configure the Start command for the API service:
   ```bash
   npm run start:api
   ```
4. Generate a public Domain/URL for your API service (e.g., `https://indieleads-api.up.railway.app`).
5. **Worker deployment:** Add a second service copy of the same repo in Railway. In its **Settings** tab, change the Start command to run the workers:
   ```bash
   npm run start:workers
   ```
   *(No public domain/port is exposed for the worker service, as it only listens to Redis).*

### Step 4: Deploy the Web Frontend
On **Vercel** or **Render**:
1. Select **New Project** and connect your GitHub repo.
2. Set the build parameters:
   * **Build Command:** `npm run build:web`
   * **Output Directory:** `apps/web/dist`
3. Add the following environment variable:
   * `VITE_API_URL`: pointing to your API domain (e.g. `https://indieleads-api.up.railway.app/api/v1`)
4. Click **Deploy**. Vercel will build and serve your static React frontend.

---

## 🔍 4. Verification Checklists

### E2E Launch Verification
* Run a signup test to ensure the transactional email service fires the verification email successfully.
* Connect a test Gmail or Outlook account (verifying that MX and DNS lookups trigger correctly in the background).
* Run a mock campaign with a test contact to verify sequencing and that link-clicking/open-tracking redirects and metrics write to the database successfully.
* Click the Upgrade button to verify the Stripe checkout session successfully redirects you to Stripe, and that local webhooks handle events securely.
