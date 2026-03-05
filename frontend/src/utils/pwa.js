const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

let deferredInstallPrompt = null;
let installPromptListeners = [];

/**
 * Register the service worker for PWA support.
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('SW registered:', registration.scope);

        // Check for updates periodically
        setInterval(() => registration.update(), 60 * 60 * 1000); // every hour
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    });
  }
}

/**
 * Update the manifest <link> tag to point to the dynamic backend manifest
 * with the correct tenant/plant context.
 */
export function updateManifest({ tenantId, plantId, domain } = {}) {
  const params = new URLSearchParams();
  if (plantId) params.set('plantId', plantId);
  else if (tenantId) params.set('tenantId', tenantId);

  // Always include current domain for fallback resolution
  if (!plantId && !tenantId) {
    params.set('domain', domain || window.location.hostname);
  }

  const manifestUrl = `${API_URL}/pwa/manifest?${params.toString()}`;

  // Remove existing manifest link
  let link = document.querySelector('link[rel="manifest"]');
  if (link) {
    link.remove();
  }

  // Create new manifest link
  link = document.createElement('link');
  link.rel = 'manifest';
  link.href = manifestUrl;
  link.crossOrigin = 'use-credentials';
  document.head.appendChild(link);
}

/**
 * Update the page title and favicon based on tenant/plant branding.
 */
export function updateBrowserMeta({ name, themeColor, iconUrl }) {
  // Update page title
  if (name) {
    document.title = name;
  }

  // Update theme-color meta tag
  if (themeColor) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', themeColor);
    }
  }

  // Update favicon if we have a logo
  if (iconUrl) {
    let favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = iconUrl;
    } else {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = iconUrl;
      document.head.appendChild(favicon);
    }

    // Also set apple-touch-icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = iconUrl;
  }
}

/**
 * Initialize install prompt capture.
 * Browsers fire `beforeinstallprompt` when the app meets PWA criteria.
 */
export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    // Notify all listeners
    installPromptListeners.forEach((fn) => fn(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installPromptListeners.forEach((fn) => fn(false));
    console.log('PWA installed successfully');
  });
}

/**
 * Subscribe to install prompt availability changes.
 * @param {Function} listener - Called with (isAvailable: boolean)
 * @returns {Function} Unsubscribe function
 */
export function onInstallPromptChange(listener) {
  installPromptListeners.push(listener);
  // Immediately notify if prompt is already available
  if (deferredInstallPrompt) listener(true);
  return () => {
    installPromptListeners = installPromptListeners.filter((fn) => fn !== listener);
  };
}

/**
 * Trigger the PWA install prompt if available.
 * @returns {Promise<boolean>} True if user accepted, false otherwise.
 */
export async function promptInstall() {
  if (!deferredInstallPrompt) return false;

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installPromptListeners.forEach((fn) => fn(false));
  return outcome === 'accepted';
}

/**
 * Check if the app is running in standalone/installed mode.
 */
export function isInstalledPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}
