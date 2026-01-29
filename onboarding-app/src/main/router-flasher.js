/**
 * Router Flasher
 * 
 * Handles firmware flashing via HTTP/LuCI interface.
 * Works with stock GL.iNet routers that allow unauthenticated
 * firmware uploads in first-run mode.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Timeout for flash operations (longer for large files)
const FLASH_TIMEOUT = 300000; // 5 minutes
const VERIFY_TIMEOUT = 10000; // 10 seconds

/**
 * Flash firmware to router via LuCI HTTP interface
 */
async function flashFirmware(routerIp, firmwarePath, progressCallback) {
  if (!fs.existsSync(firmwarePath)) {
    throw new Error(`Firmware file not found: ${firmwarePath}`);
  }
  
  const stats = fs.statSync(firmwarePath);
  const fileSize = stats.size;
  
  // Create form data
  const form = new FormData();
  form.append('image', fs.createReadStream(firmwarePath), {
    filename: path.basename(firmwarePath),
    contentType: 'application/octet-stream',
  });
  
  // LuCI flash endpoint (stock GL.iNet)
  const flashUrl = `http://${routerIp}/cgi-bin/luci/admin/system/flashops`;
  
  try {
    // Report initial progress
    if (progressCallback) {
      progressCallback({ stage: 'uploading', progress: 0, message: 'Starting firmware upload...' });
    }
    
    // Upload firmware
    const response = await axios.post(flashUrl, form, {
      headers: form.getHeaders(),
      timeout: FLASH_TIMEOUT,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (progressEvent) => {
        if (progressCallback && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCallback({
            stage: 'uploading',
            progress: percent,
            message: `Uploading firmware... ${percent}%`,
          });
        }
      },
    });
    
    // Check response
    if (response.status === 200) {
      if (progressCallback) {
        progressCallback({ stage: 'flashing', progress: 90, message: 'Firmware uploaded, flashing...' });
      }
      
      // Router should reboot automatically
      // Wait a moment for flash to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        message: 'Firmware uploaded successfully. Router will reboot automatically.',
      };
    } else {
      throw new Error(`Flash failed with status ${response.status}`);
    }
  } catch (err) {
    if (err.response) {
      throw new Error(`Flash failed: ${err.response.status} ${err.response.statusText}`);
    } else if (err.request) {
      throw new Error('Flash failed: No response from router. Make sure router is connected.');
    } else {
      throw new Error(`Flash failed: ${err.message}`);
    }
  }
}

/**
 * Wait for router to reboot and come back online
 */
async function waitForReboot(routerIp, maxWaitTime = 180000) {
  const startTime = Date.now();
  const checkInterval = 5000; // Check every 5 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Try to ping the router
      const response = await axios.get(`http://${routerIp}/`, {
        timeout: 3000,
        validateStatus: () => true, // Accept any status
      });
      
      // Router is back online
      return true;
    } catch (err) {
      // Router still rebooting, wait and retry
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }
  
  return false;
}

/**
 * Verify Ekstra firmware is installed
 */
async function verifyFirmware(routerIp) {
  try {
    const response = await axios.get(`http://${routerIp}:8080/status.sh`, {
      timeout: VERIFY_TIMEOUT,
    });
    
    if (response.data && response.data.hasEkstraFirmware) {
      return {
        verified: true,
        firmwareVersion: response.data.firmware_version || 'unknown',
        setupState: response.data.setup_state || 'unconfigured',
      };
    }
    
    return { verified: false, reason: 'Ekstra firmware not detected' };
  } catch (err) {
    return { verified: false, reason: `Cannot verify: ${err.message}` };
  }
}

module.exports = {
  flashFirmware,
  waitForReboot,
  verifyFirmware,
};
