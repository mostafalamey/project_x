# 🎓 First Time GitHub Pages Setup - Step by Step

Welcome! This guide will walk you through setting up GitHub Pages for the first time.

## 📋 What You Need To Do

### Step 1: Enable GitHub Pages ⚙️

1. **Go to your repository on GitHub:**

   - Visit: https://github.com/mostafalamey/project_x

2. **Click on "Settings" tab** (at the top of the page)

3. **Scroll down and click "Pages"** (in the left sidebar under "Code and automation")

4. **Under "Build and deployment":**
   - Find the **"Source"** dropdown
   - Select **"GitHub Actions"** (NOT "Deploy from a branch")
5. **Click Save** (if there's a save button)

That's it for Step 1! ✅

---

### Step 2: Commit and Push Your Changes 📤

The workflow file has been updated to work with your branch (`004-admin-config-dashboard`).

Now commit and push:

```powershell
# Add all the new files
git add .

# Commit with a message
git commit -m "Add GitHub Pages deployment with auto-build"

# Push to your current branch
git push origin 004-admin-config-dashboard
```

---

### Step 3: Watch the Magic Happen! ✨

1. **Go to the "Actions" tab** in your GitHub repository:

   - Visit: https://github.com/mostafalamey/project_x/actions

2. **You should see a workflow running** called "Deploy to GitHub Pages"

   - It will show a yellow circle 🟡 (in progress)
   - After 2-3 minutes, it will show a green checkmark ✅ (success)
   - If something goes wrong, it will show a red X ❌

3. **Click on the workflow** to see detailed progress

4. **Once complete**, your site will be live at:
   - https://mostafalamey.github.io/project_x/

---

## 🎯 Alternative: Manual Trigger

If you want to trigger the deployment manually without pushing:

1. Go to: https://github.com/mostafalamey/project_x/actions
2. Click on "Deploy to GitHub Pages" workflow (on the left)
3. Click the **"Run workflow"** button (on the right)
4. Select your branch: `004-admin-config-dashboard`
5. Click **"Run workflow"**

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Workflow not found"

**Solution:** You need to push the `.github/workflows/deploy.yml` file first

```powershell
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow"
git push
```

### Issue 2: "Actions tab shows nothing"

**Solution:**

- Make sure GitHub Actions are enabled for your repository
- Go to: Settings → Actions → General
- Under "Actions permissions", select "Allow all actions and reusable workflows"

### Issue 3: "Build fails with 'npm ci' error"

**Solution:** This usually means `package-lock.json` is missing or outdated

```powershell
# Delete node_modules and package-lock.json
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force

# Reinstall
npm install

# Commit the new package-lock.json
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

### Issue 4: "Permission denied when deploying"

**Solution:**

1. Go to: Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Click Save
5. Re-run the workflow

### Issue 5: "404 error when visiting the site"

**Solution:** Wait a few minutes (GitHub Pages can take 5-10 minutes to become available after first deployment)

---

## 📊 What Happens During Deployment?

When you push or trigger the workflow, GitHub will:

1. ✅ Check out your code
2. ✅ Install Node.js and dependencies
3. ✅ Copy the production routes (without admin)
4. ✅ Build your site with Vite
5. ✅ Upload the `dist` folder
6. ✅ Deploy to GitHub Pages

**Total time:** Usually 2-3 minutes

---

## 🎓 Understanding the GitHub Pages Interface

When you go to Settings → Pages, you'll see:

- **Source**: Should say "GitHub Actions" ← This is what you need to select
- **Visit site**: A button to visit your live site (appears after first deployment)
- **Custom domain**: You can add your own domain here (optional)
- **Enforce HTTPS**: Automatically enabled (good for security)

---

## ✅ Quick Checklist

Before you start:

- [ ] I have committed my code to the `004-admin-config-dashboard` branch
- [ ] I have the `.github/workflows/deploy.yml` file in my repository
- [ ] I am ready to enable GitHub Pages in Settings

Steps to complete:

- [ ] Step 1: Enable GitHub Pages (Source: GitHub Actions)
- [ ] Step 2: Push the changes (including the workflow file)
- [ ] Step 3: Check the Actions tab to watch deployment
- [ ] Step 4: Visit your live site!

---

## 🆘 Need More Help?

If you run into issues:

1. **Check the Actions tab** for error messages
2. **Read the error logs** - they usually tell you exactly what's wrong
3. **Common fix**: Re-run the workflow (there's a "Re-run all jobs" button)

Screenshot the error and I can help you debug! 👍

---

## 🎉 Success!

Once deployment is complete, you'll see:

- ✅ Green checkmark in Actions tab
- ✅ Your site is live at: https://mostafalamey.github.io/project_x/
- ✅ Every future push to `004-admin-config-dashboard` will auto-deploy

**Congratulations on your first GitHub Pages deployment!** 🚀

---

## 📝 What Was Deployed?

Your live site includes:

- ✅ Interactive map viewer
- ✅ Master plan view
- ✅ Building and floor plan viewers
- ✅ 3D model viewer
- ✅ Tour viewer
- ✅ Light/dark theme toggle
- ✅ All your data from `/public/data/`

What's NOT deployed (as intended):

- ❌ Admin dashboard (kept for local development only)
- ❌ Server components (not needed for static hosting)

Perfect for a production-ready public showcase! ✨
