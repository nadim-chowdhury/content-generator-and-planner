# Installation Notes

## Canvas Package for Image Generation

The sharing service requires the `canvas` package for generating shareable images. This package has system dependencies that need to be installed.

### Installation

```bash
npm install canvas
```

### System Dependencies

**On Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**On macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

**On Windows:**
Canvas should work with the pre-built binaries, but you may need to install Visual Studio Build Tools.

### Note

If canvas is not installed, the image generation endpoints will return a `503 Service Unavailable` error. The application will continue to work for all other features.

