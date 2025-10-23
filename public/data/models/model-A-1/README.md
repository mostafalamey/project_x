# Model 360° Rotation Frames

This folder should contain 36 JPEG images for the 360° rotation view of Model A-1.

## File Naming Convention

Files should be named: `frame-0.jpg`, `frame-1.jpg`, ... `frame-35.jpg`

## Requirements

- **Total frames**: 36 (one frame per 10° rotation)
- **Format**: JPEG
- **Recommended size**: 1920x1080 or similar aspect ratio
- **File naming**: `frame-{index}.jpg` where index is 0-35

## Creating Rotation Frames

1. Use 3D software (Blender, SketchUp, etc.) to render the model
2. Set camera to orbit around the model at fixed distance
3. Capture 36 frames at 10° increments (360° / 36 = 10° per frame)
4. Export as JPEG with consistent naming
5. Place all files in this directory

## Temporary Placeholder

For testing purposes, you can temporarily copy the model thumbnail image:

- Copy `model-A-1.jpg` and rename to `frame-0.jpg`, `frame-1.jpg`, etc.
- This will allow the viewer to work while proper rotation frames are created
