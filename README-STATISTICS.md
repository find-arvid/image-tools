# Statistics Tracking Setup

## ✅ Current Implementation: Vercel KV (Persistent Storage)

The statistics tracking now uses **Vercel KV** (Redis) for persistent, shared storage.

## 🚀 Production Setup (Required!)

**IMPORTANT:** You MUST set up Vercel KV before deploying to production. Otherwise, statistics will not be tracked.

### Step-by-Step Setup:

1. **Create a Vercel KV Database:**
   - Go to https://vercel.com/dashboard
   - Select your project (or create one if needed)
   - Go to **Storage** tab → Click **Create Database**
   - Choose **KV** (Redis)
   - Give it a name (e.g., "image-tools-stats")
   - Choose a region close to your users
   - Click **Create**

2. **Add Environment Variables:**
   Vercel should automatically add these to your project, but verify:
   - Go to your project → **Settings** → **Environment Variables**
   - You should see:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN` (optional, for read-only access)
   
   ✅ These are automatically added when you create the KV database!

3. **For Local Development:**
   - Copy the environment variables from Vercel dashboard
   - Add them to your `.env.local` file:
     ```
     KV_REST_API_URL=your_kv_url_here
     KV_REST_API_TOKEN=your_kv_token_here
     ```
   - Restart your dev server: `npm run dev`

4. **Deploy:**
   - Push to GitHub
   - Vercel will automatically deploy with the KV database connected
   - Statistics will now persist across all deployments and server restarts!

### ✅ Already Implemented!

The API route (`app/api/track-usage/route.ts`) already uses Vercel KV. Just follow the setup steps above!

## Alternative: Database Options

If you need more complex queries or want to track additional data (timestamps, user info, etc.), consider:

- **PostgreSQL** (via Vercel Postgres or Supabase)
- **MongoDB** (via MongoDB Atlas)
- **Upstash** (Serverless Redis alternative)

These would allow you to track:
- Usage per day/week/month
- Peak usage times
- User demographics (if collected)
- Error rates
- And more!

## Current Features

✅ Tracks downloads from both tools
✅ Real-time statistics page (updates every 5 seconds)
✅ Percentage breakdown per tool
✅ Total usage counter
✅ Auto-refresh on statistics page

