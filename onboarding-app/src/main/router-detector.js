/**
 * Router Detector
 * 
 * Detects GL.iNet routers on the local network by scanning
 * common gateway IPs and checking for router responses.
 */

const axios = require('axios');
const os = require('os');

// Common GL.iNet router IPs
const COMMON_GATEWAY_IPS = [
  '192.168.8.1',    // GL.iNet default
  '192.168.1.1',    // Common default
  '192.168.0.1',    // Common default
  '10.0.0.1',       // Enterprise default
  '172.16.0.1',     // Enterprise default
];

// Timeout for HTTP requests (ms)
const REQUEST_TIMEOUT = 3000;

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
 * Check if an IP responds to HTTP requests
 */
async function checkRouterIP(ip) {
  try {
    // Try common router endpoints
    const endpoints = [
      `http://${ip}/`,
      `http://${ip}/cgi-bin/luci`,
      `http://${ip}/index.html`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          timeout: REQUEST_TIMEOUT,
          validateStatus: (status) => status < 500, // Accept any status < 500
        });
        
        // If we get a response, it's likely a router
        if (response.status < 500) {
          return {
            ip,
            reachable: true,
            status: response.status,
            headers: response.headers,
          };
        }
      } catch (err) {
        // Continue to next endpoint
        continue;
      }
    }
    
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Identify router model from response
 */
function identifyRouterModel(response) {
  if (!response || !response.headers) {
    return null;
  }
  
  const server = response.headers['server'] || '';
  const body = response.data || '';
  
  // Check for GL.iNet indicators
  if (server.includes('GL.iNet') || body.includes('GL.iNet') || body.includes('glinet')) {
    // Try to identify specific model
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
    
    // Generic GL.iNet
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
  const results = {
    found: false,
    ip: null,
    model: null,
    hasEkstraFirmware: false,
    setupState: null,
    firmwareVersion: null,
  };
  
  // Start with default gateway
  const defaultGateway = getDefaultGateway();
  const ipsToCheck = defaultGateway 
    ? [defaultGateway, ...COMMON_GATEWAY_IPS.filter(ip => ip !== defaultGateway)]
    : COMMON_GATEWAY_IPS;
  
  // Check each IP
  for (const ip of ipsToCheck) {
    const response = await checkRouterIP(ip);
    
    if (response && response.reachable) {
      // Check if it's a GL.iNet router
      const model = identifyRouterModel(response);
      
      if (model) {
        results.found = true;
        results.ip = ip;
        results.model = model;
        
        // Check for Ekstra firmware
        const ekstraCheck = await checkEkstraFirmware(ip);
        results.hasEkstraFirmware = ekstraCheck.hasEkstra;
        results.setupState = ekstraCheck.setupState;
        results.firmwareVersion = ekstraCheck.firmwareVersion;
        
        return results;
      }
    }
  }
  
  return results;
}

module.exports = {
  detectRouter,
  checkRouterIP,
  identifyRouterModel,
  checkEkstraFirmware,
};
