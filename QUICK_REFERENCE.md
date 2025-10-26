# 🚀 Quick Reference - GitHub Pages Deployment

## One-Command Build

```powershell
npm run build:github
```

## Deploy to GitHub Pages

### Automatic (Recommended)

1. Enable GitHub Pages: Settings → Pages → Source: "GitHub Actions"
2. Push to main: `git push origin main`
3. Done! Check Actions tab for progress

### Manual

```powershell
npm run build:github
gh-pages -d dist
```

## Test Locally

```powershell
npm run build:github
npm run preview
```

Visit: http://localhost:8080

## Your URLs

- **Live Site**: https://mostafalamey.github.io/project_x/
- **GitHub Actions**: https://github.com/mostafalamey/project_x/actions

## What's Excluded in Production

- ❌ Admin dashboard (`/admin/*` routes)
- ❌ Server (not needed for static hosting)
- ❌ Database features (Dexie.js, autosave)

## What's Included

- ✅ All viewer pages (Map, MasterPlan, Building, Floor, Model, Tour)
- ✅ All data from `/public/data/`
- ✅ Theme system (light/dark)
- ✅ Navigation & transitions
- ✅ Responsive design

## Files Created

```
📄 .nojekyll                          - GitHub Pages config
📄 vite.config.production.ts          - Production build config
📄 src/routes/index.production.tsx    - Routes without admin
📄 .github/workflows/deploy.yml       - Auto-deploy workflow
📄 build-github.ps1                   - Build script
📄 GITHUB_PAGES_DEPLOYMENT.md         - Full guide
📄 GITHUB_PAGES_BUILD_SUMMARY.md      - Detailed summary
```

## Commands

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run build`        | Standard build (includes admin)  |
| `npm run build:prod`   | Production build (no admin)      |
| `npm run build:github` | Build for GitHub Pages           |
| `npm run preview`      | Preview production build locally |
| `./build-github.ps1`   | Build with detailed output       |

## Troubleshooting

- **Build fails**: Clear `node_modules` and `dist`, run `npm install`
- **Routes don't work**: Verify HashRouter is used (it is!)
- **Assets not loading**: Check browser console, verify paths
- **Deployment fails**: Enable GitHub Pages with "GitHub Actions" source

## Need Help?

📚 Read: `GITHUB_PAGES_DEPLOYMENT.md` for detailed instructions

---

**Ready to deploy? Run: `npm run build:github` then push to GitHub!**
