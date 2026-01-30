/**
 * Mock Ekstra Router API - Enhanced Version
 *
 * Simulates the firmware API on port 8080 for development/testing
 * without needing actual hardware.
 *
 * Usage:
 *   node mock-router-api.js              # Ekstra firmware mode (default)
 *   node mock-router-api.js --stock     # Stock GL.iNet mode (for testing flash)
 *
 * Toggle mode at runtime:
 *   POST /mock/set-mode { "mode": "stock" }   # Switch to stock
 *   POST /mock/set-mode { "mode": "ekstra" }  # Switch to ekstra
 *   GET  /mock/status                          # Check current mock settings
 */

const http = require('http');
const url = require('url');

const PORT = 8080;

// Check command line args for initial mode
const args = process.argv.slice(2);
const initialStockMode = args.includes('--stock') || args.includes('-s');

// Simulated router state
const state = {
  // Mock control
  isStockFirmware: initialStockMode,  // Toggle this to test both paths
  simulateFlashSuccess: true,
  simulateRebootDelay: 3000, // ms

  // Router state
  setupComplete: false,
  adminPassword: null,
  connectedNetwork: null,
  hahaMode: null,
  pairingToken: null,
  firmwareVersion: '1.0.0-dev',
};

// Available networks (simulated scan results)
const mockNetworks = [
  { ssid: 'Venue-WiFi-5G', signal: -42, secured: true, channel: 36 },
  { ssid: 'Venue-WiFi', signal: -58, secured: true, channel: 6 },
  { ssid: 'Guest-Network', signal: -65, secured: false, channel: 11 },
  { ssid: 'ATT-WIFI-2847', signal: -78, secured: true, channel: 1 },
];

// Parse JSON body from request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data, null, 2));
}

