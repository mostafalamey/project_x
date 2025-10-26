# Build script for GitHub Pages deployment
# This script builds the production version without admin features

Write-Host "🚀 Building Project X for GitHub Pages..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy production routes
Write-Host "📝 Step 1: Copying production routes (without admin)..." -ForegroundColor Yellow
Copy-Item src/routes/index.production.tsx src/routes/index.tsx -Force
Write-Host "✅ Production routes copied" -ForegroundColor Green
Write-Host ""

# Step 2: Build with Vite
Write-Host "🔨 Step 2: Building with Vite..." -ForegroundColor Yellow
npm run build -- --config vite.config.production.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Vite build completed" -ForegroundColor Green
Write-Host ""

# Step 3: Copy .nojekyll
Write-Host "📄 Step 3: Copying .nojekyll to dist..." -ForegroundColor Yellow
Copy-Item .nojekyll dist/.nojekyll -ErrorAction SilentlyContinue
Write-Host "✅ .nojekyll copied" -ForegroundColor Green
Write-Host ""

# Step 4: Restore original routes
Write-Host "🔄 Step 4: Restoring original routes..." -ForegroundColor Yellow
git checkout src/routes/index.tsx 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Original routes restored from git" -ForegroundColor Green
} else {
    Write-Host "⚠️  Git restore skipped (file unchanged or not in git)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "✨ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Your production build is ready in the 'dist' folder" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Test locally: npm run preview" -ForegroundColor Gray
Write-Host "  2. Deploy to GitHub Pages (automatic via GitHub Actions)" -ForegroundColor Gray
Write-Host "  3. Or manually deploy: gh-pages -d dist" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 See GITHUB_PAGES_DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
