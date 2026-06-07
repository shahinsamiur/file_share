# 📂 FileDrop — Local Network File Sharing

A beautiful, browser-based file sharing server. Run it on your PC and access your files from any device on the same WiFi.

---

## 🚀 Setup

### 1. Install Node.js
Download from https://nodejs.org (LTS version recommended)

### 2. Extract this folder somewhere on your PC (e.g. Desktop)

### 3. Install dependencies
Open a terminal inside the `filedrop` folder and run:
```
npm install
```

### 4. Start the server
```
npm start
```

You'll see output like:
```
╔════════════════════════════════════════╗
║         📂  FileDrop Server            ║
╠════════════════════════════════════════╣
║  Local:   http://localhost:3000        ║
║  Network: http://192.168.1.42:3000    ║
║  Sharing: /Users/you/Downloads        ║
╠════════════════════════════════════════╣
║  Scan QR from your phone to connect!  ║
╚════════════════════════════════════════╝
```

### 5. Open on your phone
- Open your browser on your phone
- Go to the Network URL shown (e.g. `http://192.168.1.42:3000`)
- Or click **📱 QR Connect** in the UI and scan the QR code!

---

## 📁 What folder does it share?

By default it shares your **Downloads** folder.

To share a different folder, set the `SHARE_DIR` environment variable:

**Windows:**
```
set SHARE_DIR=C:\Users\YourName\Videos
npm start
```

**Mac/Linux:**
```
SHARE_DIR=/home/yourname/Videos npm start
```

---

## ✨ Features

- 📱 QR code for instant phone connection
- 🎬 In-browser video streaming
- 🎵 In-browser audio playback  
- 🖼️ Image preview
- 📄 PDF viewer
- 📁 Browse folders / subfolders
- 🔍 Search files by name
- 🗂️ Filter by type (video, audio, image, PDF, APK...)
- ⬇️ One-tap download
- 🌙 Dark UI, works great on mobile

---

## 🔒 Security Note

This server is meant for **local network use only**.  
Do not expose it to the internet. Stop the server with `Ctrl+C` when not needed.
