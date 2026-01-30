/**
 * Router Detector
 *
 * Detects GL.iNet routers on the local network by scanning
 * common gateway IPs and checking for router responses.
 *
 * Supports DEV MODE for testing with mock API on localhost:8080
 */

const axios = require('axios');
const os = require('os');

// Dev mode detection - checks localhost first for mock API testing
const DEV_MODE = process.env.NODE_ENV === 'development' ||
                 process.env.EKSTRA_DEV_MODE === 'true' ||
                 !require('electron')?.app?.isPackaged; // Not packaged = dev mode

// Common GL.iNet router IPs
const COMMON_GATEWAY_IPS = [
  '192.168.8.1',    // GL.iNet default
  '192.168.1.1',    // Common default
  '192.168.0.1',    // Common default
  '10.0.0.1',       // Enterprise default
  '172.16.0.1',     // Enterprise default
];

// Timeout for HTTP requests (ms)
const REQUEST_TIMEOUT = 5000;

/**
 * Get the default gateway IP from the system
 */
function getDefaultGateway() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.internal || iface.family !== 'IPv4') {
        continue;
      }

      // Try to infer gateway (usually .1 of the subnet)
      const parts = iface.address.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.1`;
      }
    }
  }

  return null;
}

/**
 * Check if mock API is running on localhost
 */
async function checkMockAPI() {
  console.log('[DEV] Checking for mock API at localhost:8080...');

  try {
    const response = await axios.get('http://localhost:8080/status.sh', {
      timeout: REQUEST_TIMEOUT,
    });

    if (response.status === 200 && response.data) {
      console.log('[DEV] Mock API found!', response.data);
      return {
        ip: 'localhost',
        port: 8080,
        reachable: true,
        isEkstra: true,
        isMock: true,
        data: response.data,
      };
    }
  } catch (err) {
    console.log('[DEV] Mock API not found:', err.message);
  }

  return null;
}

/**
 * Check if an IP responds to HTTP requests
 */
async function checkRouterIP(ip) {
  console.log(`Checking ${ip}...`);

  try {
    // First, try Ekstra API on port 8080 (works for flashed routers)
    try {
      const ekstraResponse = await axios.get(`http://${ip}:8080/status.sh`, {
        timeout: REQUEST_TIMEOUT,
      });

      if (ekstraResponse.status === 200 && ekstraResponse.data) {
        console.log(`  Found Ekstra API at ${ip}:8080`);
        return {
          ip,
          port: 8080,
          reachable: true,
          isEkstra: true,
          data: ekstraResponse.data,
        };
      }
    } catch (e) {
      // Not Ekstra, continue to check stock router
    }

    // Try common router endpoints on port 80 (stock routers)
    const endpoints = [
      `http://${ip}/`,
      `http://${ip}/cgi-bin/luci`,
      `http://${ip}/index.html`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          timeout: REQUEST_TIMEOUT,
          validateStatus: (status) => status < 500,
        });

        if (response.status < 500) {
          console.log(`  Found router at ${endpoint}`);
          return {
            ip,
            port: 80,
            reachable: true,
            isEkstra: false,
            status: response.status,
            headers: response.headers,
            data: response.data,
          };
        }
      } catch (err) {
        continue;
      }
    }

    return null;
  } catch (err) {
    console.log(`  No response from ${ip}`);
    return null;
  }
}

/**
 * Identify router model from response
 */
function identifyRouterModel(response) {
  if (!response) {
    return null;
  }

  // If it's Ekstra firmware, get model from API response
  if (response.isEkstra && response.data) {
    const data = response.data;

    // Check board info from Ekstra API
    if (data.board) {
      const board = data.board.toLowerCase();

      if (board.includes('b3000') || board.includes('marble')) {
        return { model: 'GL-B3000', codename: 'Marble' };
      }
      if (board.includes('mt3000') || board.includes('beryl')) {
        return { model: 'GL-MT3000', codename: 'Beryl AX' };
      }
      if (board.includes('x3000') || board.includes('spitz')) {
        return { model: 'GL-X3000', codename: 'Spitz AX' };
      }
      if (board.includes('xe3000') || board.includes('puli')) {
        return { model: 'GL-XE3000', codename: 'Puli AX' };
      }
    }

    // Default for Ekstra firmware (mock returns 'glinet,gl-mt3000')
    return { model: 'GL-MT3000', codename: 'Beryl AX' };
  }

  // For stock routers, check headers and HTML body
  const server = response.headers?.['server'] || '';
  const body = typeof response.data === 'string' ? response.data : '';

  if (server.includes('GL.iNet') || body.includes('GL.iNet') || body.includes('glinet')) {
    if (body.includes('B3000') || body.includes('Marble')) {
      return { model: 'GL-B3000', codename: 'Marble' };
    }
    if (body.includes('MT3000') || body.includes('Beryl')) {
      return { model: 'GL-MT3000', codename: 'Beryl AX' };
    }
    if (body.includes('X3000') || body.includes('Spitz')) {
      return { model: 'GL-X3000', codename: 'Spitz AX' };
    }
    if (body.includes('XE3000') || body.includes('Puli')) {
      return { model: 'GL-XE3000', codename: 'Puli AX' };
    }

    return { model: 'GL.iNet', codename: 'Unknown' };
  }

  return null;
}

