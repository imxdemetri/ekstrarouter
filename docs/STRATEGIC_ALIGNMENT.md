# Ekstra AI Router - Strategic Alignment

## Purpose of This Document

This document ensures every **problem we're solving** and **enhancement we're delivering** is mapped to specific **components, features, and acceptance criteria** in the architecture.

---

## Problems We're Solving

### Problem 1: Captive Portal Re-Authentication

**Current Pain:**
> Stock TP-Link only handles initial portal login once. Sessions expire (8-24 hours in hotels/gyms/offices), causing drops with no auto-re-auth. Frequent manual intervention; payments/telemetry fail intermittently.

**Solution Components:**

| Component | Feature | How It Solves |
|-----------|---------|---------------|
| `ekstra-captive` | Portal detection | Detects HTTP redirects indicating captive portal |
| `ekstra-captive` | Auto-login scripts | Pre-configured scripts for common portals (hotel chains, gyms) |
| `ekstra-captive` | Session keepalive | Periodic heartbeat to maintain session |
| `ekstra-captive` | Re-auth on timeout | Detects session expiry, triggers re-authentication |
| `ekstra-dashboard` | Manual fallback alert | Notifies operator if auto-login fails |
| `ekstra-dashboard` | Portal credential storage | Securely stores portal login for re-use |

**Acceptance Criteria:**
- [ ] Router auto-detects captive portal within 30 seconds of connection
- [ ] Auto-login succeeds for top 10 common portal types
- [ ] Session keepalive prevents 80%+ of timeout disconnections
- [ ] Dashboard shows clear "Portal login required" alert when manual intervention needed
- [ ] Re-authentication happens automatically without operator action

---

### Problem 2: Weak / Unstable Venue WiFi Signal

**Current Pain:**
> No auto-optimization; drops from interference, congestion, or poor placement. HaHa metal enclosure already weakens built-in WiFi. Intermittent connectivity; support tickets spike in basements/concrete venues.

**Solution Components:**

| Component | Feature | How It Solves |
|-----------|---------|---------------|
| `ekstra-watchdog` | RSSI monitoring | Continuously monitors signal strength |
| `ekstra-watchdog` | Channel analysis | Detects interference on current channel |
| `ekstra-watchdog` | Auto channel switch | Switches to less congested channel |
| `ekstra-watchdog` | Signal quality alerts | Warns when signal drops below threshold |
| `ekstra-core` | Dual-band support | Can use 5GHz or 2.4GHz based on conditions |
| `ekstra-agent` | Signal telemetry | Reports signal strength to cloud for fleet analysis |

**Acceptance Criteria:**
- [ ] Signal strength reported every 5 minutes to cloud
- [ ] Auto channel switch when interference detected (>50% packet loss)
- [ ] Dashboard shows real-time signal quality indicator
- [ ] Alert generated when RSSI drops below -75 dBm for >5 minutes
- [ ] Operator can manually select preferred band via dashboard

---

### Problem 3: IP / DHCP Subnet Conflicts

**Current Pain:**
> Hardcoded LAN change to 192.168.199.1 + fixed DHCP range can overlap with venue networks. Routing glitches, unreachable devices, or setup failures.

**Solution Components:**

| Component | Feature | How It Solves |
|-----------|---------|---------------|
| `ekstra-core` | Subnet detection | Scans venue network to detect used subnets |
| `ekstra-core` | Dynamic subnet selection | Chooses non-conflicting subnet automatically |
| `ekstra-core` | VLAN isolation | Isolates HaHa traffic from venue network |
| `ekstra-dashboard` | Subnet configuration | Allows manual override if needed |
| `ekstra-dashboard` | Conflict warning | Alerts if potential conflict detected |

**Subnet Selection Logic:**
```
1. Detect venue network subnet (e.g., 192.168.1.0/24)
2. Check common ranges: 192.168.8.0/24, 192.168.100.0/24, 10.10.10.0/24
3. Select first non-conflicting range
4. Configure DHCP server on selected range
5. Bridge HaHa devices to this subnet
```

**Acceptance Criteria:**
- [ ] Router never assigns same subnet as venue network
- [ ] At least 3 fallback subnets available
- [ ] Setup wizard shows selected subnet and allows change
- [ ] HaHa devices always get consistent IP (DHCP reservation option)
- [ ] No routing conflicts in 95%+ of venue deployments

---

### Problem 4: Reboots / Drops & No Recovery

**Current Pain:**
> No watchdog or auto-reconnect; manual power cycle needed after drops. Downtime during peak hours; no proactive recovery.

**Solution Components:**

| Component | Feature | How It Solves |
|-----------|---------|---------------|
| `ekstra-watchdog` | Connection monitoring | Pings gateway, DNS, and internet continuously |
| `ekstra-watchdog` | Auto-reconnect | Reconnects WiFi with exponential backoff |
| `ekstra-watchdog` | Hardware watchdog | Reboots router if completely stuck |
| `ekstra-watchdog` | Service recovery | Restarts failed services automatically |
| `ekstra-agent` | Uptime tracking | Reports uptime to cloud for SLA monitoring |
| `ekstra-dashboard` | Recovery log | Shows history of disconnections and recoveries |

