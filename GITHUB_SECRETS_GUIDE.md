# GitHub Secrets Setup Guide

This guide explains how to add all required secrets to your GitHub repository for the CI/CD pipeline.

## 🔐 Accessing GitHub Secrets

1. Go to: `https://github.com/ShalomObongo/QuantumCV`
2. Click **Settings** tab
3. Left sidebar → **Secrets and variables** → **Actions**
4. Click **New repository secret** for each secret below

---

## 📦 Required Secrets

### 1. Vercel Deployment Secrets

These secrets enable automatic deployment to Vercel.

#### `VERCEL_TOKEN`
- **Purpose**: Authenticates GitHub Actions with your Vercel account
- **How to get it**:
  1. Go to [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
  2. Click **Create Token**
  3. Name it: `GitHub Actions - QuantumCV`
  4. Select scope: **Full Account**
  5. Click **Create**
  6. Copy the token (you'll only see it once!)
  7. Paste it as the secret value in GitHub

#### `VERCEL_ORG_ID`
- **Purpose**: Identifies your Vercel team/organization
- **How to get it**:
  1. Install Vercel CLI: `npm install -g vercel`
  2. Login: `vercel login`
  3. In your project directory: `vercel link`
  4. Open `.vercel/project.json`
  5. Copy the `orgId` value
  6. Paste it as the secret value in GitHub

**Alternative method**:
  1. Go to your Vercel dashboard
  2. Settings → General
  3. Look for "Team ID" or "Organization ID"

#### `VERCEL_PROJECT_ID`
- **Purpose**: Identifies your specific Vercel project
- **How to get it**:
  1. Same as above - from `.vercel/project.json`
  2. Copy the `projectId` value
  3. Paste it as the secret value in GitHub

**Alternative method**:
  1. Go to your project in Vercel dashboard
  2. Settings → General
  3. Look for "Project ID"

---

### 2. Firebase Configuration Secrets

These secrets configure Firebase authentication and database.

#### `NEXT_PUBLIC_FIREBASE_API_KEY`
- **Purpose**: Firebase Web API Key
- **How to get it**:
  1. Go to [Firebase Console](https://console.firebase.google.com)
  2. Select your project (or create one)
  3. Click ⚙️ (gear icon) → **Project settings**
  4. Scroll down to "Your apps" section
  5. If no web app exists, click **Add app** → Web (</>) icon
  6. Copy the `apiKey` value from the config object
  7. Paste it as the secret value in GitHub

#### `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- **How to get it**: Same location as above
- **Format**: `your-project-id.firebaseapp.com`
- **Example**: `quantumcv-prod.firebaseapp.com`

#### `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- **How to get it**: Same location as above
- **Format**: Your Firebase project ID
- **Example**: `quantumcv-prod`

#### `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- **How to get it**: Same location as above
- **Format**: `your-project-id.appspot.com`
- **Example**: `quantumcv-prod.appspot.com`

#### `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- **How to get it**: Same location as above
- **Format**: Numeric string
- **Example**: `123456789012`

#### `NEXT_PUBLIC_FIREBASE_APP_ID`
- **How to get it**: Same location as above
- **Format**: `1:123456789:web:abcdef123456`
- **Example**: `1:123456789012:web:abc123def456ghi789`

**Quick Copy Method**:
```javascript
// Your Firebase config looks like this:
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

---

### 3. Gemini AI API Key

#### `GEMINI_API_KEY`
- **Purpose**: Enables AI-powered resume generation and suggestions
- **How to get it**:
  1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Click **Create API Key**
  3. Select a Google Cloud project (or create one)
  4. Copy the generated API key
  5. Paste it as the secret value in GitHub

**Note**: Keep this key secret! It provides access to your Google AI quota.

---

### 4. Optional: Code Coverage

#### `CODECOV_TOKEN` (Optional)
- **Purpose**: Enables code coverage reports on Codecov
- **How to get it**:
  1. Go to [Codecov.io](https://codecov.io)
  2. Sign up with GitHub
  3. Add your repository
  4. Copy the upload token
  5. Paste it as the secret value in GitHub

**Note**: This is optional. The pipeline will work without it.

---

## ✅ Verification Checklist

After adding all secrets, verify you have:

- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `GEMINI_API_KEY`
- [ ] `CODECOV_TOKEN` (optional)

---

## 🧪 Testing Your Secrets

### Method 1: Push to Branch
```bash
# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "Test CI/CD pipeline"
git push
```

Then check:
1. Go to **Actions** tab in GitHub
2. Watch the workflow run
3. Check for any authentication errors

### Method 2: Manual Workflow Trigger
1. Go to **Actions** tab
2. Select "CI/CD Pipeline" workflow
3. Click **Run workflow**
4. Select your branch
5. Click **Run workflow**

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use different Firebase projects for dev/staging/production
- ✅ Rotate secrets periodically (every 90 days)
- ✅ Use read-only tokens where possible
- ✅ Monitor secret usage in Vercel/Firebase dashboards
- ✅ Enable 2FA on all accounts (GitHub, Vercel, Firebase, Google Cloud)

### ❌ DON'T:
- ❌ Never commit secrets to your repository
- ❌ Never share secrets in Discord/Slack/email
- ❌ Never use production secrets in development
- ❌ Never log secrets in your application code
- ❌ Never store secrets in client-side code

---

## 🚨 Troubleshooting

### "Vercel authentication failed"
**Solution**:
1. Verify `VERCEL_TOKEN` is correct
2. Check token hasn't expired
3. Ensure token has "Full Account" scope
4. Create a new token if needed

### "Firebase configuration invalid"
**Solution**:
1. Verify all Firebase secrets are correct
2. Check for extra spaces or quotes
3. Ensure Firebase project is active
4. Verify billing is enabled for Firebase

### "Gemini API error"
**Solution**:
1. Verify API key is active
2. Check API quota hasn't been exceeded
3. Enable Gemini API in Google Cloud Console
4. Ensure billing is set up

### "Secret not found"
**Solution**:
1. Double-check secret name spelling (case-sensitive!)
2. Ensure secret is in **Actions** section, not **Dependabot** or **Codespaces**
3. Wait a few minutes after adding - secrets aren't immediately available

### Pipeline runs but deployment fails
**Solution**:
1. Check workflow logs for specific error
2. Verify all three Vercel secrets are correct
3. Ensure Vercel project exists and is linked
4. Check Vercel dashboard for deployment logs

---

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Firebase Setup Guide](https://firebase.google.com/docs/web/setup)
- [Google AI Studio](https://makersuite.google.com)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🎯 Quick Start Command

After adding all secrets, test the pipeline:

```bash
# Trigger CI/CD pipeline
git add .
git commit -m "Configure GitHub secrets"
git push origin main
```

Then watch it run:
```
GitHub → Your Repository → Actions tab → Watch the magic happen! ✨
```

---

## 💡 Pro Tips

1. **Use Environment-Specific Secrets**: Create separate Firebase projects for development, staging, and production

2. **Document Your Secrets**: Keep a secure note (1Password, LastPass) documenting:
   - Where each secret came from
   - When it was created
   - When it expires
   - How to regenerate it

3. **Test Locally First**: Before adding secrets to GitHub, test them locally:
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_FIREBASE_API_KEY=your-key
   # ... other vars

   # Test build
   npm run build

   # Test app
   npm run dev
   ```

4. **Monitor Usage**: Set up billing alerts in:
   - Firebase Console → Usage and billing
   - Google Cloud Console → Billing
   - Vercel Dashboard → Usage

5. **Automate Secret Rotation**: Consider using:
   - GitHub's secret scanning
   - Dependabot security updates
   - Scheduled secret rotation reminders

---

## 🔄 Updating Secrets

If you need to update a secret:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Find the secret name
3. Click **Update**
4. Enter the new value
5. Click **Update secret**

**Note**: Updated secrets take effect on the next workflow run.

---

## ❓ FAQ

**Q: Can I use the same secrets for multiple branches?**
A: Yes! Secrets are repository-wide and available to all branches.

**Q: Can I view secret values after adding them?**
A: No. GitHub doesn't allow viewing secret values for security. You must update them if lost.

**Q: Do secrets work in fork pull requests?**
A: No. For security, secrets are not available to workflows triggered by forks.

**Q: Can I use secrets in local development?**
A: No. Secrets are only for GitHub Actions. Use `.env.local` for local development.

**Q: How much do these services cost?**
A:
- GitHub Actions: 2,000 minutes/month free
- Vercel: Free tier includes deployments
- Firebase: Generous free tier (Spark plan)
- Gemini API: Pay-as-you-go, very low cost for typical usage

**Q: What if I accidentally commit a secret?**
A:
1. Immediately rotate/regenerate the secret
2. Update the secret in GitHub
3. Use `git filter-repo` or BFG Repo-Cleaner to remove from history
4. Force push to GitHub
5. Consider repository as compromised until rotation complete

---

Need help? Open an issue or check the logs in GitHub Actions!
