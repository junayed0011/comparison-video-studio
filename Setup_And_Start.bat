@echo off
set REPO_URL=https://github.com/junayed0011/comparison-video-studio.git
set FOLDER_NAME=comparison-video-studio

title Comparison Video Studio - One-Click Setup
echo ======================================================
echo    🚀 COMPARISON VIDEO STUDIO - AUTOMATIC SETUP
echo ======================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed!
    echo.
    echo Please download and install the "LTS" version from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b
)

:: 2. Check for Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is NOT installed!
    echo.
    echo Please download and install it from:
    echo https://git-scm.com/
    echo.
    pause
    exit /b
)

:: 3. Clone or Update
if not exist %FOLDER_NAME% (
    echo [INFO] First time setup detected. Downloading project...
    git clone %REPO_URL%
    cd %FOLDER_NAME%
    echo.
    echo [INFO] Installing video engine (this will take about 1 minute)...
    call npm install
) else (
    echo [INFO] Project already exists. Syncing with cloud...
    cd %FOLDER_NAME%
    git pull origin main
)

:: 4. Start
echo.
echo ======================================================
echo    ✅ SETUP COMPLETE! Launching Dashboard...
echo ======================================================
echo.
npm run start-all
pause
