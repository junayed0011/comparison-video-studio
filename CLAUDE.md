# Comparison Video Maker - Project Guide

## Overview
This project is an automated pipeline for generating viral comparison videos. It uses **Remotion** for video rendering, **Vite** for the dashboard, and **Playwright** for asset automation.

## Project Structure
- `src/`: React source code for the Dashboard and Video Templates.
- `scripts/`: Automation scripts (data generation, image scraping, recording).
- `template/`: Lightweight HTML/JS engine for fast batch previews.
- `assets/`: Project assets including downloaded images and logos.
- `user_data/`: Unified browser profile for persistent AI logins (Edge/Chrome).

## Critical Rules & Standards
- **Remotion Components**: Always use `<Img />` from the `remotion` package instead of native `<img>` tags to ensure images are fully loaded before frames are captured.
- **Typescript**: Maintain strict typing. All new components must have defined interfaces in `src/VideoTemplate/types.ts`.
- **Styling**: Use standard CSS/Inline styles as defined in the templates. Avoid adding new CSS frameworks unless requested.
- **Automation**: 
  - Scripts must use the unified `./user_data` profile for browser persistence.
  - Image downloads should include standard headers to avoid 403 errors.
  - Always check if `data.json` exists before running pipeline scripts.

## Common Commands
### Development & Preview
- `npm run dev`: Start Remotion Studio for template development.
- `npm run web`: Start the Vite dashboard.
- `npm run lint`: Run ESLint and Type checks.

### Automation Pipeline
- `npm run setup-login`: Launch browser to log into ChatGPT/Grok (isolated profile).
- `node main.js "Idea 1; Idea 2"`: Run the full batch generation pipeline.
- `node scripts/generate_data.js "Idea"`: Generate structured JSON for a video.
- `node scripts/scrape_images.js`: Search and download high-res assets based on data.
- `node scripts/fast_preview.js [duration]`: Record a real-time preview of the video.

## Tech Stack
- **Video**: Remotion 4.0.x
- **Frontend**: React 18, Vite 6
- **Automation**: Playwright, Playwright-extra (Stealth)
- **Utilities**: FFmpeg, Axios
