/**
 * Ekstra Router Setup - Preload Script
 * 
 * Secure bridge between renderer and main process.
 * Exposes safe IPC methods to the renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ekstraRouter', {
  // Router detection
  detectRouter: () => ipcRenderer.invoke('router:detect'),
  
  // Firmware operations
  flashFirmware: (routerIp, firmwarePath) => 
    ipcRenderer.invoke('firmware:flash', routerIp, firmwarePath),
  
  verifyFirmware: (routerIp) => 
    ipcRenderer.invoke('firmware:verify', routerIp),
  
  // State machine
  getState: () => ipcRenderer.invoke('state:get'),
  setState: (state) => ipcRenderer.invoke('state:set', state),
  
  // Events
  onProgress: (callback) => {
    ipcRenderer.on('progress', (event, data) => callback(data));
  },
  
  onError: (callback) => {
    ipcRenderer.on('error', (event, error) => callback(error));
  },
  
  onStateChange: (callback) => {
    ipcRenderer.on('state-change', (event, state) => callback(state));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Open dashboard
  openDashboard: (routerIp) => 
    ipcRenderer.invoke('dashboard:open', routerIp),
});
