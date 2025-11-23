# Digital Ocean Deployment Guide

## Prerequisites
- A Digital Ocean account
- Your GitHub repository connected to Digital Ocean

## Deployment Steps

### Option 1: Using Digital Ocean App Platform (Recommended)

1. **Go to Digital Ocean App Platform** and create a new app
2. **Connect your GitHub repository**
3. **Configure the app:**
   - **Build Command:** `npm install && npm run build`
   - **Run Command:** `npm start`
   - **HTTP Port:** `3000`
   - **Environment:** Node.js

4. **Add Environment Variables:**
   - `GEMINI_API_KEY` - Your Gemini API key (mark as SECRET)

5. **Deploy!**

### Option 2: Using the .do/app.yaml file

If you have the Digital Ocean CLI installed, you can use the `.do/app.yaml` file:

1. Update the `app.yaml` file with your GitHub repo details
2. Run: `doctl apps create --spec .do/app.yaml`

### Important Notes:

- Make sure your `GEMINI_API_KEY` is set as an environment variable in Digital Ocean
- The app will build the Vite project and serve it using Express
- The server.js file serves the static files from the `dist` directory
- Make sure `dist` is NOT in your `.gitignore` for deployment (or ensure it's built during deployment)

### Troubleshooting:

If Digital Ocean still doesn't detect your app:
1. Make sure `package.json` is in the root directory
2. Verify the build command works locally: `npm run build`
3. Check that all dependencies are listed in `package.json`
4. Ensure the repository is public or Digital Ocean has access

