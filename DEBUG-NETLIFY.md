# Debug: Environment Variables on Netlify

## Quick Checks:

### 1. Did you redeploy AFTER adding the variables?

Environment variables only apply to **new deployments**. If you added them but didn't redeploy, they won't be available!

**Fix:** Go to Deploys → Trigger deploy → Deploy site

### 2. Check if variables are available in the function

The console.log should show which variables are found. Check the Netlify Function logs.

### 3. Verify Variable Names are Exact

Make sure the keys are EXACTLY:
- `KV_REST_API_URL` (case-sensitive!)
- `KV_REST_API_TOKEN` (case-sensitive!)

### 4. Check Function Logs

1. Go to Netlify Dashboard → Your Site
2. Look for "Functions" or "Runtime Logs" tab
3. Check the logs when you visit `/statistics` page
4. Look for the "Environment check:" log - it should show which variables were found

### 5. Verify Scopes

Make sure the environment variables are set for:
- ✅ **Functions** scope (this is what runs API routes)
- ✅ **Production** context

### 6. Test Direct API Call

Try calling the API directly in your browser:
`https://delightful-zabaione-42686e.netlify.app/api/track-usage`

This will show you the raw response and any errors.

