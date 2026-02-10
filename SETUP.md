# 🚀 ClassroomX Setup Guide

Follow these steps to get ClassroomX running for your class.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - Name: ClassroomX
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)

## Step 3: Get API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy these three values:
   - **Project URL** (under "Configuration")
   - **anon public** key (under "Project API keys")
   - **service_role** key (click "Reveal" to see it)

## Step 4: Configure Environment

1. Create a file named `.env` in the project root
2. Add your credentials:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. Save the file

## Step 5: Set Up Database

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run"
5. Repeat for `supabase/security.sql`
6. Repeat for `supabase/storage.sql`

## Step 6: Create Student Users

### Option A: Via Script (Easiest)

1. Edit `supabase/users-setup.js`:
   - Replace `your-project.supabase.co` with your Project URL
   - Replace `your-service-role-key-here` with your service role key
   - Set `commonPassword` to your chosen default password (e.g., "ClassRoom@2024")

2. Run the script:
```bash
node supabase/users-setup.js
```

All 23 students will be created automatically!

### Option B: Via Dashboard (Manual)

1. In Supabase, go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. For each student from the list in `supabase/users.sql`:
   - Email: `firstname@classroomx.com`
   - Password: Your chosen common password
   - Click "Create user"
4. Repeat for all 23 students

## Step 7: Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser!

## Step 8: Test Login

1. Try logging in with any student:
   - Email: `aftab@classroomx.com`
   - Password: (the common password you set)

2. You should be prompted to:
   - Change password
   - Complete profile

3. Success! 🎉

## Step 9: Deploy (Optional)

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variables (the same from your `.env` file)
6. Click "Deploy"

Your app will be live at `https://your-app.vercel.app`!

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Choose your repository
5. Add environment variables
6. Click "Deploy"

## Next Steps

- 📱 **Test on mobile** - The app is designed for phones!
- 🎨 **Customize colors** - Edit `src/styles/tokens.css`
- 👥 **Invite classmates** - Share the URL and login credentials
- 📸 **Start posting** - Create your first post!

## Need Help?

Check the main [README.md](../README.md) for troubleshooting tips.

---

**You're all set! Enjoy ClassroomX! 🎓**
