# 🚀 Quick Start Guide

## ✅ What's Been Done

Your project has been successfully separated into **frontend** and **backend** for independent deployment!

### ✨ Changes Made:
- ✅ Added CORS support for cross-origin requests
- ✅ Created API configuration system
- ✅ Separated static files from API server
- ✅ Added environment variable support
- ✅ Created database configuration module
- ✅ Updated all API endpoints
- ✅ Added comprehensive documentation

---

## 📋 Pre-Deployment Checklist

### 1️⃣ Verify Backend Setup

```bash
cd backend
npm install          # ✅ Already done
```

**Check these files:**
- [x] `.env` created (from `.env.example`)
- [x] `db-config.js` exists
- [x] `cors` and `dotenv` installed

### 2️⃣ Install yt-dlp

```bash
pip install yt-dlp
# or
pip3 install yt-dlp
```

**Verify installation:**
```bash
yt-dlp --version
```

### 3️⃣ Update Configuration Files

**Backend: `backend/.env`**
```env
PORT=3000
FRONTEND_URL=http://localhost:5500    # Update for production

# Database (optional)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=youtube_downloader
```

**Frontend: `frontend/config.js`** (line 4)
```javascript
BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-backend-domain.com',  // ← Update this
```

---

## 🏃 Running Locally

### Start Backend:
```bash
cd backend
npm start
```
**✅ Server runs on:** http://localhost:3000

### Start Frontend:
1. **Option A - VS Code Live Server** (Recommended)
   - Right-click `frontend/index.html`
   - Select "Open with Live Server"
   - **Runs on:** http://localhost:5500

2. **Option B - Python**
   ```bash
   cd frontend
   python -m http.server 5500
   ```

3. **Option C - Node**
   ```bash
   cd frontend
   npx http-server -p 5500
   ```

### Test the App:
1. Open http://localhost:5500
2. Paste a YouTube URL
3. Click Download

---

## 🌐 Production Deployment

### Backend Deployment

#### Option 1: Heroku
```bash
cd backend
heroku create your-app-name
heroku buildpacks:add heroku/python
heroku buildpacks:add heroku/nodejs
heroku config:set FRONTEND_URL=https://your-frontend.netlify.app
git subtree push --prefix backend heroku main
```

#### Option 2: Railway / Render
1. Connect GitHub repository
2. Set root directory: `backend`
3. Add environment variables:
   - `PORT=3000`
   - `FRONTEND_URL=https://your-frontend-domain.com`
4. Deploy

#### Option 3: VPS (Ubuntu)
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm python3 python3-pip mysql-server

# Install yt-dlp
pip3 install yt-dlp

# Clone and setup
git clone your-repo
cd your-repo/backend
npm install
cp .env.example .env
nano .env  # Update values

# Run with PM2
npm install -g pm2
pm2 start server.js --name youtube-api
pm2 startup
pm2 save
```

### Frontend Deployment

#### Option 1: Netlify
1. Drag & drop `frontend` folder to Netlify
2. Done! ✅

#### Option 2: Vercel
```bash
cd frontend
vercel
```

#### Option 3: GitHub Pages
1. Push `frontend` folder to repository
2. Settings → Pages → Deploy from branch
3. Select `main` branch and `/frontend` folder

### 🔗 Update CORS After Deployment

In `backend/.env`:
```env
FRONTEND_URL=https://your-actual-frontend-domain.com
```

---

## 🧪 Testing Deployment

### Test Backend:
```bash
curl https://your-backend.com/health
# Should return: {"status":"ok"}
```

### Test Frontend:
1. Open your frontend URL
2. Check browser console (F12)
3. Should see no CORS errors
4. Try downloading a video

---

## 🐛 Common Issues & Fixes

### ❌ CORS Error
**Problem:** `Access to fetch at '...' has been blocked by CORS policy`

**Fix:**
1. Check `backend/.env` has correct `FRONTEND_URL`
2. Restart backend server
3. Clear browser cache

### ❌ yt-dlp not found
**Problem:** `Failed to execute yt-dlp`

**Fix:**
```bash
# Install yt-dlp
pip install yt-dlp

# Verify installation
yt-dlp --version

# Update to latest
pip install -U yt-dlp
```

### ❌ Database Connection Failed
**Info:** This is OK! App works without database.

**To Fix (Optional):**
1. Check MySQL is running
2. Verify credentials in `.env`
3. Import database:
   ```bash
   mysql -u root -p < backend/database.sql
   ```

### ❌ Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Fix:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

---

## 📁 Project Structure Reference

```
├── backend/
│   ├── server.js          ← Main API server
│   ├── db-config.js       ← Database module
│   ├── package.json       ← Dependencies
│   ├── .env               ← Your config (not in git)
│   ├── .env.example       ← Config template
│   └── database.sql       ← Database schema
│
├── frontend/
│   ├── index.html         ← Main page
│   ├── config.js          ← API endpoints ⚠️ Update this
│   ├── script.js          ← Frontend logic
│   ├── style.css          ← Styles
│   └── ...                ← Other pages
│
├── README.md              ← Project overview
├── DEPLOYMENT.md          ← Detailed deployment guide
├── CHANGES.md             ← All changes made
└── QUICK-START.md         ← This file
```

---

## ✅ Final Deployment Checklist

Before going live, verify:

### Backend
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` configured with production values
- [ ] `FRONTEND_URL` set to actual frontend domain
- [ ] yt-dlp installed on server
- [ ] Server accessible via HTTPS (recommended)
- [ ] Database setup (optional)

### Frontend
- [ ] `config.js` updated with backend URL
- [ ] All HTML pages include `config.js`
- [ ] Tested on production URL
- [ ] No console errors
- [ ] CORS working properly

### Testing
- [ ] Can fetch video info
- [ ] Can download videos
- [ ] Can download audio
- [ ] Forms submit successfully (contact, report)
- [ ] No CORS errors
- [ ] Mobile responsive

---

## 📞 Support

If you encounter issues:

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides
2. Check [CHANGES.md](CHANGES.md) for all modifications
3. Review error messages in browser console (F12)
4. Check backend logs

---

## 🎉 You're Ready!

Your project is now:
- ✅ Separated into frontend/backend
- ✅ CORS-enabled
- ✅ Environment-configured
- ✅ Deployment-ready
- ✅ Well-documented

**Next Step:** Deploy and enjoy! 🚀
