# How Statistics Work in Production

## 📍 Where Your Data Lives in Production

When you deploy to Vercel and set up Vercel KV, here's exactly where your statistics data is stored:

### Production Data Storage: Vercel KV (Redis Database)

**Location:** Your data lives in a **Vercel KV database** (Redis) that Vercel manages for you.

**Think of it like this:**
- 📦 **Vercel KV** = A separate database service (like a filing cabinet)
- 🔑 **Your keys** = `usage:webo-news-overlay` and `usage:ccn-image-optimiser`
- 💾 **Your values** = The count numbers (0, 1, 2, 3, etc.)

### What Happens When You Deploy:

1. **You push to GitHub** → Triggers Vercel deployment
2. **Vercel builds your app** → Creates serverless functions
3. **Your app connects to Vercel KV** → Using environment variables
4. **Statistics persist** → Data survives deployments, restarts, and updates!

## 🔄 Data Flow in Production:

```
User downloads image
    ↓
Client calls: POST /api/track-usage { tool: 'webo-news-overlay' }
    ↓
Serverless function (on Vercel)
    ↓
Connects to Vercel KV database (Redis)
    ↓
Increments counter: usage:webo-news-overlay → 42 (example)
    ↓
Data saved permanently in Vercel KV
    ↓
Next time you check /statistics → Reads from same KV database
```

## ✅ Key Benefits:

1. **Persistent** - Data survives server restarts, deployments, and updates
2. **Shared** - All server instances read/write to the same database
3. **Reliable** - No data loss, even if Vercel restarts functions
4. **Fast** - Redis is optimized for counter operations
5. **Scalable** - Works with millions of requests

## 🚨 Without Vercel KV (Current Local Setup):

- ❌ Data resets on every server restart
- ❌ Data resets on every deployment
- ❌ Each server instance has different numbers
- ❌ Completely unreliable in production

## 📋 Setup Checklist for Production:

- [ ] Create Vercel KV database in Vercel dashboard
- [ ] Verify environment variables are auto-added
- [ ] Add KV credentials to `.env.local` for local testing
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Test: Download an image → Check `/statistics` → Should persist!

## 💰 Cost:

Vercel KV has a **free tier** that includes:
- 256 MB storage
- 30,000 requests/day
- Perfect for tracking tool usage!

If you need more, pricing starts at $0.20/month for 1GB storage.

---

**Summary:** Your statistics data lives in a **separate Redis database** (Vercel KV) that Vercel manages. It's completely independent of your code deployments, so data persists forever (or until you delete it).

