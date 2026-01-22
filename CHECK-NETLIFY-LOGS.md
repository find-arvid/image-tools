# How to Check Netlify Function Logs

## Check Function Logs to See What's Happening

The code has debug logging that will show which environment variables are found. Here's how to check:

### Option 1: Netlify Dashboard

1. Go to Netlify Dashboard → Your Site
2. Look for **"Functions"** tab or **"Logs"** tab
3. Or go to **Site settings** → **Functions** → **View logs**
4. Look for logs that say "Environment check:" - this shows what variables were found

### Option 2: Check Deployment Logs

1. Go to **Deploys** tab
2. Click on the latest deployment
3. Look for build logs or function logs
4. Search for "Environment check" or "Redis"

### Option 3: Test API Directly

Open this URL in your browser:
```
https://delightful-zabaione-42686e.netlify.app/api/track-usage
```

This will show the raw JSON response and any errors.

## What to Look For

The logs should show something like:
```
Environment check: {
  hasKV_REST_API_URL: true/false,
  hasKV_REST_API_TOKEN: true/false,
  allKVVars: ['KV_REST_API_URL', 'KV_REST_API_TOKEN', ...]
}
```

If `hasKV_REST_API_URL` or `hasKV_REST_API_TOKEN` is `false`, the variables aren't being found.

## Possible Issues

1. **Variables not set for Functions scope** - Make sure "Functions" scope is checked
2. **Variables not set for Production** - Make sure Production context has the values
3. **Deployment didn't pick up variables** - Need to redeploy after adding variables

