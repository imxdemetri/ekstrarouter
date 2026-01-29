# Ekstra AI Router

Smart router firmware and onboarding tools for vending machine operators.

## Overview

Ekstra AI Router transforms GL.iNet routers into intelligent, self-healing connectivity hubs with built-in location analytics. Designed specifically for HaHa vending machine deployments.

### Key Features

- **Zero-Touch Setup**: 10-minute setup vs. 60+ minutes with manual configuration
- **Self-Healing Connectivity**: Auto-reconnect, captive portal handling, watchdog recovery
- **Location Analytics**: Passive WiFi monitoring for foot traffic insights
- **Dual Connection Modes**: Ethernet or WiFi connection to HaHa machines
- **Remote Management**: OTA updates, health monitoring, fleet visibility

### Supported Hardware

| Model | Codename | Status |
|-------|----------|--------|
| GL-B3000 | Marble | ✅ Supported |
| GL-MT3000 | Beryl AX | ✅ Supported |
| GL-X3000 | Spitz AX | ✅ Supported |
| GL-XE3000 | Puli AX | ✅ Supported |

## Quick Start

### For Operators (End Users)

1. Download the Ekstra Router Setup app from [ekstra.ai/router-setup](https://ekstra.ai/router-setup)
2. Plug in your GL.iNet router
3. Run the app and follow the 4-step wizard
4. Connect your HaHa machine (Ethernet or WiFi)

### For Developers

```bash
# Clone the repository
git clone https://github.com/ekstra-ai/ekstra-router.git
cd ekstra-router

# Start onboarding app in development mode
cd onboarding-app
npm install
npm run dev

# Run mock router API for testing
cd ../scripts
node mock-router-api.js
```

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Onboarding App  │────▶│  Ekstra Router   │────▶│  api.ekstra.ai   │
│    (Electron)    │     │ (Custom Firmware)│     │     (Cloud)      │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              ┌─────▼─────┐               ┌─────▼─────┐
              │  Radio 1  │               │  Radio 2  │
              │   5GHz    │               │  2.4GHz   │
              │Connectivity│              │ Analytics │
              └─────┬─────┘               └───────────┘
                    │
              ┌─────▼─────┐
              │   HaHa    │
              │  Vending  │
              └───────────┘
```

## Repository Structure

```
ekstra-router/
├── docs/                    # Documentation
├── onboarding-app/          # Electron desktop application
├── firmware/                # OpenWrt packages & build scripts
│   └── packages/            # Ekstra firmware packages
├── scripts/                 # Development utilities
└── README.md
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - System architecture and component details
- [Strategic Alignment](docs/STRATEGIC_ALIGNMENT.md) - Problem → Solution mapping
- [User Journey](docs/USER_JOURNEY.md) - 8-step customer setup flow
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Phased development priorities
- [Validation Checklist](docs/VALIDATION_CHECKLIST.md) - Pre-release testing requirements
- [API Reference](docs/API_REFERENCE.md) - Firmware API specification (coming soon)
- [Build Guide](docs/BUILD_GUIDE.md) - How to build firmware (coming soon)
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions (coming soon)

## Contributing

This is a private repository for Ekstra AI. Contact the team for access.

## License

Proprietary - Ekstra AI © 2026
