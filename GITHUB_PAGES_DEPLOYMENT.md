# GitHub Pages Deployment Guide

This guide explains how to deploy the Project X Interactive Viewer to GitHub Pages.

## 🚀 Quick Start

### Option 1: Automatic Deployment (Recommended)

The repository is configured with GitHub Actions for automatic deployment.

1. **Enable GitHub Pages in your repository:**

   - Go to your repository on GitHub
   - Navigate to `Settings` > `Pages`
   - Under "Build and deployment", select **Source**: `GitHub Actions`

2. **Push to your main branch:**

   ```bash
   git push origin main
   ```

3. **Your site will be automatically built and deployed!**
   - Check the Actions tab to monitor the deployment
   - Once complete, your site will be available at: `https://<username>.github.io/<repository-name>/`

### Option 2: Manual Build and Deploy

If you prefer to build locally and deploy manually:

1. **Build the production version:**

   ```powershell
   npm run build:github
   ```

   This creates a `dist` folder with the optimized static files (admin excluded).

2. **Deploy using GitHub Pages CLI or manually:**

   - Install gh-pages: `npm install -g gh-pages`
   - Deploy: `gh-pages -d dist`

   Or manually upload the `dist` folder contents to the `gh-pages` branch.

## 📦 What Gets Included

The production build includes:

- ✅ Interactive viewer pages (Map, MasterPlan, Building, Floor, Model, Tour)
- ✅ All public data (buildings, models, tours, landmarks)
- ✅ Optimized assets and images
- ✅ Theme system and navigation

The production build excludes:

- ❌ Admin dashboard and configuration pages
- ❌ Server-side API endpoints
- ❌ Admin-related dependencies (Dexie.js, file-saver, etc. are tree-shaken if unused)

## 🛠️ Build Scripts

- `npm run build` - Standard Vite build (includes admin routes)
- `npm run build:prod` - Production build using production config
- `npm run build:github` - Production build + copy .nojekyll for GitHub Pages

## 📝 Configuration

### Base URL

The production config uses relative paths (`base: "./"`) which works for both:

- Root domain deployments: `username.github.io`
- Repository deployments: `username.github.io/repository-name`

### Hash Routing

The app uses HashRouter (`/#/path`) to ensure all routes work on GitHub Pages without server-side configuration.

## 🔧 Customization

### Changing the Base Path

If you need to change the base path, edit `vite.config.production.ts`:

```typescript
export default defineConfig({
  base: "/your-repo-name/", // For repository deployments
  // or
  base: "/", // For root domain deployments
  // ...
});
```

### Including Admin in Production

If you want to include the admin panel in production:

1. Use the standard routes file (don't copy `index.production.tsx`)
2. Run `npm run build` instead of `npm run build:github`
3. Note: Data persistence features require a backend or local storage

## 🎯 Testing Locally

After building, you can test the production build locally:

```powershell
npm run preview
```

This serves the `dist` folder at `http://localhost:8080`

## 📋 Checklist Before Deployment

- [ ] All data files are in `/public/data/` directory
- [ ] Images and assets are properly referenced
- [ ] Test the build locally with `npm run preview`
- [ ] Verify all routes work with hash routing
- [ ] Check that no admin routes are accessible
- [ ] Ensure GitHub Pages is enabled in repository settings

## 🐛 Troubleshooting

### 404 Errors on Page Refresh

- ✅ **Solved**: The app uses HashRouter which doesn't require server configuration
- The `.nojekyll` file prevents Jekyll from processing the site

### Assets Not Loading

- Check that `base` path in `vite.config.production.ts` matches your deployment URL
- Ensure all asset paths are relative or use the correct base path

### GitHub Actions Deployment Fails

- Verify GitHub Pages is enabled in repository settings
- Check that Actions have write permissions: `Settings` > `Actions` > `General` > `Workflow permissions`
- Review the Actions tab for specific error messages

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Static Deploy Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [React Router Hash Router](https://reactrouter.com/en/main/router-components/hash-router)

---

**Note**: The server in `/server` directory is not used for GitHub Pages deployment. It's only needed for local development with the admin panel.
