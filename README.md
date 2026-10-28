# FLAVOX MOTION — Magic Hour Image-to-Video Test

A small mobile-friendly HTML + Node.js test project. The backend uses the official Magic Hour Node SDK so your API key is never exposed to browser JavaScript.

## Before you start
- Node.js 20+ recommended.
- A Magic Hour account and API key. Generation consumes account credits; free/trial credits may be limited.
- Use images you own or have permission to process.

## Run locally
1. Extract the ZIP.
2. Install Node.js if needed.
3. In this folder, copy `.env.example` to `.env`.
4. Open `.env` and replace `replace_with_your_new_key` with your NEW Magic Hour API key.
5. Open a terminal in this folder and run:
   ```bash
   npm install
   npm start
   ```
6. Visit `http://localhost:3000` in your browser.

Do not paste the key into `public/app.js`, `public/index.html`, or any public GitHub file. Never commit `.env`.

## What is included
- Image preview and upload (JPG/PNG/WEBP/AVIF; max 12 MB)
- Motion prompt
- 5/10-second duration selector
- 480p/720p resolution selector
- Magic Hour image-to-video generation through the official Node SDK
- Result preview and download link

## Notes
- API generation may take several minutes and uses Magic Hour credits.
- The selected `kling-3.0` model and settings must be available to your account. If your account has different model access, change the `model` field in `server.js` to a model supported by your account.
- This is a test app, not a full Alight Motion replacement. It requires a running Node.js backend; opening `index.html` directly will not work.
- Before retrying after a timeout/error, check your Magic Hour project history so you do not accidentally submit a duplicate billable job.

## Official documentation
- Image-to-Video API: https://magichour.ai/api/image-to-video
- Official Node SDK: https://github.com/magichourhq/magic-hour-node
