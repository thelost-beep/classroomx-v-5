---
description: How to set up Cloudflare Tunneling for mobile testing
---

To view your local website on your phone with real-time updates, use one of these two methods:

### Method 1: Direct Wi-Fi (Fastest)
*If your phone and PC are on the same Wi-Fi:*
1. Open your phone's browser.
2. Enter this address: `http://192.168.1.3:5173`

### Method 2: Cloudflare Tunnel (Remote Access)
1. Open a **new terminal** (don't close the current one running `npm run dev`).
2. Run this command:
   ```powershell
   npx -y untun@latest tunnel http://localhost:5173
   ```
3. Copy the URL it generates (e.g., `https://...`) and open it on your phone.

Any changes you make to the code will automatically refresh on your phone just like on your PC!
