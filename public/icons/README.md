# ⚠️ IMPORTANT: Create PWA Icons

The app needs icon files for PWA installation. Create these two files:

## Required Files

1. **public/icons/icon-192.png** (192x192 pixels)
2. **public/icons/icon-512.png** (512x512 pixels)

## How to Create Them

### Option 1: Use an Online Tool (Easiest)
1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload any logo/image
3. Download the generated icons
4. Rename them to `icon-192.png` and `icon-512.png` 
5. Place in `public/icons/` folder

### Option 2: Use Design Software
1. Create a 512x512px image with:
   - Dark background (#0a0e1a)
   - "CX" or book icon in center
   - Gradient colors: #6366f1 to #7c3aed
2. Export as PNG
3. Resize to 192x192 for the smaller version
4. Save both in `public/icons/`

### Option 3: Placeholder (For Testing)
Just create two solid-color PNG files:
```bash
# On Windows, you can create simple placeholders
# Or download any image and resize it
```

## Why Icons Matter

- **PWA Installation**: Browser won't show install prompt without icons
- **Home Screen**: Icon appears when app is installed
- **Native Feel**: Makes the app look professional

## Temporary Workaround

If you just want to test without icons:
1. Comment out icon references in `public/manifest.json`
2. Comment out icon references in `index.html`
3. App will run but won't be installable

---

**After adding icons, run:**
```bash
npm run dev
```

The app should work perfectly!
