# Ekstra AI Router - Implementation Plan

## Overview

This document outlines the phased implementation plan based on priority levels. Each phase builds on the previous one, ensuring we deliver a working MVP first, then add high-value features, differentiators, and polish.

---

## PRIORITY 1 - MVP (Must Ship)

**Goal**: Ship a working router that operators can set up in <15 minutes and that maintains basic connectivity.

### Components

#### 1. Onboarding App
**Status**: Not Started  
**Location**: `onboarding-app/`

**Features**:
- [ ] Auto-detect router at gateway IP (192.168.8.1, 192.168.1.1, etc.)
- [ ] Identify router model (GL-B3000, GL-MT3000, GL-X3000, GL-XE3000)
- [ ] Check if stock GL.iNet or already has Ekstra firmware
- [ ] One-click firmware flash via HTTP/LuCI
- [ ] Progress bar during upload
- [ ] Wait for router reboot (2-3 minutes)
- [ ] Verify Ekstra firmware installed (poll :8080/status.sh)
- [ ] Open browser to router dashboard
- [ ] 4-step UI wizard (detect → flash → verify → complete)

**Acceptance Criteria**:
- [ ] Detects router within 10 seconds
- [ ] Firmware flash completes successfully
- [ ] Works on Windows, macOS, Linux
- [ ] Clear error messages if router not found or flash fails

**Dependencies**: None (standalone Electron app)

---

#### 2. ekstra-core
**Status**: Not Started  
**Location**: `firmware/packages/ekstra-core/`

**Features**:
- [ ] REST API on port 8080 (uhttpd + Lua)
- [ ] `/status.sh` - Router status, model, firmware version
- [ ] `/auth.sh` - Pairing token generation
- [ ] `/network-scan.sh` - Scan available WiFi networks
- [ ] `/network-connect.sh` - Connect to venue WiFi
- [ ] `/setup-complete.sh` - Finalize setup, generate router_id
- [ ] `/wan-status.sh` - Internet connectivity check
- [ ] **Subnet detection** - Detect venue network subnet to avoid conflicts
- [ ] **Dynamic subnet selection** - Choose non-conflicting subnet (192.168.8.0/24, 192.168.100.0/24, 10.10.10.0/24)
- [ ] DHCP server configuration on selected subnet
- [ ] VLAN isolation for HaHa traffic

**Subnet Detection Logic**:
```
1. Get WAN IP and gateway
2. Determine venue subnet (e.g., 192.168.1.0/24)
3. Check if common Ekstra subnets conflict:
   - 192.168.8.0/24 (default)
   - 192.168.100.0/24 (fallback 1)
   - 10.10.10.0/24 (fallback 2)
4. Select first non-conflicting range
5. Configure DHCP server
6. Log selected subnet for dashboard display
```

**Acceptance Criteria**:
- [ ] API responds to all endpoints
- [ ] Subnet detection works for common ranges (192.168.x.x, 10.x.x.x)
- [ ] No subnet conflicts in 95%+ of deployments
- [ ] HaHa devices get IPs on isolated subnet

**Dependencies**: OpenWrt base, uhttpd, uhttpd-mod-lua, jq

---

#### 3. ekstra-watchdog (Basic Reconnect)
**Status**: Not Started  
**Location**: `firmware/packages/ekstra-watchdog/`

**Features**:
- [ ] Connection monitoring (ping gateway every 30 seconds)
- [ ] DNS check (ping 8.8.8.8)
- [ ] Internet check (ping google.com or api.ekstra.ai)
- [ ] Auto-reconnect on failure (exponential backoff)
- [ ] Log reconnection attempts
- [ ] Basic recovery flow:
  ```
  Connection Lost → Wait 5s → Reconnect (try 1)
  → Wait 10s → Reconnect (try 2)
  → Wait 30s → Reconnect (try 3)
  → Wait 60s → Reconnect (try 4)
  → Full service restart
  ```

**Acceptance Criteria**:
- [ ] 90%+ of disconnections recovered within 2 minutes
- [ ] No infinite reconnect loops (max 10 attempts)
- [ ] Recovery attempts logged with timestamps
- [ ] Works for both WiFi STA and Ethernet WAN

**Dependencies**: ekstra-core, ping, wpa_supplicant

---

#### 4. ekstra-agent (Health Telemetry)
**Status**: Not Started  
**Location**: `firmware/packages/ekstra-agent/`

**Features**:
- [ ] Collect health metrics every 5 minutes:
  - Uptime (seconds)
  - WAN connected (boolean)
  - WAN IP address
  - Signal strength (RSSI) if WiFi
  - HaHa connected (boolean)
  - HaHa mode (ethernet/wifi)
  - CPU usage (%)
  - Memory free (MB)
