# Ekstra Router - Project Dashboard

## Repository
**GitHub**: https://github.com/imxdemetri/ekstrarouter

---

## Current Status: Phase 1 - Foundation ✅

### What's Done

| Component | Status | Notes |
|-----------|--------|-------|
| **Repository Structure** | ✅ Complete | Clean architecture, proper .gitignore |
| **Documentation** | ✅ Complete | Architecture, Strategy, User Journey, Implementation Plan |
| **Onboarding App Skeleton** | ✅ Complete | Electron app with state machine, IPC, UI |
| **Mock Router API** | ✅ Complete | For development testing |
| **HTTP-First Flow** | ✅ Complete | No SSH—detection and flash use HTTP/LuCI only |

### What's Next

| Component | Status | Priority |
|-----------|--------|----------|
| **Test Onboarding App** | 🔲 Pending | P1 - Test with mock API |
| **Firmware Packages** | 🔲 Not Started | P1 - ekstra-core, watchdog, agent |
| **Sniffer Package** | 🔲 Not Started | P3 - Monitor mode analytics |

---

## MVP Progress

```
PRIORITY 1 - MVP Components
════════════════════════════════════════════════════════════

Onboarding App          [████████████████████░░░░]  80%
├─ Router detection     ✅ Done (HTTP-only)
├─ Firmware flashing    ✅ Done (HTTP/LuCI, no SSH)
├─ State machine        ✅ Done
├─ UI wizard            ✅ Done
└─ Test with real router 🔲 Pending

ekstra-core             [░░░░░░░░░░░░░░░░░░░░░░░░]  0%
├─ API endpoints        🔲 Not started
├─ Subnet detection     🔲 Not started
└─ HaHa mode setup      🔲 Not started

ekstra-watchdog         [░░░░░░░░░░░░░░░░░░░░░░░░]  0%
├─ Connection monitor   🔲 Not started
├─ Auto-reconnect       🔲 Not started
└─ Recovery logging     🔲 Not started

ekstra-agent            [░░░░░░░░░░░░░░░░░░░░░░░░]  0%
├─ Health collection    🔲 Not started
├─ Cloud upload         🔲 Not started
└─ OTA checking         🔲 Not started

────────────────────────────────────────────────────────────
OVERALL MVP PROGRESS    [████░░░░░░░░░░░░░░░░░░░░]  20%
```

---

## Immediate Next Steps

### Step 1: Test Current Onboarding App (Today)

```bash
# Terminal 1: Start mock API
cd ekstrarouter/scripts
node mock-router-api.js

# Terminal 2: Run onboarding app
cd ekstrarouter/onboarding-app
npm install
npm run dev
```

**Verify:**
- [ ] App launches without errors
- [ ] Mock API responds at localhost:8080
- [ ] App can detect "router" (mock)
- [ ] UI flow works (detect → flash → verify → complete)

### Step 2: Connect App to Mock API (This Week)

To test the full flow without hardware, ensure the app checks **localhost** when no real router is found (or add a "Test with mock" mode that points detection at `localhost:8080`). Current detector scans gateway IPs—for mock testing, you may need to run mock API and temporarily add `127.0.0.1` to the scan list, or use a tunnel.

### Step 3: Build Firmware Packages (Week 2-3)

Priority order:
1. **ekstra-core** - API on :8080 that onboarding app talks to
2. **ekstra-watchdog** - Auto-reconnect (most requested feature)
3. **ekstra-agent** - Telemetry to cloud

---

## Architecture Reminder

```
┌─────────────────────────────────────────────────────────────┐
│                     EKSTRA ROUTER SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ONBOARDING APP          ROUTER FIRMWARE         CLOUD     │
│  (Electron)              (OpenWrt + Ekstra)      (API)     │
│                                                             │
│  ┌──────────┐           ┌──────────────┐      ┌─────────┐ │
│  │ Detect   │──HTTP────▶│ ekstra-core  │      │         │ │
│  │ Flash    │           │   (:8080)    │─────▶│ ekstra  │ │
│  │ Verify   │           ├──────────────┤      │   .ai   │ │
│  └──────────┘           │ watchdog     │      │         │ │
│                         │ captive      │      │ Fleet   │ │
│                         │ sniffer ────────────▶│ Dash   │ │
│                         │ agent        │      └─────────┘ │
│                         └──────────────┘                   │
│                                │                           │
│                    ┌───────────┴───────────┐              │
│                    │                       │              │
│               ┌────▼────┐           ┌──────▼──────┐      │
│               │ Radio 1 │           │   Radio 2   │      │
│               │  5GHz   │           │   2.4GHz   │      │
│               │ Connect │           │  Analytics  │      │
│               └────┬────┘           └─────────────┘      │
│                    │                                      │
│               ┌────▼────┐                                 │
│               │  HaHa   │                                 │
│               │ Vending │                                 │
│               └─────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| **HTTP-first, no SSH** | GL.iNet ships with SSH disabled |
| **Dual-radio split** | 5GHz for connectivity, 2.4GHz for analytics |
| **4-step onboarding** | Minimal user interaction |
| **5-minute telemetry** | Balance between real-time and battery/bandwidth |
| **MAC hashing** | Privacy-preserving analytics |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSH disabled on stock routers | HIGH | ✅ HTTP-first architecture (implemented) |
| Firmware bricking | HIGH | SHA-256 verification, rollback |
| Subnet conflicts | MEDIUM | Dynamic subnet detection |
| Captive portal variety | MEDIUM | Common portal scripts + manual fallback |
| Monitor mode not working | LOW | Test on actual hardware early |

---

## Team Checklist

Before first customer deployment:

- [ ] Onboarding app tested on Windows, macOS, Linux
- [ ] Firmware flashing tested on all 4 router models
- [ ] Watchdog recovery tested (unplug WiFi, verify reconnect)
- [ ] Captive portal tested with 3+ portal types
- [ ] Telemetry verified flowing to api.ekstra.ai
- [ ] Dashboard shows accurate status
- [ ] Sniffer collecting device counts (if enabled)
- [ ] Documentation ready for Vend Guys

---

## Resources

- **Repo**: https://github.com/imxdemetri/ekstrarouter
- **Mock API**: `scripts/mock-router-api.js`
- **Docs**: `docs/` folder
- **GL.iNet Routers**: B3000, MT3000, X3000, XE3000

---

*Last Updated: January 28, 2026*
