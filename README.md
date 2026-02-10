# ClassroomX

A mobile-first Progressive Web App (PWA) social network for Class 10 students. Private, secure, and designed for seamless connection between classmates.

## 🎯 Features

- **100% Mobile-First PWA** - Installable from browser, feels like a native app
- **Private & Secure** - No public access, pre-created users only
- **Authentication Flow** - Login → Force password change → Profile setup
- **Feed & Posts** - Share photos, videos, and text posts
- **Stories** - 24-hour ephemeral content
- **Explore** - Discover classmates, media, and anonymous confessions
- **Messaging** - Real-time chat with classmates (coming soon)
- **Dark Mode** - Beautiful dark theme by default
- **Offline Support** - PWA caching for basic functionality

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

### 1. Clone & Install

```bash
cd classroomx-v-5
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (for user creation)

3. Create `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Run Database Setup

In your Supabase SQL Editor, run these files **in order**:

1. `supabase/schema.sql` - Creates all tables
2. `supabase/security.sql` - Sets up Row Level Security
3. `supabase/storage.sql` - Creates storage buckets

### 4. Create Users

**Option A: Via Supabase Dashboard**
- Go to Authentication → Users
- Manually add each of the 23 students from `supabase/users.sql`
- Use format: `firstname@classroomx.com` with your chosen common password

**Option B: Via Script (Recommended)**

```bash
# Edit supabase/users-setup.js with your credentials and password
node supabase/users-setup.js
```

This creates all 23 students automatically with the common password.

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
npm run preview
```

## 👥 Default Users

All 23 Class 10 students:
- Aftab, Abaan, Saalik, Rehan, Anas
- Akshita, Anushka, Nishtha, Bhoomika, Anushka Sinha
- Darshana, Madhvi, Devishi, Chhavi, Yogita
- Yashi, Vidhosi, Kamal, Arjun, Aaron Bhatt
- Varun, Vans, Tanish

**Email format:** `firstname@classroomx.com`

## 📱 PWA Installation

### On Mobile (Chrome/Safari):
1. Visit the app in your mobile browser
2. Tap the "Add to Home Screen" prompt
3. App installs and opens like a native app!

### On Desktop (Chrome/Edge):
1. Look for the install icon in the address bar
2. Click "Install ClassroomX"
3. App opens in its own window

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Vanilla CSS with CSS Variables
- **Backend:** Supabase (PostgreSQL + Realtime + Storage + Auth)
- **PWA:** Vite PWA Plugin + Workbox
- **Routing:** React Router DOM
- **State:** Zustand (for toasts)
- **Icons:** Lucide React
- **Date:** date-fns

## 📂 Project Structure

```
classroomx-v-5/
├── public/
│   ├── icons/           # PWA app icons
│   └── manifest.json    # PWA manifest
├── src/
│   ├── components/
│   │   ├── ui/         # Reusable UI components
│   │   ├── layout/     # App shell, navigation
│   │   └── feed/       # Post components
│   ├── contexts/       # Auth and Theme contexts
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Supabase config
│   ├── pages/          # All app pages
│   ├── styles/         # Global styles
│   └── App.tsx         # Main app component
├── supabase/           # Database setup scripts
└── vite.config.ts      # Vite configuration
```

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **Storage policies** for media access control
- **Password change** forced on first login
- **Profile completion** required before app access
- **No public endpoints** - authentication required

## 🎨 Design Philosophy

- **Mobile-first** - Designed for phones, scales to desktop
- **Premium aesthetics** - Gradients, smooth animations, glassmorphism
- **Native feel** - No "webby" elements, app-like interactions
- **Dark by default** - Easy on the eyes, premium look
- **Smooth animations** - 60fps scrolling, tasteful micro-interactions
- **Skeleton loaders** - No spinners, layout-matched loading states

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Adding New Features

1. Create feature branch
2. Add components in `src/components/`
3. Add pages in `src/pages/`
4. Update database in `supabase/` if needed
5. Test on mobile device
6. Build and verify PWA still works

## 📝 Environment Variables

Required in `.env`:

```env
VITE_SUPABASE_URL=           # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=      # Public anon key
VITE_SUPABASE_SERVICE_ROLE_KEY=  # For admin operations (keep secure!)
```

## 🐛 Troubleshooting

**Users can't log in:**
- Check if users exist in Supabase Authentication
- Verify `.env` file has correct credentials
- Check browser console for errors

**Images not uploading:**
- Verify storage buckets exist in Supabase  
- Check storage policies are set correctly
- Ensure bucket names match (`avatars`, `posts`, etc.)

**PWA not installing:**
- App must be served over HTTPS (or localhost)
- Check manifest.json is accessible
- Verify service worker is registered

**Build fails:**
- Run `npm install` to ensure all dependencies
- Check for TypeScript errors: `npx tsc --noEmit`
- Clear node_modules and reinstall if needed

## 📄 License

Private project for Class 10 students only.

## 🤝 Support

For issues or questions, contact your class admin.

---

**Made with ❤️ for Class 10**