**Recovery Flow:**
```
Connection Lost
    │
    ▼
Wait 5 seconds
    │
    ▼
Attempt reconnect (try 1)
    │ fail
    ▼
Wait 10 seconds (backoff)
    │
    ▼
Attempt reconnect (try 2)
    │ fail
    ▼
Wait 30 seconds (backoff)
    │
    ▼
Attempt reconnect (try 3)
    │ fail
    ▼
Try alternate channel
    │ fail
    ▼
Try alternate band (2.4GHz ↔ 5GHz)
    │ fail
    ▼
Full service restart
    │ fail (after 10 minutes)
    ▼
Hardware reboot (watchdog)
```

**Acceptance Criteria:**
- [ ] 90%+ of disconnections recovered automatically within 2 minutes
- [ ] Hardware watchdog triggers reboot if no connectivity for 15 minutes
- [ ] All recovery attempts logged with timestamps
- [ ] Cloud dashboard shows fleet-wide uptime metrics
- [ ] No infinite reconnect loops (max 10 attempts then wait 5 minutes)

---

### Problem 5: Manual / Tedious Workflow

**Current Pain:**
> 20+ steps: physical switch, browser config, WiFi selection, advanced menus, HaHa touchscreen entry. Time-consuming for operators; high error rate; support burden on Vend Guys.

**Solution Components:**

| Component | Feature | How It Solves |
|-----------|---------|---------------|
| **Onboarding App** | Auto-detection | Finds router automatically at gateway IP |
| **Onboarding App** | One-click flash | Single button to install Ekstra firmware |
| **Onboarding App** | Progress feedback | Clear progress bar during flash |
| `ekstra-dashboard` | Setup wizard | 2-step wizard (password + WiFi) |
| `ekstra-core` | Auto-configuration | Safe defaults applied automatically |
| `ekstra-core` | HaHa mode selection | Simple Ethernet vs WiFi choice |

**Step Reduction:**

| Old Flow (TP-Link) | New Flow (Ekstra) |
|--------------------|-------------------|
| 1. Set mode switch | 1. Plug in router |
| 2. Power on | 2. Run onboarding app |
| 3. Connect to router WiFi | 3. Click "Install Firmware" |
| 4. Open browser to IP | 4. Click "Open Dashboard" |
| 5. Login to admin | 5. Set password |
| 6. Navigate to WiFi settings | 6. Connect to venue WiFi |
| 7. Select venue network | 7. Choose HaHa mode (ETH/WiFi) |
| 8. Enter password | 8. Connect HaHa |
| 9. Handle captive portal | — |
| 10. Change router mode | — |
| 11. Test connection | — |
| 12. Configure DHCP | — |
| 13-20. More steps... | — |
| **~20 steps, 30-60 min** | **~8 steps, 10-15 min** |

**Acceptance Criteria:**
- [ ] End-to-end setup in <15 minutes for 90%+ of users
- [ ] No command-line or advanced settings required
- [ ] Setup works on Windows, macOS, and Linux
- [ ] Clear error messages with recovery actions
- [ ] Setup can be completed by non-technical vending operators

---

### Problem 6: Limited Stability & Visibility

**Current Pain:**
> No real-time monitoring; manual firmware checks; no alerts for issues. Operators unaware of problems until HaHa goes offline.

**Solution Components:**

| Component | Feature | How It Solves |
|-----------|---------|---------------|
| `ekstra-dashboard` | Health overview | Real-time status on router web UI |
| `ekstra-agent` | Cloud telemetry | Uploads health data every 5 minutes |
| `ekstra-agent` | Alert triggers | Detects issues and flags in cloud |
| **Cloud Backend** | Fleet dashboard | View all routers in one place |
| **Cloud Backend** | Alerts/notifications | Email/SMS when router goes offline |
| `ekstra-agent` | OTA updates | Push firmware updates remotely |

**Telemetry Data Points:**
```json
{
  "health": {
    "uptime_seconds": 86400,
    "wan_connected": true,
    "wan_ip": "203.0.113.45",
    "signal_strength": -58,
    "signal_quality": "good",
    "haha_connected": true,
    "haha_mode": "ethernet",
    "cpu_usage": 12,
    "memory_free_mb": 45,
    "last_reconnect": "2026-01-28T10:30:00Z",
    "reconnect_count_24h": 2
  }
}
```

**Acceptance Criteria:**
- [ ] Health data uploaded to cloud every 5 minutes
- [ ] Dashboard shows green/yellow/red status at a glance
- [ ] Alerts trigger when router offline >10 minutes
- [ ] Historical uptime graphs available (7/30/90 days)
- [ ] OTA updates can be pushed without on-site visit

---

## Enhancements We're Delivering

### Enhancement 1: Zero-Touch Automation

