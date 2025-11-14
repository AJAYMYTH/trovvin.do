# Deployment Guide

This project is separated into **frontend** and **backend** for independent deployment.

## Project Structure

```
├── backend/           # Node.js/Express API server
│   ├── server.js
│   ├── db-config.js
│   ├── package.json
│   ├── .env.example
│   └── database.sql
└── frontend/          # Static HTML/CSS/JS files
    ├── index.html
    ├── script.js
    ├── config.js      # API configuration
    └── style.css
```

---

## Backend Deployment

### Prerequisites
- Node.js (v14 or higher)
- yt-dlp installed on the server
- MySQL database (optional, for analytics)

### Setup Steps

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values:
   ```env
   PORT=3000
   FRONTEND_URL=https://your-frontend-domain.com
   
   # Database (Optional)
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=youtube_downloader
   ```

4. **Install yt-dlp:**
   ```bash
   pip install yt-dlp
   # or
   pip3 install yt-dlp
   ```

5. **Setup database (Optional):**
   ```bash
   mysql -u root -p < database.sql
   ```

6. **Start the server:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### Deployment Platforms

#### **Heroku**
```bash
heroku create your-app-name
heroku buildpacks:add heroku/python
heroku buildpacks:add heroku/nodejs
git push heroku main
```

#### **Railway / Render**
- Connect your GitHub repository
- Set root directory to `backend`
- Add environment variables in dashboard
- Deploy

#### **VPS (Ubuntu/Debian)**
```bash
# Install Node.js, MySQL, Python
sudo apt update
sudo apt install nodejs npm python3 python3-pip mysql-server

# Install yt-dlp
pip3 install yt-dlp

# Setup PM2 for process management
npm install -g pm2
pm2 start server.js --name youtube-downloader
pm2 startup
pm2 save
```

---

## Frontend Deployment

### Configuration

1. **Update API endpoint in `config.js`:**
   ```javascript
   const API_CONFIG = {
       BASE_URL: window.location.hostname === 'localhost' 
           ? 'http://localhost:3000' 
           : 'https://your-backend-domain.com',
       // ...
   };
   ```

2. **Update CORS in backend:**
   Add your frontend URL to `.env`:
   ```env
   FRONTEND_URL=https://your-frontend-domain.com
   ```

### Deployment Platforms

#### **Netlify**
1. Drag and drop the `frontend` folder to Netlify
2. Or connect GitHub repository with build settings:
   - Base directory: `frontend`
   - Publish directory: `frontend`

#### **Vercel**
```bash
cd frontend
vercel
```

#### **GitHub Pages**
1. Push frontend folder to a repository
2. Go to Settings → Pages
3. Select branch and `/frontend` folder
4. Deploy

#### **Static Hosting (Apache/Nginx)**
Simply upload all files from `frontend` folder to your web server's public directory.

---

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev
```
Server runs at: `http://localhost:3000`

### Frontend
Use a local server like:
- **VS Code Live Server** (recommended)
- **Python**: `python -m http.server 5500`
- **Node**: `npx http-server -p 5500`

Frontend runs at: `http://localhost:5500`

---

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5500 |
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | (empty) |
| `DB_NAME` | Database name | youtube_downloader |

### Frontend (config.js)
- Update `BASE_URL` to point to your deployed backend URL

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend domain
- Check that both http/https protocols match

### yt-dlp not found
```bash
which yt-dlp
# Should return path like /usr/local/bin/yt-dlp
```

### Database connection fails
- Application works without database (analytics disabled)
- Check MySQL credentials in `.env`
- Ensure MySQL service is running

---

## Production Checklist

- [ ] Backend deployed and running
- [ ] yt-dlp installed on server
- [ ] Environment variables configured
- [ ] Database setup (if using analytics)
- [ ] Frontend deployed
- [ ] `config.js` updated with backend URL
- [ ] CORS configured correctly
- [ ] SSL/HTTPS enabled (recommended)
- [ ] Test all features

---

## Notes

- The app works **without database** - it's only used for analytics
- Make sure yt-dlp stays updated: `pip install -U yt-dlp`
- For production, use HTTPS for both frontend and backend
- Consider adding rate limiting for production use
