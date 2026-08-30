# WatchMyWeb

A website monitoring platform that allows users to provide a website URL and wait for a specific result. The system continuously checks the website and notifies the user via Telegram and Email when the requested information becomes available.

## Features
- **Smart Monitoring**: Uses static content extraction (Cheerio) to look for text changes.
- **Relevance Detection**: Doesn't just trigger on HTML updates; it checks for keyword and identifier matches.
- **Instant Notifications**: Sends Telegram and Email alerts as soon as a relevant change is detected.
- **Scheduler**: Node-cron based background worker to check URLs at specific intervals.
- **Demo Mode**: Built-in test endpoint to simulate a website releasing results.

## Tech Stack
- Frontend: React, Vite, Tailwind CSS v4, React Router
- Backend: Node.js, Express, MongoDB
- Others: Node-cron (scheduler), Nodemailer (email), Node-Telegram-Bot-API

## Prerequisites
- Node.js (v16+)
- Docker Desktop (for MongoDB) or a local MongoDB instance.

## Installation

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Setup Environment

Create `.env` in the `backend` folder:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/watchmyweb
JWT_SECRET=supersecretjwtkey

# Notification settings
TELEGRAM_BOT_TOKEN=your_telegram_token
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASSWORD=your_pass
EMAIL_FROM="WatchMyWeb" <noreply@watchmyweb.local>
```

## Running the Application

1. Start MongoDB:
   ```bash
   docker-compose up -d
   ```
2. Start the Backend server (it automatically runs the background scheduler):
   ```bash
   cd backend
   npm run dev
   ```
3. Start the Frontend Vite server:
   ```bash
   cd frontend
   npm run dev
   ```

## Demo Mode

1. Navigate to `/login` and create an account.
2. In the Dashboard, click "Create New Monitor" (Mock UI available).
3. The backend has a `/api/demo/test-result` route built in to mock a results page.
4. Call `POST /api/demo/toggle-result` to switch the page from "Not Released" to "RELEASED" and trigger the monitor's detection engine!
