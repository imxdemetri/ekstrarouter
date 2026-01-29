# Ekstra Router Setup - Onboarding App

Desktop application for setting up GL.iNet routers with Ekstra firmware.

## Features

- **Auto-Detection**: Automatically finds GL.iNet routers on the network
- **One-Click Flash**: Installs Ekstra firmware with a single click
- **Progress Tracking**: Real-time progress updates during firmware installation
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build          # All platforms
npm run build:win      # Windows only
npm run build:mac      # macOS only
npm run build:linux    # Linux only
```

### Project Structure

```
onboarding-app/
├── src/
│   ├── main/              # Main process (Node.js)
│   │   ├── index.js       # Entry point
│   │   ├── router-detector.js    # Router detection logic
│   │   ├── router-flasher.js     # Firmware flashing logic
│   │   ├── state-machine.js       # Setup state management
│   │   └── ipc-handlers.js        # IPC communication handlers
│   ├── renderer/          # Renderer process (Browser)
│   │   ├── index.html     # UI markup
│   │   ├── styles.css     # Styling
│   │   └── app.js         # UI logic
│   └── preload.js         # Secure IPC bridge
├── assets/                # Icons, logos
├── firmware/              # Firmware binaries (not in git)
│   └── manifest.json      # Firmware metadata
└── package.json
```

## Usage

1. **Detect Router**: App automatically scans for GL.iNet routers
2. **Install Firmware**: Click "Install Ekstra Firmware" if stock firmware detected
3. **Wait for Reboot**: Router reboots automatically (2-3 minutes)
4. **Open Dashboard**: Click "Open Dashboard" to complete setup

## Testing

For testing without hardware, use the mock router API:

```bash
# In separate terminal
cd ../scripts
node mock-router-api.js
```

Then point the app at `localhost:8080` (modify router-detector.js for testing).

## Building

The app uses `electron-builder` for packaging. Firmware binaries should be placed in `firmware/` directory before building.

## Notes

- Firmware binaries (.bin files) are NOT committed to git
- They should be downloaded during build or from CDN
- `manifest.json` contains SHA256 hashes for verification
