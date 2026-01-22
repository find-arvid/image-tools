# Fix: Redis not configured error

The API is returning `{"error":"Redis not configured"}` which means the environment variables aren't being found in production.

## Solution: Check Environment Variable Settings

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. For each of these variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   
3. **Check the "Environments" column** - make sure **Production** is checked ✅

4. If Production is NOT checked:
   - Click on the variable
   - Edit it
   - Make sure **Production** is selected
   - Save

5. **After updating environment variables, you MUST redeploy:**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Select **"Redeploy"**
   - This is required for environment variable changes to take effect!

## Why this happens

Environment variables can be set for different environments:
- Development (local)
- Preview (branch deployments)
- Production (main branch)

If Production isn't checked, the variables won't be available in your live site!

