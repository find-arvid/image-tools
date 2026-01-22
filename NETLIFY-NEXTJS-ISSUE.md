# Netlify + Next.js API Routes Issue

## Possible Issue: Next.js API Routes on Netlify

Netlify handles Next.js API routes differently than Vercel. The environment variables might not be accessible the same way.

## Quick Test

After the latest code deploys (with debug logging), check the API response:

Visit: `https://delightful-zabaione-42686e.netlify.app/api/track-usage`

You should see a `debug` object that shows which environment variables were found.

## Alternative: Check Netlify Function Logs

1. Go to Netlify Dashboard → Your Site
2. Look for **Runtime Logs** or **Function Logs**
3. Check logs when you visit `/statistics` page
4. Look for "Environment check:" or "=== Environment Variable Check ==="

## If Variables Still Not Found

Netlify might need:
1. A `netlify.toml` configuration file
2. Variables to be set differently for Next.js
3. Or we might need to use Netlify Functions directly instead of Next.js API routes

Let's wait for the debug response first to see what's actually happening!

