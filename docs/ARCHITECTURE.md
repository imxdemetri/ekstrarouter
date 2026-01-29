# Ekstra AI Router - Architecture

## System Overview

The Ekstra AI Router solution consists of three main components:

1. **Onboarding App** - Desktop application for initial setup
2. **Custom Firmware** - OpenWrt-based firmware with Ekstra packages
3. **Cloud Backend** - api.ekstra.ai for telemetry and management

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  OPERATOR                    ROUTER                      CLOUD           │
│  ────────                    ──────                      ─────           │
│                                                                          │
│  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐ │
│  │  Onboarding  │──flash───▶│    Ekstra    │──upload──▶│ api.ekstra   │ │
│  │     App      │           │   Firmware   │           │    .ai       │ │
│  │  (Electron)  │◀──api────▶│   (OpenWrt)  │◀──ota─────│              │ │
│  └──────────────┘           └──────┬───────┘           └──────────────┘ │
│                                    │                                     │
│                         ┌──────────┼──────────┐                          │
│                         │          │          │                          │
│                    ┌────▼────┐ ┌───▼───┐ ┌────▼────┐                    │
│                    │ Radio 1 │ │ LAN   │ │ Radio 2 │                    │
│                    │  5GHz   │ │ Ports │ │ 2.4GHz  │                    │
│                    │ Connect │ │       │ │ Monitor │                    │
│                    └────┬────┘ └───┬───┘ └────┬────┘                    │
│                         │         │           │                          │
│                         ▼         ▼           ▼                          │
│                    ┌─────────┐ ┌─────┐   ┌─────────┐                    │
│                    │  Venue  │ │HaHa │   │Analytics│                    │
│                    │  WiFi   │ │ ETH │   │ Data    │                    │
│                    └─────────┘ └─────┘   └─────────┘                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Onboarding App

### Purpose
Desktop application that operators download to set up their GL.iNet router with Ekstra firmware.

### Technology
- **Framework**: Electron
- **Language**: JavaScript/Node.js
- **Target Platforms**: Windows, macOS, Linux

### Architecture

```
onboarding-app/
├── src/
│   ├── main/                 # Main process (Node.js)
│   │   ├── index.js          # Entry point, window creation
│   │   ├── state-machine.js  # Setup flow state management
│   │   ├── router-detector.js# Find router on network
│   │   ├── router-flasher.js # Upload firmware via HTTP
│   │   └── ipc-handlers.js   # Handle renderer requests
│   │
│   ├── renderer/             # Renderer process (Browser)
│   │   ├── index.html        # UI markup
│   │   ├── styles.css        # Styling
│   │   └── app.js            # UI logic
│   │
│   └── preload.js            # Secure IPC bridge
```

### State Machine

```
         ┌──────────────────────────────────────────────┐
         │              SETUP STATE MACHINE             │
         └──────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │    DETECT      │ Find router at gateway IP
                     └───────┬────────┘
                             │ success
                             ▼
                     ┌────────────────┐
                     │   IDENTIFY     │ Check if stock or Ekstra
                     └───────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │ stock                       │ ekstra
              ▼                             ▼
      ┌────────────────┐            ┌────────────────┐
      │     FLASH      │            │  OPEN DASH     │
      │   (upload fw)  │            │  (skip flash)  │
      └───────┬────────┘            └───────┬────────┘
              │                             │
              ▼                             │
      ┌────────────────┐                    │
      │    REBOOT      │                    │
      │  (wait 2-3min) │                    │
      └───────┬────────┘                    │
              │                             │
              ▼                             │
      ┌────────────────┐                    │
      │    VERIFY      │◀───────────────────┘
      │ (check :8080)  │
      └───────┬────────┘
              │
              ▼
      ┌────────────────┐
      │   COMPLETE     │ Open browser to dashboard
      └────────────────┘
```

### Key Design Decisions

1. **HTTP-First**: Uses HTTP/LuCI for flashing, not SSH (SSH disabled by default on GL.iNet)
2. **No Authentication Required**: Stock routers in first-run mode allow unauthenticated firmware uploads
3. **Minimal Dependencies**: Only axios for HTTP requests

---

## Custom Firmware

### Base
- **OS**: OpenWrt 23.05.x (stable)
- **Target**: mediatek/filogic (MT3000, X3000, XE3000) or qualcommax/ipq50xx (B3000)

### Package Structure

```
firmware/packages/
├── ekstra-core/          # Core system + REST API
├── ekstra-captive/       # Captive portal handling
├── ekstra-watchdog/      # Health monitoring & auto-recovery
├── ekstra-sniffer/       # WiFi monitor mode for analytics
├── ekstra-agent/         # Cloud telemetry uploader
└── ekstra-dashboard/     # Web UI
```

### Package Details

#### ekstra-core
```
Provides: REST API on port 8080
Endpoints:
  GET  /status.sh          - Router status
  POST /auth.sh            - Pairing token
  GET  /network-scan.sh    - Scan WiFi
  POST /network-connect.sh - Connect to WiFi
  POST /setup-complete.sh  - Finalize setup
  GET  /wan-status.sh      - Internet status

Dependencies: uhttpd, uhttpd-mod-lua, jq
```

#### ekstra-captive
```
Provides: Captive portal detection and auto-login
Features:
  - HTTP redirect detection
  - Common portal auto-login (hotel, gym, office)
  - Session keepalive heartbeat
  - Manual fallback notification

Dependencies: curl, ekstra-core
```

