/**
 * Ekstra Router Setup - Renderer Process
 * 
 * UI logic for the onboarding app.
 */

// State
let currentStep = 'detect';
let routerInfo = null;
let firmwarePath = null;

// DOM Elements
const steps = {
  detect: document.getElementById('step-detect'),
  flash: document.getElementById('step-flash'),
  reboot: document.getElementById('step-reboot'),
  complete: document.getElementById('step-complete'),
};

const elements = {
  detectMessage: document.getElementById('detect-message'),
  detectResult: document.getElementById('detect-result'),
  detectError: document.getElementById('detect-error'),
  errorMessage: document.getElementById('error-message'),
  routerDetails: document.getElementById('router-details'),
  firmwareStatus: document.getElementById('firmware-status'),
  btnFlash: document.getElementById('btn-flash'),
  btnOpenDashboard: document.getElementById('btn-open-dashboard'),
  btnRetryDetect: document.getElementById('btn-retry-detect'),
  progressFill: document.getElementById('progress-fill'),
  progressMessage: document.getElementById('progress-message'),
  rebootMessage: document.getElementById('reboot-message'),
  btnCompleteDashboard: document.getElementById('btn-complete-dashboard'),
  btnCompleteClose: document.getElementById('btn-complete-close'),
};

/**
 * Show a specific step
 */
function showStep(stepName) {
  // Hide all steps
  Object.values(steps).forEach(step => {
    step.classList.remove('active');
  });
  
  // Show requested step
  if (steps[stepName]) {
    steps[stepName].classList.add('active');
    currentStep = stepName;
  }
}

/**
 * Show error message
 */
function showError(message) {
  elements.detectError.classList.remove('hidden');
  elements.detectResult.classList.add('hidden');
  elements.errorMessage.textContent = message;
}

/**
 * Hide error message
 */
function hideError() {
  elements.detectError.classList.add('hidden');
}

/**
 * Format router model display
 */
function formatRouterModel(model) {
  if (!model) return 'Unknown';
  return `${model.model} (${model.codename})`;
}

/**
 * Handle router detection
 */
async function detectRouter() {
  try {
    elements.detectMessage.textContent = 'Scanning network for GL.iNet router...';
    elements.detectResult.classList.add('hidden');
    hideError();
    
    const result = await window.ekstraRouter.detectRouter();
    
    if (result.found) {
      routerInfo = result;
      
      // Show router details
      elements.routerDetails.textContent = 
        `IP: ${result.ip} | Model: ${formatRouterModel(result.model)}`;
      
      // Show firmware status
      if (result.hasEkstraFirmware) {
        elements.firmwareStatus.innerHTML = `
          <p><strong>✓ Ekstra Firmware Installed</strong></p>
          <p>Version: ${result.firmwareVersion || 'unknown'}</p>
          <p>Setup State: ${result.setupState || 'unknown'}</p>
        `;
        elements.firmwareStatus.classList.add('has-ekstra');
        elements.btnOpenDashboard.classList.remove('hidden');
        elements.btnFlash.classList.add('hidden');
      } else {
        elements.firmwareStatus.innerHTML = `
          <p><strong>Stock GL.iNet Firmware Detected</strong></p>
          <p>Click below to install Ekstra firmware.</p>
        `;
        elements.firmwareStatus.classList.remove('has-ekstra');
        elements.btnFlash.classList.remove('hidden');
        elements.btnOpenDashboard.classList.add('hidden');
      }
      
      elements.detectResult.classList.remove('hidden');
    } else {
      showError('No router found. Please ensure your router is connected and powered on.');
    }
  } catch (err) {
    showError(err.message || 'Failed to detect router. Please try again.');
  }
}

/**
 * Get firmware path for router model
 */