**Mapped To:**
- Onboarding App (auto-detect, one-click flash)
- `ekstra-core` (boot script, auto-config)
- `ekstra-dashboard` (2-step wizard)

**Success Metric:** Setup time reduced from 30-60 minutes to <15 minutes

---

### Enhancement 2: Intelligent Captive Portal Handling

**Mapped To:**
- `ekstra-captive` package (detection, auto-login, keepalive)
- `ekstra-dashboard` (manual fallback UI)

**Success Metric:** 80-95% fewer portal-related support tickets

---

### Enhancement 3: Signal & Stability Optimization

**Mapped To:**
- `ekstra-watchdog` (monitoring, auto-reconnect, channel switching)
- `ekstra-agent` (signal telemetry)

**Success Metric:** Intermittent failures reduced by 70%+

---

### Enhancement 4: Conflict-Free Networking

**Mapped To:**
- `ekstra-core` (subnet detection, dynamic selection, VLAN)
- `ekstra-dashboard` (conflict warnings)

**Success Metric:** Zero subnet conflicts in new deployments

---

### Enhancement 5: Modern, Simple Dashboard

**Mapped To:**
- `ekstra-dashboard` package
- Setup wizard
- Health overview
- Configuration UI

**Success Metric:** Operators can monitor/fix issues without support call

---

### Enhancement 6: Ekstra AI Integration

**Mapped To:**
- `ekstra-sniffer` (monitor mode, probe capture)
- `ekstra-agent` (5-min upload to api.ekstra.ai)
- **Cloud Backend** (analytics, fleet management)

**Success Metric:** Location analytics data flowing for 100% of deployed routers

---

### Enhancement 7: Secure & Reliable Foundation

**Mapped To:**
- SHA-512 password hashing (ekstra-core)
- SHA-256 firmware verification (onboarding app)
- MAC address hashing (ekstra-sniffer)
- Signed OTA updates (ekstra-agent)

**Success Metric:** Zero security incidents, no bricked devices from OTA

---

## Component Responsibility Matrix

| Problem/Enhancement | ekstra-core | ekstra-captive | ekstra-watchdog | ekstra-sniffer | ekstra-agent | ekstra-dashboard | Onboarding App | Cloud |
|---------------------|:-----------:|:--------------:|:---------------:|:--------------:|:------------:|:----------------:|:--------------:|:-----:|
| Captive Portal | | ● | | | | ○ | | |
| Signal Stability | ○ | | ● | | ○ | ○ | | ○ |
| Subnet Conflicts | ● | | | | | ○ | | |
| Auto-Recovery | | | ● | | ○ | ○ | | ○ |
| Easy Setup | ● | | | | | ● | ● | |
| Monitoring | ○ | | ○ | | ● | ● | | ● |
| Location Analytics | | | | ● | ● | | | ● |
| Security | ● | | | ● | ● | | ● | ● |

● = Primary responsibility | ○ = Supporting role

---

## Implementation Priority

Based on problem severity and user impact:

### Priority 1 (Must Have for MVP)
1. **Easy Setup** - Onboarding app + basic dashboard wizard
2. **Auto-Recovery** - ekstra-watchdog (basic reconnect)
3. **Monitoring** - ekstra-agent (health telemetry)

### Priority 2 (High Value)
4. **Captive Portal** - ekstra-captive (auto-login)
5. **Subnet Conflicts** - ekstra-core (dynamic subnet)
6. **Signal Stability** - ekstra-watchdog (channel switching)

### Priority 3 (Differentiator)
7. **Location Analytics** - ekstra-sniffer (monitor mode)
8. **Advanced Dashboard** - Full health UI, alerts

### Priority 4 (Polish)
9. **OTA Updates** - Remote firmware push
10. **Fleet Management** - Multi-router cloud dashboard

---

## Validation Checklist

Before each release, verify:

- [ ] All 6 problems have working solutions
- [ ] Setup time measured <15 minutes in testing
- [ ] Auto-recovery tested (disconnect WiFi, verify reconnect)
- [ ] Captive portal tested with at least 3 portal types
- [ ] No subnet conflicts with common venue networks
- [ ] Telemetry flowing to cloud every 5 minutes
- [ ] Dashboard shows accurate real-time status
- [ ] Sniffer collecting device counts (if enabled)
- [ ] Security: passwords hashed, MACs hashed, no PII leaked

---

## Summary

| What We Said | Where It Lives |
|--------------|----------------|
| "80-95% fewer portal-related drops" | `ekstra-captive` |
| "Dramatically reduced intermittent failures" | `ekstra-watchdog` |
| "No more IP conflicts" | `ekstra-core` (subnet detection) |
| "Plug in → it just works" | Onboarding App + `ekstra-core` |
| "Operators can monitor/fix issues" | `ekstra-dashboard` + Cloud |
| "Passive market insights for Ekstra" | `ekstra-sniffer` + `ekstra-agent` |
| "Remote OTA updates" | `ekstra-agent` + Cloud |
| "Secure, no bricking risks" | SHA verification, signed updates |

**Every promise maps to code. No vapor features.**
