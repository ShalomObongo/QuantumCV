# Deployment Guide for QuantumCV

This guide explains how to deploy QuantumCV to Vercel using the automated CI/CD pipeline.

## Why Vercel Instead of GitHub Pages?

QuantumCV is a full-stack Next.js application with:
- **Server-side API routes** (`/api/*`)
- **Firebase server-side operations**
- **AI processing with Gemini Pro**
- **Dynamic server-side rendering**

**GitHub Pages** only supports static HTML/CSS/JS sites, making it unsuitable for this application.

**Vercel** is the recommended platform because:
- ✅ Built specifically for Next.js applications
- ✅ Supports API routes and server-side rendering
- ✅ Automatic deployments on push
- ✅ Preview deployments for pull requests
- ✅ Edge functions and serverless deployment
- ✅ Free tier perfect for personal projects

## Prerequisites

Before deploying, you need:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Firebase Project**: Set up at [console.firebase.google.com](https://console.firebase.google.com)
3. **Gemini API Key**: Get from [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

## Setup Steps

### 1. Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will automatically detect it's a Next.js project
4. **Don't deploy yet** - we need to add environment variables first

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

#### Gemini API Key
```
GEMINI_API_KEY=your-gemini-api-key
```

#### Firebase Admin (for server-side operations)
```
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Configure GitHub Secrets

For automated deployments, add these secrets to your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add these secrets:

#### Vercel Secrets
```
VERCEL_TOKEN            # Get from vercel.com/account/tokens
VERCEL_ORG_ID           # Found in Vercel project settings
VERCEL_PROJECT_ID       # Found in Vercel project settings
```

#### Firebase Secrets (same as Vercel env vars)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
GEMINI_API_KEY
```

#### Optional: Code Coverage
```
CODECOV_TOKEN           # For code coverage reports (optional)
```

## Deployment Workflows

### Automatic Deployments

The CI/CD pipeline automatically runs on:

#### 1. **Push to Main Branch**
- ✅ Runs tests and type checking
- ✅ Builds the application
- ✅ Deploys to production on Vercel
- 🌐 Available at your production URL

#### 2. **Pull Requests**
- ✅ Runs tests and type checking
- ✅ Builds the application
- ✅ Creates preview deployment
- 💬 Comments preview URL on PR
- 🔄 Updates preview on new commits

#### 3. **Feature Branches (claude/**)**
- ✅ Runs tests and type checking
- ✅ Builds the application
- ⚠️ No deployment (test only)

### Manual Deployment

You can also deploy manually:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## Monitoring and Logs

### View Deployment Logs
1. Go to your Vercel dashboard
2. Click on your project
3. Click on a deployment
4. View real-time logs and build output

### View Application Logs
1. Go to Vercel dashboard → Your Project → Logs
2. Filter by function (API routes)
3. Monitor errors and performance

### CI/CD Pipeline Status
1. Go to your GitHub repository
2. Click "Actions" tab
3. View workflow runs and test results

## Troubleshooting

### Build Fails on Vercel

**Issue**: Build fails with module not found
```bash
# Solution: Ensure all dependencies are in package.json
npm install --save missing-package
git commit -am "Add missing dependency"
git push
```

**Issue**: Environment variables not working
```
# Solution: Redeploy after adding env vars
vercel --prod --force
```

### Firebase Errors

**Issue**: "Firebase Auth not initialized"
```
# Solution: Check Firebase config in Vercel env vars
# Ensure NEXT_PUBLIC_ prefix for client-side vars
```

### API Routes Timeout

**Issue**: API routes take too long
```
# Solution: Optimize AI prompts or increase timeout
# Vercel free tier: 10s timeout
# Vercel pro tier: 60s timeout
```

## Performance Optimization

### Edge Functions
Consider moving some API routes to edge functions for better performance:

```javascript
// app/api/suggestions/route.ts
export const runtime = 'edge'; // Run on edge network
```

### Caching
Enable caching for better performance:

```javascript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/api/templates',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=3600, stale-while-revalidate',
        },
      ],
    },
  ],
};
```

## Costs

### Free Tier Includes:
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ✅ Preview deployments
- ✅ Custom domains

### Paid Features:
- 🔄 Longer function timeout (60s vs 10s)
- 🔄 More team members
- 🔄 Enhanced analytics
- 🔄 Password protection
- 🔄 Priority support

## Next Steps

After successful deployment:

1. **Configure Custom Domain** (optional)
   - Add domain in Vercel project settings
   - Update DNS records as instructed

2. **Set Up Monitoring**
   - Enable Vercel Analytics
   - Configure error tracking (Sentry)
   - Set up uptime monitoring

3. **Enable Firebase Features**
   - Set up email verification
   - Configure OAuth providers
   - Add Firebase security rules

4. **Performance Monitoring**
   - Use Vercel Speed Insights
   - Monitor API response times
   - Track user engagement

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **GitHub Actions**: [docs.github.com/actions](https://docs.github.com/actions)

## Alternative Deployment Options

If you prefer not to use Vercel:

### 1. **Netlify**
- Similar to Vercel
- Good Next.js support
- Free tier available

### 2. **Railway**
- Full-stack hosting
- Docker-based deployment
- Pay-as-you-go pricing

### 3. **AWS Amplify**
- AWS integration
- Good for larger projects
- More complex setup

### 4. **Self-Hosted (VPS)**
- Full control
- More maintenance required
- Use PM2 for process management

```bash
# Self-hosted deployment
npm run build
pm2 start npm --name quantumcv -- start
```

**Note**: All alternatives require similar environment variable configuration.
