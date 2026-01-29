# Ekstra AI Router - Project Blueprint

## Project Overview

**Mission**: Create a plug-and-play router solution for vending machine operators that eliminates connectivity issues and provides location analytics for Ekstra AI.

**Target Hardware**: GL.iNet routers (B3000 Marble, MT3000 Beryl AX, X3000 Spitz AX, XE3000 Puli AX)

**End Users**: Vend Guys customers (vending machine operators)

---

## Repository Structure

```
ekstra-router/
│
├── README.md                       # Project overview
├── LICENSE
├── .gitignore
│
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md             # System architecture
│   ├── USER_JOURNEY.md             # 8-step customer flow
│   ├── API_REFERENCE.md            # Firmware API specification
│   ├── BUILD_GUIDE.md              # How to build firmware
│   └── TROUBLESHOOTING.md          # Common issues
│
├── onboarding-app/                 # Electron desktop app
│   ├── src/
│   │   ├── main/                   # Main process
│   │   │   ├── index.js            # Entry point
│   │   │   ├── state-machine.js    # Setup state management
│   │   │   ├── router-detector.js  # Gateway detection
│   │   │   ├── router-flasher.js   # Firmware installation
│   │   │   └── ipc-handlers.js     # IPC communication
│   │   ├── renderer/               # Renderer process
│   │   │   ├── index.html
│   │   │   ├── styles.css
│   │   │   ├── app.js              # UI logic
│   │   │   └── components/         # UI components
│   │   └── preload.js              # Context bridge
│   ├── assets/
│   │   ├── icon.png
│   │   └── logo.png
│   ├── firmware/                   # Bundled firmware binaries
│   │   ├── manifest.json           # Firmware metadata + SHA256
│   │   └── *.bin                   # Firmware files (gitignored, downloaded)
│   ├── package.json
│   └── README.md
│
├── firmware/                       # OpenWrt custom firmware
│   ├── packages/                   # Ekstra OpenWrt packages
│   │   ├── ekstra-core/            # Core system + API
│   │   ├── ekstra-captive/         # Captive portal handling
│   │   ├── ekstra-watchdog/        # Health monitoring
│   │   ├── ekstra-sniffer/         # Monitor mode analytics
│   │   ├── ekstra-agent/           # Cloud uploader
│   │   └── ekstra-dashboard/       # Web UI
│   ├── config/                     # Default configurations
│   │   ├── etc/
│   │   └── usr/
│   ├── scripts/
│   │   ├── setup-build-env.sh      # Setup WSL build environment
│   │   └── build-firmware.sh       # Build firmware image
│   └── README.md
│
├── cloud-backend/                  # api.ekstra.ai (if managed here)
│   └── README.md                   # Or link to separate repo
│
└── scripts/                        # Development utilities
    ├── mock-router-api.js          # Mock firmware API for testing
    └── download-firmware.js        # Download firmware binaries
```

---

## Component Breakdown

### 1. Onboarding App (Electron)

**Purpose**: Desktop application that operators download to set up their router.

**Flow**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING APP FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: DETECT ROUTER                                          │
│  ├─ Find gateway IP (192.168.8.1, etc.)                        │
│  ├─ Verify HTTP reachable                                       │
│  └─ Identify if stock GL.iNet or already has Ekstra            │
│                                                                 │
│  STEP 2: FLASH FIRMWARE (if needed)                            │
│  ├─ Upload firmware via HTTP (LuCI flashops)                   │
│  ├─ Show progress bar                                           │
│  └─ Wait for reboot                                             │
│                                                                 │
│  STEP 3: VERIFY EKSTRA                                          │
│  ├─ Poll for Ekstra API on :8080                               │
│  └─ Confirm firmware installed                                  │
│                                                                 │
│  STEP 4: OPEN DASHBOARD                                         │
│  ├─ Launch browser to router IP                                │
│  └─ User completes setup wizard in dashboard                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions**:
- HTTP-first (no SSH dependency - SSH disabled by default on GL.iNet)
- Works on stock routers out of the box
- Minimal user interaction required

---

### 2. Firmware Packages

**Purpose**: Custom OpenWrt packages that transform the router.

#### ekstra-core
```
Purpose: Core system, REST API on port 8080
Provides:
  - /status.sh         → Router status, model, firmware version
  - /auth.sh           → Pairing token generation
  - /network-scan.sh   → Scan available WiFi networks
  - /network-connect.sh→ Connect to venue WiFi
  - /setup-complete.sh → Finalize setup
  - /wan-status.sh     → Internet connectivity check
Dependencies: uhttpd, uhttpd-mod-lua, jq
```

#### ekstra-captive
```
Purpose: Captive portal detection and auto-login
Provides:
  - Portal detection (HTTP redirect check)
  - Auto-login for common portals
  - Session keepalive
  - Manual fallback alert
Dependencies: curl, ekstra-core
```

