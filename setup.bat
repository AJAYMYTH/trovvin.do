@echo off
echo ========================================
echo YouTube Downloader - Backend Setup
echo ========================================
echo.

cd backend

echo [1/4] Installing dependencies...
call npm install

echo.
echo [2/4] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo Created .env file. Please update with your settings.
) else (
    echo .env already exists. Skipping.
)

echo.
echo [3/4] Checking yt-dlp installation...
where yt-dlp >nul 2>nul
if %errorlevel% neq 0 (
    echo WARNING: yt-dlp not found!
    echo Please install it using: pip install yt-dlp
) else (
    echo yt-dlp is installed.
)

echo.
echo [4/4] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit backend\.env with your settings
echo 2. Update frontend\config.js with your API URL
echo 3. Run backend: cd backend ^&^& npm start
echo 4. Run frontend: Open index.html with Live Server
echo ========================================
echo.

pause
