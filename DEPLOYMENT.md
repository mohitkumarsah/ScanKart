# ScanKart Deployment Guide

## Overview
ScanKart is a **server-rendered Next.js application** that requires a Node.js runtime. It cannot be deployed on static hosting like GitHub Pages. This guide explains the recommended deployment options.

## Why Not GitHub Pages?
GitHub Pages only hosts **static files**. Since ScanKart uses:
- Server-side rendering (dynamic routes)
- Authentication & user sessions
- Real-time database queries (Firestore)
- API routes

It requires a **Node.js server** to function properly.

---

## 🎯 Recommended: Deploy to Vercel (easiest)

Vercel is made by the creators of Next.js and provides the best experience for Next.js deployments.

### Setup Instructions:

1. **Create a Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Authorize Vercel to access your repositories

2. **Connect Your GitHub Repository**
   - Click "New Project"
   - Select `mohitkumarsah/ScanKart`
   - Vercel auto-detects Next.js and configures it

3. **Set Environment Variables**
   - Add your Firebase config and other secrets from `.env.local`:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
     - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   
4. **Deploy**
   - Click "Deploy"
   - Vercel automatically deploys on every push to `main`
   - Your app will be available at `https://<project-name>.vercel.app`

5. **Add Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your domain: `scankart.example.com`

### GitHub Actions CI/CD
The included workflow automatically runs on every push:
- ✅ Builds the project
- ✅ Runs type checking
- ✅ If using Vercel: Deploys automatically (with VERCEL_TOKEN)

---

## Alternative: Deploy to Other Node.js Platforms

### Railway (Easiest Alternative)
```bash
# 1. Create account at https://railway.app
# 2. Connect GitHub repository
# 3. Add environment variables in Railway dashboard
# 4. Deploy automatically on push
```

### Render
```bash
# 1. Go to https://render.com
# 2. Create new Web Service from GitHub
# 3. Build command: npm install --legacy-peer-deps && npm run build
# 4. Start command: npm start
```

### DigitalOcean App Platform
```bash
# 1. Create DigitalOcean account
# 2. Connect GitHub repository
# 3. Configure Node.js runtime
# 4. Deploy
```

### AWS Amplify
```bash
# 1. Go to https://aws.amazon.com/amplify/
# 2. Connect GitHub repository
# 3. Select Next.js
# 4. Configure build settings
# 5. Deploy
```

---

## Local Development & Testing

### Build Locally
```bash
npm run build
npm run start
```

The app will be available at `http://localhost:3000`

### Check Build Output
- Static pages: 21 pages prerendered
- Dynamic pages: `/orders/[id]` (server-rendered on demand)

```
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## Troubleshooting

### Build Fails with "node_modules issues"
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Environment Variables Not Working
- Ensure all `NEXT_PUBLIC_*` vars are set in deployment platform
- For secrets, use platform-specific secret management
- Redeploy after adding new variables

### Firebase Connection Issues
- Verify API keys are correct in `.env.local`
- Check Firestore security rules allow your domain
- Ensure Firebase project is active

### Port Issues (if running locally)
```bash
# Use a different port
PORT=3001 npm start
```

---

## Deployment Checklist

- [ ] Firebase credentials configured
- [ ] Environment variables set in deployment platform
- [ ] Built locally and tested with `npm run start`
- [ ] All tests pass
- [ ] `.env` file NOT committed to Git
- [ ] `next.config.js` configured correctly
- [ ] Latest code pushed to `main` branch

---

## Production Best Practices

1. **Use Environment Variables**
   - Never commit secrets to Git
   - Use deployment platform's secret management

2. **Monitor Performance**
   - Use Vercel Analytics (built-in)
   - Monitor Firebase usage

3. **Set Up CI/CD**
   - Automated tests on every push
   - Automatic deployment on merge to main

4. **Database Backups**
   - Enable Firestore automatic backups
   - Regular manual exports of critical data

5. **Security**
   - Keep dependencies updated: `npm audit fix`
   - Use HTTPS for all connections (standard with Vercel/Railway/etc)
   - Rate-limit API endpoints

---

## Support

For issues with:
- **Vercel**: https://vercel.com/support
- **Next.js**: https://nextjs.org/docs
- **Firebase**: https://firebase.google.com/docs
- **Your App**: Check GitHub Issues or contact team
