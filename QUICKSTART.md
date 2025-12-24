# 🚀 Quick Start Guide - Avenir Trading (Supabase)

## ⚡ 5-Minute Setup

Your app has been **completely migrated from Firebase to Supabase**. Follow these steps to get it running:

---

## Step 1: Create Supabase Project (2 minutes)

1. Go to **https://supabase.com** and sign in
2. Click **"New Project"**
3. Fill in:
   - Name: `avenir-trading`
   - Password: (choose strong password, save it!)
   - Region: **South Asia (Mumbai)**
4. Click **"Create new project"** and wait 2 minutes

---

## Step 2: Get Your Credentials (1 minute)

1. In Supabase dashboard, go to **Settings** (⚙️) → **API**
2. Copy these TWO values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string under "Project API keys"

---

## Step 3: Add to Your App (30 seconds)

1. Open **`.env`** file in your project root
2. Paste your values:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
VITE_WHATSAPP_PHONE_NUMBER=919876543210
```

---

## Step 4: Create Database (2 minutes)

1. In Supabase, click **"SQL Editor"** in sidebar
2. Click **"New query"**
3. Copy this SQL script: **Open [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** and copy the entire SQL script from **Step 4**
4. Paste in SQL Editor and click **"Run"**

---

## Step 5: Create Storage (1 minute)

1. Click **"Storage"** in sidebar
2. Click **"New bucket"**
3. Name: `materials`
4. **Check "Public bucket"** ✅
5. Click **"Create"**

---

## Step 6: Create Admin User (2 minutes)

### A. Create Auth User
1. Click **"Authentication"** → **"Users"**
2. Click **"Add user"** → **"Create new user"**
3. Email: `admin@avenirtrading.com` (or your email)
4. Password: (strong password)
5. **Check "Auto Confirm User"** ✅
6. Click **"Create"**
7. **COPY THE USER ID** (UUID shown in list)

### B. Add Admin Role
1. Click **"Table Editor"** → **"users"**
2. Click **"Insert row"**
3. Fill in:
   - **uid**: Paste the User ID
   - **email**: Same email you used
   - **role**: `admin`
   - **display_name**: Your name
4. Click **"Save"**

---

## Step 7: Run Your App! 🎉

```bash
npm run dev
```

Open browser: **http://localhost:5173**

Login with your admin credentials!

---

## 📝 What's Different?

| Before (Firebase) | Now (Supabase) |
|-------------------|----------------|
| NoSQL Database | PostgreSQL (SQL) |
| Firestore | Postgres Tables |
| Firebase Storage | Supabase Storage |
| Proprietary | Open Source |

---

## 🆘 Troubleshooting

### Can't login?
- Make sure "Auto Confirm User" was checked
- Go to Authentication → Users → verify "Email Confirmed" is true

### Env errors?
- Restart dev server: `Ctrl+C` then `npm run dev`

### Need more help?
- Check detailed guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- Check migration details: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)

---

## ✅ You're Done!

Your granite trading app is now running on:
- ✅ Supabase Authentication
- ✅ PostgreSQL Database
- ✅ Supabase Storage
- ✅ Realtime Updates

**Start managing your granite inventory!** 🚀