function getFirmwarePath(model) {
  if (!model || !model.model) {
    return null;
  }
  
  // Map model to firmware file name
  const modelMap = {
    'GL-B3000': 'ekstra-firmware-gl-b3000.bin',
    'GL-MT3000': 'ekstra-firmware-gl-mt3000.bin',
    'GL-X3000': 'ekstra-firmware-gl-x3000.bin',
    'GL-XE3000': 'ekstra-firmware-gl-xe3000.bin',
  };
  
  const firmwareFile = modelMap[model.model];
  if (!firmwareFile) {
    return null;
  }
  
  // In Electron, firmware is in extraResources
  // Path will be resolved by main process
  return firmwareFile;
}

/**
 * Handle firmware flash
 */
async function flashFirmware() {
  if (!routerInfo) {
    showError('Router information not available. Please detect router first.');
    return;
  }
  
  // Get firmware path for this router model
  firmwarePath = getFirmwarePath(routerInfo.model);
  
  if (!firmwarePath) {
    showError(`Firmware not available for router model: ${routerInfo.model?.model || 'unknown'}`);
    return;
  }
  
  try {
    showStep('flash');
    elements.progressFill.style.width = '0%';
    elements.progressMessage.textContent = 'Preparing firmware upload...';
    
    // Set up progress listener
    window.ekstraRouter.onProgress((progress) => {
      if (progress.progress !== undefined) {
        elements.progressFill.style.width = `${progress.progress}%`;
      }
      if (progress.message) {
        elements.progressMessage.textContent = progress.message;
      }
      
      // Transition to reboot step if needed
      if (progress.stage === 'rebooting') {
        showStep('reboot');
        elements.rebootMessage.textContent = progress.message || 'Router is rebooting...';
      }
    });
    
    // Flash firmware
    await window.ekstraRouter.flashFirmware(routerInfo.ip, firmwarePath);
    
    // Wait for reboot (handled by progress callback)
    // After reboot, verify firmware
    setTimeout(async () => {
      await verifyFirmware();
    }, 180000); // Wait 3 minutes for reboot
    
  } catch (err) {
    showError(err.message || 'Firmware flash failed. Please try again.');
    showStep('detect');
  }
}

/**
 * Verify firmware installation
 */
async function verifyFirmware() {
  try {
    showStep('reboot');
    elements.rebootMessage.textContent = 'Verifying Ekstra firmware installation...';
    
    const result = await window.ekstraRouter.verifyFirmware(routerInfo.ip);
    
    if (result.verified) {
      showStep('complete');
    } else {
      showError(result.reason || 'Firmware verification failed.');
      showStep('detect');
    }
  } catch (err) {
    showError(err.message || 'Failed to verify firmware.');
    showStep('detect');
  }
}

/**
 * Open dashboard
 */
async function openDashboard() {
  if (!routerInfo) {
    showError('Router information not available.');
    return;
  }
  
  try {
    await window.ekstraRouter.openDashboard(routerInfo.ip);
  } catch (err) {
    showError(`Failed to open dashboard: ${err.message}`);
  }
}

/**
 * Initialize app
 */
function init() {
  // Set up event listeners
  elements.btnFlash.addEventListener('click', flashFirmware);
  elements.btnOpenDashboard.addEventListener('click', openDashboard);
  elements.btnRetryDetect.addEventListener('click', () => {
    hideError();
    detectRouter();
  });
  elements.btnCompleteDashboard.addEventListener('click', openDashboard);
  elements.btnCompleteClose.addEventListener('click', () => {
    // Close app (Electron)
    if (window.ekstraRouter && window.ekstraRouter.close) {
      window.ekstraRouter.close();
    }
  });
  
  // Set up state change listener
  window.ekstraRouter.onStateChange((stateData) => {
    // Handle state changes from main process
    if (stateData.state === 'complete') {
      showStep('complete');
    } else if (stateData.state === 'error') {
      showError(stateData.error || 'An error occurred');
    }
  });
  
  // Set up error listener
  window.ekstraRouter.onError((error) => {
    showError(error.message || 'An error occurred');
  });
  
  // Start detection on load
  detectRouter();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