#### ekstra-watchdog
```
Provides: Connection monitoring and auto-recovery
Features:
  - Gateway/DNS/internet ping checks
  - Auto-reconnect with exponential backoff
  - Channel switching on interference
  - Automatic reboot on prolonged failure

Dependencies: ekstra-core
```

#### ekstra-sniffer
```
Provides: Passive WiFi monitoring for analytics
Features:
  - Monitor mode on Radio 2 (2.4GHz)
  - Probe request capture
  - MAC address hashing (privacy)
  - Device counting & RSSI measurement

Dependencies: tcpdump, iw, ekstra-core
```

#### ekstra-agent
```
Provides: Cloud telemetry uploader
Features:
  - 5-minute upload interval
  - Health metrics (uptime, signal, connectivity)
  - Analytics data (device counts, vendors)
  - OTA update checking

Dependencies: curl, jq, ekstra-core, ekstra-sniffer
```

#### ekstra-dashboard
```
Provides: Web-based management UI
Features:
  - Setup wizard (password, WiFi, HaHa mode)
  - Health overview
  - Alert management
  - Configuration

Stack: Lightweight JS (no heavy frameworks)
Dependencies: uhttpd, ekstra-core
```

---

## Dual-Radio Architecture

GL.iNet routers have two radios. We use them for different purposes:

```
┌─────────────────────────────────────────────────────────────────┐
│                    RADIO ALLOCATION                             │
├───────────────────────────┬─────────────────────────────────────┤
│       RADIO 1 (5GHz)      │         RADIO 2 (2.4GHz)           │
│       CONNECTIVITY        │         ANALYTICS                   │
├───────────────────────────┼─────────────────────────────────────┤
│                           │                                     │
│  Mode: STA (Client)       │  Mode: Monitor (Passive)           │
│        + AP (Optional)    │                                     │
│                           │                                     │
│  Purpose:                 │  Purpose:                           │
│  - Connect to venue WiFi  │  - Capture probe requests          │
│  - Bridge to HaHa (ETH)   │  - Count nearby devices            │
│  - Create HaHa AP (WiFi)  │  - Measure signal strength         │
│                           │                                     │
│  Why 5GHz:                │  Why 2.4GHz:                        │
│  - Faster speeds          │  - Longer range                     │
│  - Less interference      │  - More devices probe on 2.4       │
│  - Better for backhaul    │  - Better penetration              │
│                           │                                     │
└───────────────────────────┴─────────────────────────────────────┘
```

---

## Cloud Backend (api.ekstra.ai)

### Telemetry Endpoint

```
POST /v1/telemetry
Authorization: Bearer <router-token>

{
  "router_id": "ekstra-abc123",
  "timestamp": "2026-01-28T15:00:00Z",
  "health": {
    "uptime_seconds": 86400,
    "wan_connected": true,
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
      "other": 7
    }
  }
}
```

### OTA Update Endpoint

```
GET /v1/firmware/check?router_id=ekstra-abc123&current_version=1.0.0

Response:
{
  "update_available": true,
  "version": "1.1.0",
  "url": "https://cdn.ekstra.ai/firmware/1.1.0/gl-mt3000.bin",
  "sha256": "abc123...",
  "release_notes": "Bug fixes and improvements"
}
```

---

## Security Model

### Privacy
- **MAC addresses are hashed** before storage using SHA-256 with daily rotating salt
- Raw MAC addresses never leave the router
- Hashed MACs enable counting unique/returning devices without PII

### Authentication
- Pairing token generated during setup
- Token stored on router, sent with each API call
- Admin password hashed with SHA-512 on router

### Firmware Integrity
- SHA-256 hashes in manifest.json
- Verified before flashing
- OTA updates are signed

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                      │
└─────────────────────────────────────────────────────────────────────────┘

1. SETUP FLOW
   ───────────
   App ──detect──▶ Router (stock)
   App ──flash───▶ Router (installs Ekstra firmware)
   App ──verify──▶ Router:8080/status.sh
   App ──open────▶ Browser → Router Dashboard
   User ─wizard──▶ Router (password, WiFi, HaHa mode)
   Router ───────▶ api.ekstra.ai (register + first telemetry)


2. OPERATIONAL FLOW
   ─────────────────
   Every 5 minutes:
   
   ┌─────────────┐    probes     ┌─────────────┐
   │  Nearby     │──────────────▶│  Radio 2    │
   │  Devices    │               │  (Monitor)  │
   └─────────────┘               └──────┬──────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  ekstra-    │
                                 │  sniffer    │
                                 └──────┬──────┘
                                        │ aggregate
                                        ▼
                                 ┌─────────────┐
                                 │  ekstra-    │
                                 │  agent      │
                                 └──────┬──────┘
                                        │ upload
                                        ▼
                                 ┌─────────────┐
                                 │ api.ekstra  │
                                 │    .ai      │
                                 └─────────────┘


3. RECOVERY FLOW
   ──────────────
   ┌─────────────┐    lost     ┌─────────────┐
   │  Venue      │─────────────│  ekstra-    │
   │  WiFi       │             │  watchdog   │
   └─────────────┘             └──────┬──────┘
                                      │ detect
                                      ▼
                               ┌─────────────┐
                               │  Reconnect  │
                               │  (backoff)  │
                               └──────┬──────┘
                                      │ if captive
                                      ▼
                               ┌─────────────┐
                               │  ekstra-    │
                               │  captive    │
                               └──────┬──────┘
                                      │ auto-login
                                      ▼
                               ┌─────────────┐
                               │  Connected  │
                               └─────────────┘
```
