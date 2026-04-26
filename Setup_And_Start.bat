@echo off
set REPO_URL=https://github.com/junayed0011/comparison-video-studio.git
set FOLDER_NAME=comparison-video-studio

title Comparison Video Studio - DEBUG MODE
echo ======================================================
echo    🚀 DEBUG START: Detecting Environment...
echo ======================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [CRITICAL ERROR] Node.js is NOT installed!
    echo.
    echo Please download and install the "LTS" version from:
    echo https://nodejs.org/
    echo.
    pause
    exit
)
echo [OK] Node.js detected.

:: 2. Check for Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [CRITICAL ERROR] Git is NOT installed!
    echo.
    echo Please download and install it from:
    echo https://git-scm.com/
    echo.
    pause
    exit
)
echo [OK] Git detected.

:: 3. Smart Folder Logic
echo [INFO] Checking directory...
if exist "package.json" (
    echo [INFO] STATUS: Found package.json in current folder.
    echo [INFO] SYNCING: Downloading latest code from GitHub...
    git pull origin main
    if %errorlevel% neq 0 echo [WARNING] Pull failed, but continuing...
) else if exist "%FOLDER_NAME%\package.json" (
    echo [INFO] STATUS: Found project folder "%FOLDER_NAME%".
    echo [INFO] MOVING: Entering folder...
    cd %FOLDER_NAME%
    echo [INFO] SYNCING: Downloading latest code from GitHub...
    git pull origin main
) else (
    echo [INFO] STATUS: Project not found.
    echo [INFO] DOWNLOADING: Cloning from GitHub...
    git clone %REPO_URL%
    if %errorlevel% neq 0 (
        echo [ERROR] Could not download from GitHub. 
        echo Check your internet connection.
        pause
        exit
    )
    cd %FOLDER_NAME%
    echo [INFO] INSTALLING: Setting up video engine...
    call npm install
)

:: 4. Start
echo.
echo [INFO] SUCCESS: Everything is ready.
echo [INFO] ACTION: Launching Studio Engine...
echo ======================================================
echo.

:: Use cmd /k so the window STAYS OPEN if it crashes
cmd /k "npm run start-all"
