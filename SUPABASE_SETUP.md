# Supabase Setup Guide for Avenir Trading

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** and sign in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `avenir-trading`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: `South Asia (Mumbai)` (closest to India)
5. Click **"Create new project"** (takes 2-3 minutes)

---

### Step 2: Get Your API Keys
1. After project is created, go to **Settings** (⚙️ icon in sidebar)
2. Click **"API"** in the left menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

---

### Step 3: Add Keys to Your Project
1. Open `/Users/bala/avenir-trading/.env` file
2. Replace the placeholders:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

---

### Step 4: Create Database Tables

#### Method A: Using SQL Editor (Easiest)
1. In Supabase Dashboard, click **"SQL Editor"** in sidebar
2. Click **"New query"**
3. Copy and paste this entire SQL script:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'buyer')),
  display_name TEXT,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials table
CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('available', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  description TEXT,
  notes TEXT
);

-- Create buy_requests table
CREATE TABLE buy_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'contacted', 'completed'))
);

-- Create indexes for better performance
CREATE INDEX idx_materials_status ON materials(status);
CREATE INDEX idx_materials_created_at ON materials(created_at DESC);
CREATE INDEX idx_buy_requests_material_id ON buy_requests(material_id);
CREATE INDEX idx_buy_requests_status ON buy_requests(status);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid()::text = uid);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = uid);

-- RLS Policies for materials table
CREATE POLICY "Anyone authenticated can read materials"
  ON materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.uid = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.uid = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete materials"
  ON materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.uid = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- RLS Policies for buy_requests table
CREATE POLICY "Users can read their own buy requests or admins can read all"
  ON buy_requests FOR SELECT
  TO authenticated
  USING (
    buyer_email = auth.email() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.uid = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can create buy requests"
  ON buy_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update buy requests"
  ON buy_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.uid = auth.uid()::text
      AND users.role = 'admin'
    )
  );
```

4. Click **"Run"** button (bottom right)
5. You should see "Success. No rows returned"

---

### Step 5: Create Storage Bucket for Images
1. Click **"Storage"** in the sidebar
2. Click **"New bucket"**
3. Bucket name: `materials`
4. Make sure **"Public bucket"** is **CHECKED** ✅
5. Click **"Create bucket"**

#### Set Storage Policies:
1. Click on the **"materials"** bucket you just created
2. Click **"Policies"** tab at the top
3. Click **"New policy"**
4. Choose **"For full customization"**
5. Paste this policy:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materials');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials');
```

6. Click **"Review"** then **"Save policy"**

---

### Step 6: Create Your First Admin User

#### Method A: Using Supabase Dashboard (Easiest)
1. Click **"Authentication"** in sidebar
2. Click **"Users"** tab
3. Click **"Add user"** → **"Create new user"**
4. Fill in:
   - **Email**: Your email (e.g., `admin@avenirtrading.com`)
   - **Password**: Create a strong password (save it!)
   - **Auto Confirm User**: ✅ Check this!
5. Click **"Create user"**
6. **COPY THE USER ID** (it's the UUID shown in the users list)

#### Method B: Add Admin Role to User in Database
1. Go to **"Table Editor"** in sidebar
2. Click on **"users"** table
3. Click **"Insert"** → **"Insert row"**
4. Fill in:
   - **uid**: Paste the User ID you copied
   - **email**: Same email you used
   - **role**: Type `admin`
   - **display_name**: Your name
5. Click **"Save"**

---

### Step 7: Test Your Setup
1. In your terminal, run:
```bash
npm run dev
```

2. Open the browser (usually `http://localhost:5173`)
3. Login with your admin credentials
4. You should see the Admin Dashboard!

---

## 🎯 Summary Checklist

- ✅ Created Supabase project
- ✅ Copied API keys to `.env` file
- ✅ Created database tables using SQL script
- ✅ Created `materials` storage bucket (public)
- ✅ Set storage policies
- ✅ Created admin user
- ✅ Added user to `users` table with `admin` role
- ✅ Tested login

---

## 🔧 Troubleshooting

### Can't login?
- Make sure you checked **"Auto Confirm User"** when creating the user
- Go to Authentication → Users → click on your user → check "Email Confirmed" is true

### Images not uploading?
- Make sure the `materials` bucket is **Public**
- Make sure storage policies are set correctly

### Database errors?
- Check that all tables were created successfully in Table Editor
- Make sure RLS policies are enabled

---

## 📊 What's Different from Firebase?

| Feature | Firebase | Supabase |
|---------|----------|----------|
| **Database** | NoSQL (Firestore) | PostgreSQL (SQL) |
| **Storage** | Firebase Storage | Supabase Storage |
| **Auth** | Firebase Auth | Supabase Auth |
| **Realtime** | Built-in | Built-in (Postgres) |
| **Pricing** | Pay per operation | Pay per storage & bandwidth |
| **Self-hosting** | ❌ No | ✅ Yes (optional) |

---

## 🎉 You're Ready!

Your app is now fully migrated to Supabase with:
- ✅ Authentication (email/password)
- ✅ PostgreSQL database (3 tables)
- ✅ Image storage (materials bucket)
- ✅ Realtime updates
- ✅ Row Level Security (RLS)

Start using your granite trading platform! 🚀