#### ekstra-watchdog
```
Purpose: Health monitoring and auto-recovery
Provides:
  - Connection monitoring (ping gateway, DNS, internet)
  - Auto-reconnect with exponential backoff
  - Channel switching on interference
  - Automatic reboot on prolonged failure
Dependencies: ekstra-core
```

#### ekstra-sniffer
```
Purpose: Passive WiFi monitoring for location analytics
Provides:
  - Monitor mode on Radio 2 (2.4GHz)
  - Probe request capture
  - MAC hashing (privacy-preserving)
  - Device counting and RSSI measurement
Radio Setup:
  - Radio 1 (5GHz): Connectivity (venue WiFi + HaHa bridge)
  - Radio 2 (2.4GHz): Monitor mode (passive sniffing)
Dependencies: tcpdump, iw, ekstra-core
```

#### ekstra-agent
```
Purpose: Cloud telemetry uploader
Provides:
  - 5-minute upload cadence to api.ekstra.ai
  - Health telemetry (uptime, signal, HaHa status)
  - Analytics data (device counts, vendors, RSSI)
  - OTA update checking
Dependencies: curl, jq, ekstra-core, ekstra-sniffer
```

#### ekstra-dashboard
```
Purpose: Web-based management UI
Provides:
  - Setup wizard (password, WiFi, HaHa connection mode)
  - Health overview dashboard
  - Alert management
  - Configuration changes
Stack: React + Argon theme (or lightweight alternative)
Dependencies: uhttpd, ekstra-core
```

---

### 3. Dual-Radio Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  GL.iNet B3000 / MT3000                         │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│   RADIO 1 (5GHz)           │   RADIO 2 (2.4GHz)                │
│   ════════════════         │   ════════════════                │
│                            │                                    │
│   MODE: Client + AP        │   MODE: Monitor                   │
│                            │                                    │
│   ┌──────────────────┐     │   ┌──────────────────┐            │
│   │ Venue WiFi       │     │   │ Passive Capture  │            │
│   │ (STA - upstream) │     │   │ - Probe requests │            │
│   └────────┬─────────┘     │   │ - MAC addresses  │            │
│            │               │   │ - RSSI values    │            │
│   ┌────────▼─────────┐     │   │ - Device density │            │
│   │ HaHa Bridge      │     │   └────────┬─────────┘            │
│   │ (AP - optional)  │     │            │                      │
│   │ SSID: ekstra-    │     │            ▼                      │
│   │       haha-XX    │     │   ┌──────────────────┐            │
│   └──────────────────┘     │   │ ekstra-agent     │            │
│            │               │   │ → api.ekstra.ai  │            │
│            ▼               │   └──────────────────┘            │
│   ┌──────────────────┐     │                                    │
│   │ HaHa Vending     │     │   DATA COLLECTED:                 │
│   │ (ETH or WiFi)    │     │   - Unique devices/5min          │
│   └──────────────────┘     │   - Avg RSSI (proximity)         │
│                            │   - Vendor breakdown             │
│                            │   - Peak hours                   │
│                            │                                    │
└────────────────────────────┴────────────────────────────────────┘
```

---

### 4. HaHa Connection Modes

```
MODE 1: ETHERNET (Default)
════════════════════════════
┌────────────┐   CAT5/6   ┌────────────┐
│   Router   │───────────▶│    HaHa    │
│  LAN Port  │            │   Machine  │
└────────────┘            └────────────┘
Config: HaHa uses static IP on router subnet

MODE 2: WIFI (Alternative)
════════════════════════════
┌────────────┐            ┌────────────┐
│   Router   │   WiFi     │    HaHa    │
│ AP: ekstra-│◀──────────▶│  connects  │
│   haha-XX  │            │   to AP    │
└────────────┘            └────────────┘
Config: Router creates dedicated AP for HaHa
```

---

## API Specification

### Ekstra Router API (Port 8080)

All endpoints return JSON. Base URL: `http://<router-ip>:8080`

#### GET /status.sh
```json
{
  "status": "online",
  "hasEkstraFirmware": true,
  "setup_state": "configured",  // or "unconfigured"
  "board": "glinet,gl-mt3000",
  "target": "mediatek/filogic",
  "firmware_version": "1.0.0",
  "uptime": 86400,
  "wan_connected": true,
  "haha_connected": true
}
```

#### POST /auth.sh
```json
// Request
{ "action": "pair" }

// Response
{
  "success": true,
  "token": "abc123..."
}
```

#### GET /network-scan.sh
```json
{
  "networks": [
    { "ssid": "Venue-WiFi", "signal": -45, "secured": true, "channel": 6 },
    { "ssid": "Guest", "signal": -62, "secured": false, "channel": 11 }
  ]
}
```