/**
 * Check if router has Ekstra firmware
 */
async function checkEkstraFirmware(ip) {
  try {
    const response = await axios.get(`http://${ip}:8080/status.sh`, {
      timeout: REQUEST_TIMEOUT,
    });

    if (response.data && response.data.hasEkstraFirmware) {
      return {
        hasEkstra: true,
        setupState: response.data.setup_state || 'unknown',
        firmwareVersion: response.data.firmware_version || 'unknown',
      };
    }

    return { hasEkstra: false };
  } catch (err) {
    return { hasEkstra: false };
  }
}

/**
 * Detect router on the network
 */
async function detectRouter() {
  console.log('=== Router Detection Started ===');
  console.log(`DEV_MODE: ${DEV_MODE}`);

  const results = {
    found: false,
    ip: null,
    port: 80,
    model: null,
    hasEkstraFirmware: false,
    setupState: null,
    firmwareVersion: null,
    isMock: false,
  };

  // DEV MODE: Check localhost mock API first
  if (DEV_MODE) {
    const mockResult = await checkMockAPI();

    if (mockResult && mockResult.reachable) {
      console.log('[DEV] Using mock API for testing');

      results.found = true;
      results.ip = 'localhost';
      results.port = 8080;
      results.isMock = true;
      results.model = identifyRouterModel(mockResult);
      results.hasEkstraFirmware = mockResult.data?.hasEkstraFirmware || false;
      results.setupState = mockResult.data?.setup_state;
      results.firmwareVersion = mockResult.data?.firmware_version;

      console.log('=== Detection Complete (Mock) ===', results);
      return results;
    }
  }

  // PRODUCTION: Check real gateway IPs
  const defaultGateway = getDefaultGateway();
  console.log(`Default gateway: ${defaultGateway}`);

  const ipsToCheck = defaultGateway
    ? [defaultGateway, ...COMMON_GATEWAY_IPS.filter(ip => ip !== defaultGateway)]
    : COMMON_GATEWAY_IPS;

  console.log(`Checking IPs: ${ipsToCheck.join(', ')}`);

  for (const ip of ipsToCheck) {
    const response = await checkRouterIP(ip);

    if (response && response.reachable) {
      // If it's already identified as Ekstra firmware
      if (response.isEkstra) {
        results.found = true;
        results.ip = ip;
        results.port = response.port;
        results.model = identifyRouterModel(response);
        results.hasEkstraFirmware = response.data?.hasEkstraFirmware || true;
        results.setupState = response.data?.setup_state;
        results.firmwareVersion = response.data?.firmware_version;

        console.log('=== Detection Complete (Ekstra) ===', results);
        return results;
      }

      // Check if it's a GL.iNet router (stock)
      const model = identifyRouterModel(response);

      if (model) {
        results.found = true;
        results.ip = ip;
        results.port = 80;
        results.model = model;

        // Check for Ekstra firmware on port 8080
        const ekstraCheck = await checkEkstraFirmware(ip);
        results.hasEkstraFirmware = ekstraCheck.hasEkstra;
        results.setupState = ekstraCheck.setupState;
        results.firmwareVersion = ekstraCheck.firmwareVersion;

        console.log('=== Detection Complete (Stock) ===', results);
        return results;
      }
    }
  }

  console.log('=== Detection Complete (Not Found) ===');
  return results;
}

module.exports = {
  detectRouter,
  checkRouterIP,
  identifyRouterModel,
  checkEkstraFirmware,
  getDefaultGateway,
  checkMockAPI,
};
