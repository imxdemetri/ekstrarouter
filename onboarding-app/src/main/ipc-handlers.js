/**
 * IPC Handlers
 * 
 * Handles IPC communication between renderer and main process.
 */

const { ipcMain, shell, app } = require('electron');
const routerDetector = require('./router-detector');
const routerFlasher = require('./router-flasher');
const { stateMachine, STATES } = require('./state-machine');
const path = require('path');
const fs = require('fs');

/**
 * Set up all IPC handlers
 */
function setup() {
  // Router detection
  ipcMain.handle('router:detect', async () => {
    try {
      stateMachine.startDetection();
      
      const result = await routerDetector.detectRouter();
      
      if (result.found) {
        stateMachine.routerDetected({
          ip: result.ip,
          model: result.model,
          hasEkstraFirmware: result.hasEkstraFirmware,
          setupState: result.setupState,
          firmwareVersion: result.firmwareVersion,
        });
      } else {
        stateMachine.setError('No router found. Please ensure your router is connected and powered on.');
      }
      
      return result;
    } catch (err) {
      stateMachine.setError(err.message);
      throw err;
    }
  });
  
  // Firmware flash
  ipcMain.handle('firmware:flash', async (event, routerIp, firmwareFileName) => {
    try {
      stateMachine.startFlashing();
      
      // Resolve firmware path from extraResources
      // In production, firmware is in app.getPath('exe')/../resources/firmware/
      // In development, it's in the project firmware/ directory
      let firmwarePath;
      
      if (process.env.NODE_ENV === 'development') {
        firmwarePath = path.join(__dirname, '../../firmware', firmwareFileName);
      } else {
        // Production: firmware is in extraResources
        const resourcesPath = process.resourcesPath || app.getAppPath();
        firmwarePath = path.join(resourcesPath, 'firmware', firmwareFileName);
      }
      
      // Check if firmware file exists
      if (!fs.existsSync(firmwarePath)) {
        throw new Error(`Firmware file not found: ${firmwareFileName}. Please ensure firmware is bundled with the app.`);
      }
      
      // Progress callback
      const progressCallback = (progress) => {
        event.sender.send('progress', progress);
      };
      
      // Flash firmware
      const result = await routerFlasher.flashFirmware(
        routerIp,
        firmwarePath,
        progressCallback
      );
      
      // Wait for reboot
      stateMachine.startRebooting();
      event.sender.send('progress', {
        stage: 'rebooting',
        progress: 95,
        message: 'Router is rebooting. Please wait 2-3 minutes...',
      });
      
      const rebooted = await routerFlasher.waitForReboot(routerIp);
      
      if (!rebooted) {
        throw new Error('Router did not come back online. Please check the router manually.');
      }
      
      return result;
    } catch (err) {
      stateMachine.setError(err.message);
      throw err;
    }
  });
  
  // Firmware verification
  ipcMain.handle('firmware:verify', async (event, routerIp) => {
    try {
      stateMachine.startVerifying();
      
      const result = await routerFlasher.verifyFirmware(routerIp);
      
      if (result.verified) {
        stateMachine.complete();
      } else {
        stateMachine.setError(result.reason || 'Firmware verification failed');
      }
      
      return result;
    } catch (err) {
      stateMachine.setError(err.message);
      throw err;
    }
  });
  
  // State management
  ipcMain.handle('state:get', () => {
    return stateMachine.getState();
  });
  
  ipcMain.handle('state:set', (event, state) => {
    stateMachine.setState(state);
    return stateMachine.getState();
  });
  
  // Open dashboard
  ipcMain.handle('dashboard:open', async (event, routerIp) => {
    const url = `http://${routerIp}:8080`;
    await shell.openExternal(url);
    return { success: true };
  });
  
  // Listen for state changes and forward to renderer
  stateMachine.on('state-change', (stateData) => {
    // Get all windows and send state change
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('state-change', stateData);
    });
  });
}

module.exports = {
  setup,
};