#### POST /network-connect.sh
```json
// Request
{
  "ssid": "Venue-WiFi",
  "password": "secret123"
}

// Response
{
  "success": true,
  "ip": "10.0.0.45",
  "gateway": "10.0.0.1"
}
```

#### POST /setup-complete.sh
```json
// Request
{
  "admin_password": "newpassword",
  "haha_mode": "ethernet",  // or "wifi"
  "venue_type": "gym",
  "location_name": "Downtown Fitness"
}

// Response
{
  "success": true,
  "router_id": "ekstra-abc123"
}
```

---

## Cloud Backend (api.ekstra.ai)

### Telemetry Upload (Every 5 Minutes)

```
POST https://api.ekstra.ai/v1/telemetry

{
  "router_id": "ekstra-abc123",
  "timestamp": "2026-01-28T15:00:00Z",
  "health": {
    "uptime_seconds": 86400,
    "wan_connected": true,
    "wan_ip": "203.0.113.45",
    "signal_strength": -58,
    "haha_connected": true,
    "haha_mode": "ethernet"
  },
  "analytics": {
    "unique_devices_5min": 34,
    "avg_rssi": -62,
    "device_vendors": {
      "apple": 18,
      "samsung": 9,
      "google": 4,
      "other": 3
    },
    "probe_count": 892
  },
  "location": {
    "venue_type": "gym",
    "name": "Downtown Fitness",
    "ip_geolocation": {
      "lat": 40.7128,
      "lon": -74.0060,
      "city": "New York",
      "country": "US"
    }
  }
}
```

---

## User Journey (8 Steps)

| Step | Action | Time | Automation |
|------|--------|------|------------|
| 1 | Unbox & power on router | 30s | N/A |
| 2 | Download & run onboarding app | 1m | App auto-detects router |
| 3 | Click "Install Ekstra Firmware" | 2-3m | Fully automated |
| 4 | Click "Open Dashboard" | 5s | Opens browser |
| 5 | Create admin password | 30s | Wizard step 1 |
| 6 | Connect to venue WiFi | 1m | Scan + select + auth |
| 7 | Connect HaHa (ETH or WiFi) | 1m | Plug cable or select mode |
| 8 | Configure HaHa touchscreen | 2m | Manual (unchanged) |

**Total: ~10 minutes** (vs. 30-60 minutes with TP-Link manual process)

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Create GitHub repo with structure
- [ ] Set up onboarding app skeleton (Electron)
- [ ] Create mock router API for testing
- [ ] Design state machine for setup flow

### Phase 2: Onboarding App (Week 2)
- [ ] Implement router detection (HTTP-based)
- [ ] Implement firmware flashing via LuCI
- [ ] Create UI (4-step wizard)
- [ ] Test on stock GL.iNet router

### Phase 3: Firmware Packages (Week 3-4)
- [ ] ekstra-core (API endpoints)
- [ ] ekstra-dashboard (setup wizard UI)
- [ ] ekstra-watchdog (health monitoring)
- [ ] ekstra-captive (portal handling)

### Phase 4: Analytics (Week 5)
- [ ] ekstra-sniffer (monitor mode)
- [ ] ekstra-agent (cloud uploader)
- [ ] Cloud backend integration

### Phase 5: Integration & Testing (Week 6)
- [ ] End-to-end testing
- [ ] HaHa connection testing (ETH + WiFi)
- [ ] Field testing at real venue

### Phase 6: Production (Week 7+)
- [ ] Build Windows/Mac installers
- [ ] Documentation for Vend Guys
- [ ] Customer support materials

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Onboarding App | Electron + Node.js |
| Firmware Base | OpenWrt 23.05.x |
| Firmware Packages | Shell scripts + Lua |
| Dashboard | React (lightweight) or vanilla JS |
| Cloud Backend | Your existing api.ekstra.ai |
| Build System | OpenWrt SDK + ImageBuilder |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Git
- WSL2 (for firmware building)
- GL.iNet router (for testing)

### Quick Start
```bash
# Clone repo
git clone https://github.com/ekstra-ai/ekstra-router.git
cd ekstra-router

# Start onboarding app development
cd onboarding-app
npm install
npm run dev

# Run mock router API (for testing without hardware)
cd ../scripts
node mock-router-api.js
```

---

## Success Criteria

1. **Operator can set up router in <15 minutes** (vs. 30-60 with TP-Link)
2. **Zero SSH required** - everything via HTTP
3. **Self-healing connectivity** - auto-reconnect, captive portal handling
4. **Location analytics flowing** - device counts to api.ekstra.ai
5. **HaHa stays connected** - both Ethernet and WiFi modes work
6. **Remote management** - OTA updates, fleet visibility

---

## Notes

- Firmware binaries (.bin files) are NOT committed to git
- They are downloaded during build or from CDN
- manifest.json contains SHA256 hashes for verification
- Privacy: MAC addresses are hashed before storage/upload
