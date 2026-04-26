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

:: 3. Smart Folder Logic
if exist "package.json" (
    echo [INFO] Already inside project folder. Syncing...
    git pull origin main
) else if exist "%FOLDER_NAME%\package.json" (
    echo [INFO] Found project folder. Moving in and syncing...
    cd %FOLDER_NAME%
    git pull origin main
) else (
    echo [INFO] Project not found. Downloading from cloud...
    git clone %REPO_URL%
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download from GitHub. Check your internet.
        pause
        exit /b
    )
    cd %FOLDER_NAME%
    echo.
    echo [INFO] Installing video engine (this will take about 1 minute)...
    call npm install
)

:: 4. Start
echo.
echo ======================================================
echo    ✅ SYSTEM READY! Starting Studio...
echo ======================================================
echo.
npm run start-all
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The studio stopped unexpectedly. 
    echo Check the error message above.
    pause
)
