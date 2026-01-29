# Ekstra AI Router - Validation Checklist

## Purpose

This checklist ensures all features work correctly before each release. Run through these tests systematically to validate the implementation.

---

## Pre-Release Validation

### Setup & Onboarding

#### ✅ Setup Time Validation
- [ ] **Test**: Complete full setup flow from unbox to operational
- [ ] **Measure**: Time from power-on to dashboard showing "Setup Complete"
- [ ] **Target**: <15 minutes for 90%+ of test users
- [ ] **Notes**: Record time for each test run

#### ✅ Onboarding App - Router Detection
- [ ] **Test**: Run onboarding app, verify it detects router at gateway IP
- [ ] **Verify**: Detection works for common IPs (192.168.8.1, 192.168.1.1, 10.0.0.1)
- [ ] **Verify**: Router model correctly identified (B3000, MT3000, X3000, XE3000)
- [ ] **Verify**: Stock vs Ekstra firmware correctly detected
- [ ] **Error Handling**: App shows clear error if router not found

#### ✅ Onboarding App - Firmware Flash
- [ ] **Test**: Flash firmware via onboarding app
- [ ] **Verify**: Progress bar updates during upload
- [ ] **Verify**: Router reboots automatically after flash
- [ ] **Verify**: App waits for reboot (2-3 minutes) without timeout
- [ ] **Verify**: App detects Ekstra firmware after reboot
- [ ] **Error Handling**: Clear error message if flash fails

#### ✅ Cross-Platform Testing
- [ ] **Windows**: Onboarding app works on Windows 10/11
- [ ] **macOS**: Onboarding app works on macOS 12+
- [ ] **Linux**: Onboarding app works on Ubuntu 20.04+

---

### Core Functionality

#### ✅ ekstra-core API Endpoints
- [ ] **GET /status.sh**: Returns router status, model, firmware version
- [ ] **POST /auth.sh**: Generates pairing token successfully
- [ ] **GET /network-scan.sh**: Scans and returns WiFi networks
- [ ] **POST /network-connect.sh**: Connects to venue WiFi
- [ ] **GET /wan-status.sh**: Returns internet connectivity status
- [ ] **POST /setup-complete.sh**: Finalizes setup, generates router_id
- [ ] **Verify**: All endpoints return valid JSON
- [ ] **Verify**: Error responses include clear error messages

#### ✅ Subnet Detection & Conflict Prevention
- [ ] **Test**: Connect router to venue with 192.168.1.0/24 network
- [ ] **Verify**: Router selects non-conflicting subnet (e.g., 192.168.8.0/24)
- [ ] **Test**: Connect router to venue with 192.168.8.0/24 network
- [ ] **Verify**: Router selects fallback subnet (e.g., 192.168.100.0/24)
- [ ] **Test**: Connect router to venue with 10.0.0.0/24 network
- [ ] **Verify**: Router selects appropriate subnet
- [ ] **Verify**: No routing conflicts in 95%+ of test scenarios
- [ ] **Verify**: HaHa devices get IPs on isolated subnet

#### ✅ DHCP Configuration
- [ ] **Verify**: DHCP server running on selected subnet
- [ ] **Verify**: HaHa device receives IP via DHCP
- [ ] **Verify**: IP reservation works (HaHa gets consistent IP)

---

### Auto-Recovery & Watchdog

#### ✅ Basic Reconnect (Priority 1)
- [ ] **Test**: Disconnect WiFi from router
- [ ] **Verify**: Router detects disconnection within 30 seconds
- [ ] **Verify**: Router attempts reconnect with exponential backoff
- [ ] **Verify**: Reconnection succeeds within 2 minutes (90%+ of tests)
- [ ] **Verify**: No infinite reconnect loops (max 10 attempts)
- [ ] **Verify**: Recovery attempts logged with timestamps

#### ✅ Connection Monitoring
- [ ] **Test**: Router pings gateway every 30 seconds
- [ ] **Test**: Router checks DNS (8.8.8.8) connectivity
- [ ] **Test**: Router checks internet (google.com or api.ekstra.ai)
- [ ] **Verify**: Monitoring continues during normal operation

#### ✅ Channel Switching (Priority 2)
- [ ] **Test**: Introduce interference on current channel
- [ ] **Verify**: Router detects interference (>50% packet loss)
- [ ] **Verify**: Router switches to less congested channel
- [ ] **Verify**: Connection remains stable after switch
- [ ] **Verify**: Alert generated when RSSI < -75 dBm for >5 minutes

---

### Captive Portal Handling (Priority 2)

#### ✅ Portal Detection
- [ ] **Test**: Connect to network with captive portal
- [ ] **Verify**: Router detects portal within 30 seconds (HTTP redirect check)
- [ ] **Verify**: Detection works for common portal types

#### ✅ Auto-Login
- [ ] **Test**: Hotel portal (Marriott, Hilton, Holiday Inn)
- [ ] **Test**: Gym portal (24 Hour Fitness, Planet Fitness)
- [ ] **Test**: Coffee shop portal (Starbucks, etc.)
- [ ] **Test**: Generic portal (form detection + auto-submit)
- [ ] **Verify**: Auto-login succeeds for top 10 common portal types
- [ ] **Verify**: Manual fallback alert shown if auto-login fails