// Request handler
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const modeIndicator = state.isStockFirmware ? '[STOCK]' : '[EKSTRA]';
  console.log(`${modeIndicator} ${req.method} ${path}`);

  // Route handlers
  switch (path) {

    // ============ MOCK CONTROL ENDPOINTS ============

    // GET /mock/status - Get current mock settings
    case '/mock/status':
      return sendJson(res, {
        mode: state.isStockFirmware ? 'stock' : 'ekstra',
        isStockFirmware: state.isStockFirmware,
        hasEkstraFirmware: !state.isStockFirmware,
        simulateFlashSuccess: state.simulateFlashSuccess,
        simulateRebootDelay: state.simulateRebootDelay,
        setupComplete: state.setupComplete,
        connectedNetwork: state.connectedNetwork,
      });

    // POST /mock/set-mode - Toggle between stock and ekstra modes
    case '/mock/set-mode':
      const modeBody = await parseBody(req);
      if (modeBody.mode === 'stock') {
        state.isStockFirmware = true;
        console.log('\n🔄 Switched to STOCK firmware mode\n');
        return sendJson(res, { success: true, mode: 'stock', message: 'Now simulating stock GL.iNet router' });
      } else if (modeBody.mode === 'ekstra') {
        state.isStockFirmware = false;
        console.log('\n🔄 Switched to EKSTRA firmware mode\n');
        return sendJson(res, { success: true, mode: 'ekstra', message: 'Now simulating Ekstra firmware' });
      }
      return sendJson(res, { success: false, error: 'Invalid mode. Use "stock" or "ekstra"' }, 400);

    // POST /mock/reset - Reset all state
    case '/mock/reset':
      state.setupComplete = false;
      state.adminPassword = null;
      state.connectedNetwork = null;
      state.hahaMode = null;
      state.pairingToken = null;
      console.log('\n🔄 Mock state reset\n');
      return sendJson(res, { success: true, message: 'State reset' });

    // ============ ROUTER API ENDPOINTS ============

    // GET /status.sh - Router status
    case '/status.sh':
      // If stock firmware, this endpoint wouldn't exist on port 8080
      // But we return it anyway for detection to work
      return sendJson(res, {
        status: 'online',
        hasEkstraFirmware: !state.isStockFirmware,
        setup_state: state.setupComplete ? 'configured' : 'unconfigured',
        board: 'glinet,gl-mt3000',
        target: 'mediatek/filogic',
        firmware_version: state.isStockFirmware ? null : state.firmwareVersion,
        uptime: Math.floor(process.uptime()),
        wan_connected: !!state.connectedNetwork,
        haha_connected: !!state.hahaMode,
      });

    // GET / - Root endpoint (stock routers respond here)
    case '/':
      if (state.isStockFirmware) {
        // Simulate stock GL.iNet login page
        res.writeHead(200, { 'Content-Type': 'text/html', 'Server': 'GL.iNet' });
        return res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>GL.iNet Admin</title></head>
          <body>
            <h1>GL.iNet GL-MT3000</h1>
            <p>Welcome to your GL.iNet router.</p>
            <p>Firmware: 4.5.0</p>
          </body>
          </html>
        `);
      } else {
        // Ekstra firmware redirects to dashboard
        res.writeHead(302, { 'Location': '/dashboard' });
        return res.end();
      }

    // POST /cgi-bin/luci/admin/system/flashops - Stock firmware flash endpoint
    case '/cgi-bin/luci/admin/system/flashops':
      if (!state.isStockFirmware) {
        return sendJson(res, { error: 'Not available on Ekstra firmware' }, 404);
      }

      console.log('\n📦 Firmware upload received!');
      console.log('⏳ Simulating flash process...\n');

      // Simulate flash delay
      await new Promise(r => setTimeout(r, 2000));

      if (state.simulateFlashSuccess) {
        // Switch to Ekstra mode after successful flash
        state.isStockFirmware = false;
        state.firmwareVersion = '1.0.0-dev';
        console.log('✅ Flash successful! Router now has Ekstra firmware.\n');

        // Simulate reboot
        console.log('🔄 Simulating router reboot...\n');

        return sendJson(res, {
          success: true,
          message: 'Firmware uploaded successfully. Router will reboot.',
        });
      } else {
        return sendJson(res, { success: false, error: 'Flash failed (simulated)' }, 500);
      }

    // POST /auth.sh - Pairing
    case '/auth.sh':
      const authBody = await parseBody(req);
      if (authBody.action === 'pair') {
        state.pairingToken = 'mock-token-' + Date.now();
        return sendJson(res, {
          success: true,
          token: state.pairingToken,
        });
      }
      return sendJson(res, { success: false, error: 'Invalid action' }, 400);

    // GET /network-scan.sh - Scan WiFi networks
    case '/network-scan.sh':
      // Simulate scan delay
      await new Promise(r => setTimeout(r, 1000));
      return sendJson(res, {
        networks: mockNetworks,
      });

    // POST /network-connect.sh - Connect to WiFi
    case '/network-connect.sh':
      const connectBody = await parseBody(req);
      const { ssid, password } = connectBody;

      if (!ssid) {
        return sendJson(res, { success: false, error: 'SSID required' }, 400);
      }

      const network = mockNetworks.find(n => n.ssid === ssid);
      if (!network) {
        return sendJson(res, { success: false, error: 'Network not found' }, 404);
      }

      if (network.secured && !password) {
        return sendJson(res, { success: false, error: 'Password required' }, 400);
      }

      // Simulate connection delay
      await new Promise(r => setTimeout(r, 2000));

      state.connectedNetwork = ssid;
      return sendJson(res, {
        success: true,
        ssid: ssid,
        ip: '192.168.1.' + Math.floor(Math.random() * 200 + 50),
        gateway: '192.168.1.1',
      });

    // GET /wan-status.sh - Internet connectivity
    case '/wan-status.sh':
      return sendJson(res, {
        connected: !!state.connectedNetwork,
        hasInternet: !!state.connectedNetwork,
        ip: state.connectedNetwork ? '192.168.1.100' : null,
        gateway: state.connectedNetwork ? '192.168.1.1' : null,
        dns: ['8.8.8.8', '8.8.4.4'],
      });

    // POST /haha-setup.sh - Configure HaHa connection mode
    case '/haha-setup.sh':
      const hahaBody = await parseBody(req);
      const { mode } = hahaBody;

      if (!['ethernet', 'wifi'].includes(mode)) {
        return sendJson(res, { success: false, error: 'Invalid mode' }, 400);
      }

      state.hahaMode = mode;

      if (mode === 'wifi') {
        return sendJson(res, {
          success: true,
          mode: 'wifi',
          ap_ssid: 'ekstra-haha-' + Math.random().toString(36).substr(2, 4),
          ap_password: 'ekstra123',
          ap_ip: '192.168.100.1',
        });
      } else {
        return sendJson(res, {
          success: true,
          mode: 'ethernet',
          lan_ip: '192.168.8.1',
          dhcp_range: '192.168.8.100-192.168.8.200',
        });
      }

    // POST /setup-complete.sh - Finalize setup
    case '/setup-complete.sh':
      const setupBody = await parseBody(req);
      const { admin_password, venue_type, location_name } = setupBody;

      if (!admin_password || admin_password.length < 8) {
        return sendJson(res, {
          success: false,
          error: 'Password must be at least 8 characters'
        }, 400);
      }

      state.adminPassword = admin_password;
      state.setupComplete = true;

      return sendJson(res, {
        success: true,
        router_id: 'ekstra-' + Math.random().toString(36).substr(2, 8),
        message: 'Setup complete',
      });

    // POST /firmware-upload.sh - Receive firmware (for OTA on Ekstra)
    case '/firmware-upload.sh':
      return sendJson(res, {
        success: true,
        message: 'Firmware received (mock)',
        file: '/tmp/firmware.bin',
      });

    // GET /analytics.sh - Sniffer data (mock)
    case '/analytics.sh':
      return sendJson(res, {
        timestamp: new Date().toISOString(),
        unique_devices_5min: Math.floor(Math.random() * 50) + 10,
        avg_rssi: -55 - Math.floor(Math.random() * 20),
        device_vendors: {
          apple: Math.floor(Math.random() * 20) + 5,
          samsung: Math.floor(Math.random() * 15) + 3,
          google: Math.floor(Math.random() * 8) + 1,
          other: Math.floor(Math.random() * 10) + 2,
        },
        probe_count: Math.floor(Math.random() * 500) + 100,
      });

    // 404 for unknown endpoints
    default:
      return sendJson(res, { error: 'Not found', path }, 404);
  }
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  const modeText = state.isStockFirmware
    ? 'STOCK GL.iNet (for testing flash flow)'
    : 'EKSTRA FIRMWARE (for testing dashboard flow)';

  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        Ekstra Router Mock API - Enhanced               ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Server running at http://localhost:${PORT}              ║`);
  console.log('║                                                        ║');
  console.log(`║  Current Mode: ${modeText.padEnd(39)}║`);
  console.log('║                                                        ║');
  console.log('║  Router Endpoints:                                     ║');
  console.log('║    GET  /status.sh           Router status             ║');
  console.log('║    POST /auth.sh             Pairing                   ║');
  console.log('║    GET  /network-scan.sh     Scan WiFi                 ║');
  console.log('║    POST /network-connect.sh Connect to WiFi           ║');
  console.log('║    GET  /wan-status.sh       Internet status           ║');
  console.log('║    POST /haha-setup.sh       HaHa connection mode      ║');
  console.log('║    POST /setup-complete.sh   Finalize setup            ║');
  console.log('║    GET  /analytics.sh        Sniffer data (mock)       ║');
  console.log('║                                                        ║');
  console.log('║  Mock Control Endpoints:                               ║');
  console.log('║    GET  /mock/status         Current mock settings     ║');
  console.log('║    POST /mock/set-mode       Toggle stock/ekstra       ║');
  console.log('║    POST /mock/reset          Reset all state           ║');
  console.log('║                                                        ║');
  console.log('║  Quick Mode Switch:                                    ║');
  console.log('║    curl -X POST localhost:8080/mock/set-mode \\         ║');
  console.log('║         -d \'{"mode":"stock"}\'                          ║');
  console.log('║                                                        ║');
  console.log('║  Press Ctrl+C to stop                                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});
