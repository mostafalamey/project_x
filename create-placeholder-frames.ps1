# PowerShell script to create placeholder rotation frames
# This script copies the model thumbnail image 36 times with sequential naming
# to allow testing of the 360° rotation feature

Write-Host "Creating placeholder rotation frames..." -ForegroundColor Cyan

$models = @("model-A-1", "model-B-2", "model-C-1")
$frameCount = 36

foreach ($model in $models) {
    $sourceImage = ".\public\data\models\$model.jpg"
    $targetFolder = ".\public\data\models\$model"
    
    if (Test-Path $sourceImage) {
        Write-Host "`nProcessing $model..." -ForegroundColor Yellow
        
        for ($i = 0; $i -lt $frameCount; $i++) {
            $targetFile = Join-Path $targetFolder "frame-$i.jpg"
            
            # Copy the source image to create placeholder frame
            Copy-Item -Path $sourceImage -Destination $targetFile -Force
            
            if ($i % 10 -eq 0) {
                Write-Host "  Created frames 0-$i" -ForegroundColor Green
            }
        }
        
        Write-Host "  ✓ Created $frameCount placeholder frames for $model" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Source image not found: $sourceImage" -ForegroundColor Red
    }
}

Write-Host "`nPlaceholder frames created successfully!" -ForegroundColor Cyan
Write-Host "Note: These are identical copies. Replace with actual 360° rotation renders." -ForegroundColor Yellow
