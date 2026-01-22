# How to Debug Upstash Connection Issues

## Step 1: Check Browser Console

1. Open your Statistics page in the browser
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Look for error messages - they should show what the API is returning

## Step 2: Check Network Tab

1. In Developer Tools, go to the **Network** tab
2. Refresh the Statistics page
3. Look for a request to `/api/track-usage`
4. Click on it to see:
   - The **Response** tab - shows what the API returned
   - The **Headers** tab - shows request/response headers

The response should show either:
- Success with counts
- Error message explaining what's missing

## Step 3: Check Vercel Logs (Alternative Method)

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** in the top menu
3. Go to **Logs** tab (or look for "Function Logs" or "Runtime Logs")
4. Filter by your API route name or search for "track-usage"

## Step 4: Verify Environment Variables

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Make sure `KV_REST_API_URL` and `KV_REST_API_TOKEN` exist
3. Check that they're enabled for **Production** environment
4. If they're only set for Preview/Development, edit them to include Production

## Step 5: Force Redeploy

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the three dots (⋯) → **Redeploy**
4. Uncheck "Use existing Build Cache" if available
5. Click **Redeploy**

## What to Look For

The API should return one of:
- `{ "webo-news-overlay": 0, "ccn-image-optimiser": 0 }` - Success! (just no data yet)
- `{ "webo-news-overlay": 0, "ccn-image-optimiser": 0, "error": "..." }` - Error, check the error message