- [ ] Upload to `https://api.ekstra.ai/v1/telemetry`
- [ ] Include router_id and pairing token
- [ ] Retry logic (3 attempts with backoff)
- [ ] Log upload failures

**Telemetry Payload**:
```json
{
  "router_id": "ekstra-abc123",
  "timestamp": "2026-01-28T15:00:00Z",
  "health": {
    "uptime_seconds": 86400,
    "wan_connected": true,
    "wan_ip": "203.0.113.45",
    "signal_strength": -58,
    "haha_connected": true,
    "haha_mode": "ethernet",
    "cpu_usage": 12,
    "memory_free_mb": 45
  }
}
```

**Acceptance Criteria**:
- [ ] Telemetry uploaded every 5 minutes reliably
- [ ] Data format matches API specification
- [ ] Handles network failures gracefully (retry, don't crash)
- [ ] Router_id persists across reboots

**Dependencies**: ekstra-core, curl, jq

---

## PRIORITY 2 - High Value

**Goal**: Add features that significantly reduce support burden and improve reliability.

### Components

#### 5. ekstra-captive (Portal Auto-Login)
**Status**: Not Started  
**Location**: `firmware/packages/ekstra-captive/`

**Features**:
- [ ] Captive portal detection (HTTP redirect check)
- [ ] Auto-login scripts for common portals:
  - Hotel chains (Marriott, Hilton, Holiday Inn)
  - Gyms (24 Hour Fitness, Planet Fitness)
  - Coffee shops (Starbucks, etc.)
  - Generic portal (form detection + auto-submit)
- [ ] Session keepalive (heartbeat every 5 minutes)
- [ ] Re-authentication on session expiry
- [ ] Manual fallback notification (dashboard alert)

**Acceptance Criteria**:
- [ ] Auto-detects portal within 30 seconds
- [ ] Auto-login succeeds for top 10 common portal types
- [ ] Session keepalive prevents 80%+ of timeout disconnections
- [ ] Dashboard shows "Portal login required" alert when manual intervention needed

**Dependencies**: ekstra-core, curl, ekstra-watchdog

---

#### 6. ekstra-dashboard (Setup Wizard + Health UI)
**Status**: Not Started  
**Location**: `firmware/packages/ekstra-dashboard/`

**Features**:
- [ ] Setup wizard (3 steps):
  1. Create admin password
  2. Connect to venue WiFi (scan + select + password)
  3. Choose HaHa connection mode (Ethernet/WiFi)
- [ ] Health overview dashboard:
  - Connection status (green/yellow/red)
  - Signal strength indicator
  - Uptime display
  - HaHa connection status
- [ ] Subnet configuration display
- [ ] Basic alerts (signal weak, disconnected, etc.)

**Acceptance Criteria**:
- [ ] Setup wizard completes in <5 minutes
- [ ] Dashboard shows accurate real-time status
- [ ] Works on mobile browsers (responsive)
- [ ] Clear error messages with recovery actions

**Dependencies**: ekstra-core, uhttpd

---

#### 7. ekstra-watchdog (Channel Switching)
**Status**: Not Started (Enhancement to Priority 1 watchdog)

**Features**:
- [ ] Channel analysis (detect interference)
- [ ] Auto channel switch when interference detected (>50% packet loss)
- [ ] Signal quality alerts (RSSI < -75 dBm for >5 minutes)
- [ ] Band switching (5GHz ↔ 2.4GHz) if needed

**Acceptance Criteria**:
- [ ] Auto channel switch when interference detected
- [ ] Alert generated when RSSI drops below -75 dBm for >5 minutes
- [ ] Operator can manually select preferred band via dashboard

**Dependencies**: ekstra-watchdog (Priority 1), iw, wpa_supplicant

---

## PRIORITY 3 - Differentiator

**Goal**: Features that make Ekstra Router unique and provide value to Ekstra AI.

### Components

#### 8. ekstra-sniffer (Monitor Mode Analytics)
**Status**: Not Started  
**Location**: `firmware/packages/ekstra-sniffer/`

**Features**:
- [ ] Monitor mode on Radio 2 (2.4GHz)
- [ ] Probe request capture (tcpdump)
- [ ] MAC address hashing (SHA-256 with daily rotating salt)
- [ ] Device counting (unique devices per 5-minute window)
- [ ] RSSI measurement per device
- [ ] Vendor detection (OUI lookup)
- [ ] Data aggregation and storage

**Radio Setup**:
- Radio 1 (5GHz): STA mode (connectivity) + optional AP for HaHa WiFi
- Radio 2 (2.4GHz): Monitor mode (passive sniffing)

**Acceptance Criteria**:
- [ ] Monitor mode enabled on Radio 2
- [ ] Probe requests captured successfully
- [ ] MAC addresses hashed before storage (no PII)
- [ ] Device counts accurate (±10%)
- [ ] Data aggregated every 5 minutes

**Dependencies**: tcpdump, iw, ekstra-core

---

#### 9. Advanced Dashboard (Alerts + History)
**Status**: Not Started  
**Location**: `firmware/packages/ekstra-dashboard/` (enhancement)

**Features**:
- [ ] Alert management (connection drops, signal weak, portal issues)
- [ ] Connection history (last 24 hours)
- [ ] Recovery log (disconnections and recoveries)
- [ ] Historical uptime graphs (7/30/90 days)
- [ ] Analytics preview (device counts, peak hours)

**Acceptance Criteria**:
- [ ] Alerts displayed prominently
- [ ] History shows last 24 hours of events
- [ ] Graphs render correctly
- [ ] Data persists across reboots (or syncs from cloud)

**Dependencies**: ekstra-dashboard (Priority 2), ekstra-agent, ekstra-sniffer

---

## PRIORITY 4 - Polish

**Goal**: Production-ready features for scale and maintainability.

### Components

#### 10. OTA Updates
**Status**: Not Started  
**Location**: `firmware/packages/ekstra-agent/` (enhancement)

**Features**:
- [ ] Check for updates from `https://api.ekstra.ai/v1/firmware/check`
- [ ] Download firmware with SHA-256 verification
- [ ] Install update via sysupgrade
- [ ] Rollback on failure
- [ ] Scheduled updates (off-peak hours)

**Acceptance Criteria**:
- [ ] Updates download and install successfully
- [ ] SHA-256 verification prevents tampering
- [ ] Rollback works if update fails
- [ ] No bricked devices from OTA

**Dependencies**: ekstra-agent, sysupgrade, wget/curl

---

#### 11. Fleet Management
**Status**: Not Started  
**Location**: Cloud Backend (api.ekstra.ai)

**Features**:
- [ ] Fleet dashboard (view all routers)
- [ ] Router grouping (by operator, venue, location)
- [ ] Bulk operations (update multiple routers)
- [ ] Alert aggregation (fleet-wide issues)
- [ ] Analytics aggregation (location insights)

**Acceptance Criteria**:
- [ ] Dashboard shows all routers in fleet
- [ ] Bulk operations work reliably
- [ ] Alerts aggregated correctly
- [ ] Analytics data queryable

**Dependencies**: Cloud backend, ekstra-agent

---

## Implementation Timeline

### Phase 1: MVP (Weeks 1-3)
- Week 1: Onboarding App (detection + flash)
- Week 2: ekstra-core (API + subnet detection)
- Week 3: ekstra-watchdog (basic reconnect) + ekstra-agent (telemetry)

### Phase 2: High Value (Weeks 4-5)
- Week 4: ekstra-captive (portal handling)
- Week 5: ekstra-dashboard (wizard + health UI) + watchdog channel switching

### Phase 3: Differentiator (Week 6)
- Week 6: ekstra-sniffer (monitor mode) + advanced dashboard

### Phase 4: Polish (Week 7+)
- Week 7+: OTA updates + fleet management

---

## Success Metrics

### MVP (Priority 1)
- ✅ Setup time <15 minutes for 90%+ of users
- ✅ Auto-recovery works (disconnect WiFi → reconnect <2 min)
- ✅ No subnet conflicts with common networks
- ✅ Telemetry flowing to cloud every 5 minutes

### High Value (Priority 2)
- ✅ Captive portal tested with 3+ portal types
- ✅ Dashboard shows accurate real-time status
- ✅ Channel switching reduces interference

### Differentiator (Priority 3)
- ✅ Sniffer collecting device counts
- ✅ Analytics data flowing to cloud

### Polish (Priority 4)
- ✅ OTA updates work reliably
- ✅ Fleet management operational

---

## Dependencies & Prerequisites

### Development Environment
- Node.js 18+ (for onboarding app)
- Electron 28+
- WSL2 or Linux VM (for firmware building)
- OpenWrt SDK or ImageBuilder
- GL.iNet router for testing

### Cloud Backend
- `api.ekstra.ai` endpoints:
  - `POST /v1/telemetry` (health data)
  - `GET /v1/firmware/check` (OTA updates)
  - `POST /v1/routers/register` (initial registration)

### Testing Requirements
- Stock GL.iNet router (for onboarding app testing)
- Ekstra firmware image (for package testing)
- Mock API server (for development without hardware)
- Test venue with captive portal

---

## Notes

- **Firmware binaries (.bin)** are NOT committed to git
- They are downloaded during build or from CDN
- `manifest.json` contains SHA256 hashes for verification
- **Privacy**: MAC addresses are hashed before storage/upload
- **Security**: Passwords hashed with SHA-512, firmware verified with SHA-256