#### ✅ Session Keepalive
- [ ] **Test**: Portal session expires after 8-24 hours
- [ ] **Verify**: Router sends heartbeat every 5 minutes
- [ ] **Verify**: Session keepalive prevents 80%+ of timeout disconnections
- [ ] **Verify**: Router re-authenticates automatically on session expiry

---

### Health Telemetry

#### ✅ ekstra-agent Data Collection
- [ ] **Verify**: Health metrics collected every 5 minutes:
  - Uptime (seconds)
  - WAN connected (boolean)
  - WAN IP address
  - Signal strength (RSSI) if WiFi
  - HaHa connected (boolean)
  - HaHa mode (ethernet/wifi)
  - CPU usage (%)
  - Memory free (MB)
- [ ] **Verify**: Data format matches API specification

#### ✅ Telemetry Upload
- [ ] **Test**: Router uploads telemetry to `https://api.ekstra.ai/v1/telemetry`
- [ ] **Verify**: Upload happens every 5 minutes reliably
- [ ] **Verify**: Router_id and pairing token included in payload
- [ ] **Test**: Network failure during upload
- [ ] **Verify**: Retry logic works (3 attempts with backoff)
- [ ] **Verify**: Upload failures logged (don't crash agent)

#### ✅ Router Registration
- [ ] **Test**: Router registers with cloud on first setup
- [ ] **Verify**: Router_id persists across reboots
- [ ] **Verify**: Pairing token stored securely

---

### Dashboard & UI

#### ✅ Setup Wizard (Priority 2)
- [ ] **Test**: Complete setup wizard (3 steps)
- [ ] **Step 1**: Create admin password (8+ characters)
- [ ] **Step 2**: Connect to venue WiFi (scan + select + password)
- [ ] **Step 3**: Choose HaHa connection mode (Ethernet/WiFi)
- [ ] **Verify**: Wizard completes in <5 minutes
- [ ] **Verify**: Clear error messages with recovery actions

#### ✅ Health Dashboard
- [ ] **Verify**: Connection status displayed (green/yellow/red)
- [ ] **Verify**: Signal strength indicator accurate
- [ ] **Verify**: Uptime display correct
- [ ] **Verify**: HaHa connection status accurate
- [ ] **Verify**: Subnet configuration displayed
- [ ] **Verify**: Dashboard shows accurate real-time status

#### ✅ Responsive Design
- [ ] **Test**: Dashboard on desktop browser (Chrome, Firefox, Safari)
- [ ] **Test**: Dashboard on mobile browser (iOS Safari, Chrome Mobile)
- [ ] **Verify**: UI is responsive and usable on mobile

#### ✅ Advanced Dashboard (Priority 3)
- [ ] **Verify**: Alerts displayed prominently
- [ ] **Verify**: Connection history shows last 24 hours
- [ ] **Verify**: Recovery log shows disconnections and recoveries
- [ ] **Verify**: Historical uptime graphs render (7/30/90 days)
- [ ] **Verify**: Analytics preview shows device counts

---

### Analytics & Sniffer (Priority 3)

#### ✅ Monitor Mode
- [ ] **Test**: Radio 2 (2.4GHz) in monitor mode
- [ ] **Verify**: Monitor mode enabled successfully
- [ ] **Verify**: Radio 1 (5GHz) remains in STA/AP mode for connectivity

#### ✅ Probe Request Capture
- [ ] **Test**: Nearby devices send probe requests
- [ ] **Verify**: tcpdump captures probe requests
- [ ] **Verify**: MAC addresses extracted from probes

#### ✅ MAC Address Hashing
- [ ] **Verify**: MAC addresses hashed with SHA-256 before storage
- [ ] **Verify**: Daily rotating salt used for hashing
- [ ] **Verify**: Raw MAC addresses never stored or uploaded
- [ ] **Verify**: No PII leaked in analytics data

#### ✅ Device Counting
- [ ] **Test**: Multiple devices nearby
- [ ] **Verify**: Unique device count accurate (±10%)
- [ ] **Verify**: Counts aggregated every 5 minutes
- [ ] **Verify**: RSSI measured per device

#### ✅ Vendor Detection
- [ ] **Verify**: Vendor detection works (OUI lookup)
- [ ] **Verify**: Vendor breakdown accurate (Apple, Samsung, Google, etc.)

#### ✅ Analytics Upload
- [ ] **Verify**: Analytics data included in telemetry upload
- [ ] **Verify**: Data format matches API specification
- [ ] **Verify**: Device counts flowing to cloud

---

### Security

#### ✅ Password Security
- [ ] **Verify**: Admin passwords hashed with SHA-512
- [ ] **Verify**: Passwords never stored in plaintext
- [ ] **Verify**: Password requirements enforced (8+ characters)

#### ✅ Firmware Integrity
- [ ] **Verify**: Firmware verified with SHA-256 before flashing
- [ ] **Verify**: manifest.json contains correct hashes
- [ ] **Verify**: Onboarding app verifies hash before flash

#### ✅ MAC Address Privacy
- [ ] **Verify**: MAC addresses hashed before storage
- [ ] **Verify**: Raw MAC addresses never uploaded to cloud
- [ ] **Verify**: Daily rotating salt prevents tracking

#### ✅ API Security
- [ ] **Verify**: Pairing token required for telemetry uploads
- [ ] **Verify**: API endpoints validate input
- [ ] **Verify**: No command injection vulnerabilities

---

### OTA Updates (Priority 4)

#### ✅ Update Check
- [ ] **Test**: Router checks for updates from `https://api.ekstra.ai/v1/firmware/check`
- [ ] **Verify**: Check happens periodically (daily or on boot)
- [ ] **Verify**: Current version compared correctly

#### ✅ Update Download
- [ ] **Test**: Download firmware update
- [ ] **Verify**: SHA-256 hash verified before installation
- [ ] **Verify**: Download progress tracked

#### ✅ Update Installation
- [ ] **Test**: Install firmware update via sysupgrade
- [ ] **Verify**: Update installs successfully
- [ ] **Verify**: Router reboots after update
- [ ] **Verify**: New firmware version active after reboot

#### ✅ Rollback
- [ ] **Test**: Update fails (corrupt file or hash mismatch)
- [ ] **Verify**: Rollback to previous firmware works
- [ ] **Verify**: No bricked devices from OTA

---

### Integration Testing

#### ✅ End-to-End Setup Flow
- [ ] **Test**: Complete flow from unbox to operational
  1. Power on router
  2. Run onboarding app
  3. Flash firmware
  4. Complete setup wizard
  5. Connect HaHa machine
  6. Verify telemetry flowing
- [ ] **Verify**: All steps complete successfully
- [ ] **Measure**: Total time <15 minutes

#### ✅ HaHa Connection Modes
- [ ] **Test**: Ethernet mode (plug cable to LAN port)
- [ ] **Verify**: HaHa receives IP via DHCP
- [ ] **Verify**: HaHa can reach internet
- [ ] **Test**: WiFi mode (HaHa connects to router AP)
- [ ] **Verify**: Router creates dedicated AP (ekstra-haha-XX)
- [ ] **Verify**: HaHa connects to AP successfully
- [ ] **Verify**: HaHa can reach internet via WiFi

#### ✅ Venue Network Compatibility
- [ ] **Test**: Various venue network types:
  - 192.168.1.0/24 (common home/office)
  - 192.168.0.0/24 (common home)
  - 10.0.0.0/24 (enterprise)
  - 172.16.0.0/24 (enterprise)
- [ ] **Verify**: No subnet conflicts
- [ ] **Verify**: Router connects successfully
- [ ] **Verify**: HaHa remains accessible

---

### Performance & Reliability

#### ✅ Uptime & Stability
- [ ] **Test**: Router runs for 7 days continuously
- [ ] **Verify**: No memory leaks
- [ ] **Verify**: CPU usage reasonable (<50% average)
- [ ] **Verify**: Telemetry uploads continue reliably

#### ✅ Recovery from Failures
- [ ] **Test**: Power cycle router
- [ ] **Verify**: Router boots and reconnects automatically
- [ ] **Test**: Network cable unplugged
- [ ] **Verify**: Router detects and recovers when cable reconnected
- [ ] **Test**: WiFi password changed on venue network
- [ ] **Verify**: Router detects disconnection and alerts operator

---

## Release Readiness Criteria

Before marking a release as ready:

- [ ] All Priority 1 (MVP) items validated ✅
- [ ] All Priority 2 items validated (if included in release) ✅
- [ ] All Priority 3 items validated (if included in release) ✅
- [ ] Security checklist complete ✅
- [ ] Integration tests pass ✅
- [ ] Performance tests pass ✅
- [ ] Documentation updated ✅

---

## Test Environment Setup

### Required Hardware
- [ ] Stock GL.iNet router (B3000, MT3000, X3000, or XE3000)
- [ ] HaHa vending machine (or simulator)
- [ ] Test venue with WiFi network
- [ ] Test venue with captive portal (or portal simulator)

### Required Software
- [ ] Onboarding app (Windows/macOS/Linux)
- [ ] Mock router API (for development testing)
- [ ] Cloud backend (api.ekstra.ai) or mock server
- [ ] Network analyzer (Wireshark, etc.)

### Test Scenarios
- [ ] Document test scenarios in `docs/TEST_SCENARIOS.md`
- [ ] Create test data sets (WiFi networks, portal types, etc.)
- [ ] Set up automated tests where possible

---

## Notes

- Run validation tests on **real hardware** before release
- Test with **multiple router models** (B3000, MT3000, X3000, XE3000)
- Test with **various venue network configurations**
- Document any **known issues** or **limitations**
- Update this checklist as features are added or changed
