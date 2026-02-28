# Roll Notes — Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **New Project**
3. Name it `roll-notes`, choose a strong database password, pick the region closest to your users
4. Wait for the project to finish provisioning (~1 minute)

## 2. Run the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste the entire contents of `schema.sql` from this repo
4. Click **Run** — you should see "Success. No rows returned" for each statement
5. Verify by going to **Table Editor** — you should see 4 tables: `cameras`, `rolls`, `custom_film_stocks`, `user_settings`

## 3. Add Your Supabase Credentials

1. In your Supabase project, go to **Settings > API**
2. Copy the **Project URL** (looks like `https://abc123.supabase.co`)
3. Copy the **anon / public** key (the long `eyJ...` string)
4. Create `js/config.js` by copying `js/config.example.js`:
   ```bash
   cp js/config.example.js js/config.js
   ```
5. Edit `js/config.js` and paste your URL and key:
   ```js
   window.ROLLNOTES_CONFIG = {
     SUPABASE_URL: 'https://your-project-id.supabase.co',
     SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIs...'
   };
   ```

> **Important:** `js/config.js` is gitignored. Never commit real keys.

## 4. Invite Beta Users

1. In your Supabase project, go to **Authentication > Users**
2. Click **Invite user**
3. Enter the beta user's email address and click **Invite**
4. Supabase sends them an email with a link to set their password
5. Repeat for up to 5 beta users

## 5. Deploy

### Option A: Netlify (recommended)
1. Push the repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) > **Add new site** > **Import existing project**
3. Select your `roll-notes` repo
4. No build command needed — publish directory is `.` (root)
5. **Important:** Before deploying, you need `config.js` in the deployed files. Either:
   - Add it manually via Netlify's file upload, or
   - Set up a build step that creates it from environment variables

### Option B: Local
```bash
npx serve .
```
Open `http://localhost:3000` in your browser.

## 6. First Login

1. Open the deployed URL
2. Enter the email and password for one of the invited users
3. If there's existing data in localStorage (from the pre-auth version), you'll see a migration prompt
4. Choose "Import My Data" or "Start Fresh"
5. You're in — start logging rolls
