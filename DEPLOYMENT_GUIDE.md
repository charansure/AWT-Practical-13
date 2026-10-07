# Deployment Guide (Practical 13)

Architecture:  **Vercel** (Next.js frontend)  <-->  **Render** (Node.js + Socket.IO API)  <-->  **MongoDB Atlas** (database)

Vercel runs serverless functions, which cannot keep a WebSocket server alive, so the Socket.IO backend lives on Render.

## 1. Push the code to GitHub
```
cd practical13-deployment
git init
git add .
git commit -m "Practical 13"
git branch -M main
git remote add origin https://github.com/<your-username>/task-board.git
git push -u origin main
```
(.gitignore already keeps `.env` and `node_modules` out of the repository.)

## 2. Database - MongoDB Atlas (free)
1. Create a free M0 cluster at https://cloud.mongodb.com
2. Database Access -> Add user (username + password, "Read and write to any database").
3. Network Access -> Add IP address -> `0.0.0.0/0` (allow from anywhere, needed for Render).
4. Connect -> Drivers -> copy the connection string and put your database name in it:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/taskBoardDB?retryWrites=true&w=majority`
   (if the password has special characters, URL-encode them).

## 3. Backend - Render
1. https://render.com -> New + -> Web Service -> connect the GitHub repository.
2. Settings:
   - Root Directory: `backend`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance type: Free
   - Health Check Path: `/api/health`
   (or use New + -> Blueprint, which reads `render.yaml`)
3. Environment variables:
   - `NODE_ENV` = `production`
   - `NODE_VERSION` = `20`
   - `MONGO_URI` = your Atlas connection string
   - `CLIENT_URLS` = `http://localhost:3000` for now (updated in step 5)
4. Deploy. Open `https://<your-service>.onrender.com/api/health` - it should show `"status":"ok"` and `"database":"connected"`.

Note: free Render services sleep after ~15 minutes without traffic; the first request afterwards takes about 30-50 seconds.

## 4. Frontend - Vercel
1. https://vercel.com -> Add New -> Project -> import the same GitHub repository.
2. Settings:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
3. Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://<your-service>.onrender.com` (no trailing slash)
4. Deploy. You get a URL like `https://<your-app>.vercel.app`.

## 5. Connect them (CORS)
On Render -> Environment, change:
`CLIENT_URLS` = `https://<your-app>.vercel.app`
(you can keep `http://localhost:3000` too, separated by a comma). Render redeploys automatically.

## 6. Test the live app
- Open the Vercel URL in two browsers/tabs - the badge shows "Live (connected)" and "2 viewer(s) online".
- Add a task in one tab; it appears in the other instantly.
- In Thunder Client call `https://<your-service>.onrender.com/api/tasks` and POST a task; it appears live on the website.

## Troubleshooting
| Problem | Fix |
|---|---|
| Page says "Could not reach the backend" | Render is waking up (wait ~40 s and refresh) or `NEXT_PUBLIC_API_URL` is wrong. Changing it needs a Vercel **redeploy**. |
| Browser console shows a CORS error | `CLIENT_URLS` on Render does not exactly match the Vercel URL (check https and trailing slash). |
| Render logs: `MongoDB connection error` | Wrong password in `MONGO_URI`, or Atlas Network Access does not allow `0.0.0.0/0`. |
| Render logs: `Missing required environment variables` | Add `MONGO_URI` in the Render dashboard. |
