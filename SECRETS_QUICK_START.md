# 🚀 Quick Start: Adding GitHub Secrets

## 📍 Where to Add Secrets

```
GitHub Repository → Settings → Secrets and variables → Actions → New repository secret
```

Direct URL: `https://github.com/ShalomObongo/QuantumCV/settings/secrets/actions`

---

## 📋 Secrets Checklist

Copy this list and check off as you add each secret:

### Vercel (3 secrets) - For Deployment
```
☐ VERCEL_TOKEN
☐ VERCEL_ORG_ID
☐ VERCEL_PROJECT_ID
```

### Firebase (6 secrets) - For Auth & Database
```
☐ NEXT_PUBLIC_FIREBASE_API_KEY
☐ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
☐ NEXT_PUBLIC_FIREBASE_PROJECT_ID
☐ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
☐ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
☐ NEXT_PUBLIC_FIREBASE_APP_ID
```

### AI (1 secret) - For Resume Generation
```
☐ GEMINI_API_KEY
```

### Optional (1 secret) - For Code Coverage
```
☐ CODECOV_TOKEN (optional)
```

**Total: 10 required secrets + 1 optional**

---

## 🔍 Where to Find Each Secret

### 1️⃣ Vercel Secrets

#### Get VERCEL_TOKEN:
```
1. Visit: https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: "GitHub Actions - QuantumCV"
4. Scope: "Full Account"
5. Copy the token
```

#### Get VERCEL_ORG_ID and VERCEL_PROJECT_ID:
```bash
# Option A: Using Vercel CLI (recommended)
npm install -g vercel
vercel login
cd /path/to/QuantumCV
vercel link

# Then read from:
cat .vercel/project.json

# Option B: From Vercel Dashboard
# Go to: Project Settings → General
# Copy "Project ID" and "Team ID"
```

---

### 2️⃣ Firebase Secrets

#### Get All Firebase Secrets at Once:
```
1. Visit: https://console.firebase.google.com
2. Select your project (or create new)
3. Click ⚙️ → Project Settings
4. Scroll to "Your apps"
5. Click "Add app" → Web (</>) if needed
6. Copy entire config object:
```

```javascript
// Firebase will show you this:
const firebaseConfig = {
  apiKey: "...",                    // → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "...",                // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "...",                 // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "...",             // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...",         // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "..."                      // → NEXT_PUBLIC_FIREBASE_APP_ID
};
```

**Just copy each value directly from Firebase to GitHub!**

---

### 3️⃣ Gemini AI Secret

#### Get GEMINI_API_KEY:
```
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Select or create a Google Cloud project
5. Copy the API key
```

---

## ⚡ Fastest Setup Method

### Step 1: Open Two Browser Tabs

**Tab 1**: `https://github.com/ShalomObongo/QuantumCV/settings/secrets/actions`
**Tab 2**: Service you're getting credentials from

### Step 2: Copy-Paste Each Secret

For each secret:
1. In Tab 2: Get the credential value
2. In Tab 1: Click "New repository secret"
3. Name: Paste the secret name (e.g., `VERCEL_TOKEN`)
4. Value: Paste the credential value
5. Click "Add secret"
6. Repeat for next secret

### Step 3: Verify Setup

After adding all secrets, trigger a test:

```bash
# In your local QuantumCV directory
git pull
echo "# CI/CD Test" >> README.md
git add README.md
git commit -m "Test GitHub Actions with secrets"
git push
```

Then watch: `https://github.com/ShalomObongo/QuantumCV/actions`

---

## 🎯 Common Mistakes to Avoid

❌ **Don't include quotes around secret values**
```
Wrong: "AIzaSyABC123"
Right: AIzaSyABC123
```

❌ **Don't add extra spaces**
```
Wrong:  AIzaSyABC123
Right: AIzaSyABC123
```

❌ **Don't mix up similar names**
```
Wrong: NEXT_PUBLIC_FIREBASE_KEY (doesn't exist)
Right: NEXT_PUBLIC_FIREBASE_API_KEY
```

❌ **Don't use production secrets in test projects**
- Create separate Firebase projects for testing

---

## 🧪 Quick Test After Setup

### Test 1: Check Secrets Exist
```bash
# All secrets should be listed here:
# https://github.com/ShalomObongo/QuantumCV/settings/secrets/actions
```

### Test 2: Trigger Pipeline
```bash
# Push any change to trigger CI/CD
git commit --allow-empty -m "Test pipeline"
git push
```

### Test 3: Check Workflow
```
GitHub → Actions tab → Watch the "CI/CD Pipeline" run
```

**Expected Result**:
- ✅ Test job passes
- ✅ Build succeeds
- ✅ No authentication errors

---

## 🆘 Quick Fixes

### "Vercel authentication failed"
→ Regenerate `VERCEL_TOKEN` and update secret

### "Firebase config invalid"
→ Double-check all 6 Firebase secrets

### "Gemini API error"
→ Verify `GEMINI_API_KEY` and enable Gemini API in Google Cloud

### "Secret not found"
→ Check spelling (case-sensitive!) and wait 1-2 minutes

---

## 📞 Need Help?

1. **Full Guide**: See `GITHUB_SECRETS_GUIDE.md` for detailed instructions
2. **Deployment**: See `DEPLOYMENT.md` for Vercel setup
3. **Logs**: Check GitHub Actions logs for specific errors
4. **Firebase**: Check Firebase Console for quota/billing issues
5. **Vercel**: Check Vercel Dashboard for deployment status

---

## ✨ You're Done When...

✅ All 10 required secrets are added to GitHub
✅ CI/CD pipeline runs successfully
✅ No authentication errors in logs
✅ Test build completes without errors

**Time estimate: 15-20 minutes for first-time setup**

Good luck! 🚀
