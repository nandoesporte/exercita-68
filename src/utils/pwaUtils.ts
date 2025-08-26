
/**
 * Solicita permissão para enviar notificações push
 * @returns Promise<boolean> Retorna true se a permissão foi concedida
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações push');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissão para notificações:', error);
    return false;
  }
};

/**
 * Verifica se a aplicação está sendo executada como PWA instalado
 * @returns boolean
 */
export const isPwaInstalled = (): boolean => {
  // First check the display-mode media query
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Then check for iOS "standalone" property
  const isIOSInstalled = (window.navigator as any).standalone === true;
  
  // Finally check if the app was launched from the home screen
  const isFromHomeScreen = window.location.search.includes('source=pwa');
  
  console.log('PWA status:', { isStandalone, isIOSInstalled, isFromHomeScreen });
  
  return isStandalone || isIOSInstalled || isFromHomeScreen;
};

/**
 * Verifica se o dispositivo está online
 * @returns boolean
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Registra callbacks para mudanças no estado de conectividade
 * @param onlineCallback Função a ser chamada quando ficar online
 * @param offlineCallback Função a ser chamada quando ficar offline
 */
export const registerConnectivityListeners = (
  onlineCallback: () => void,
  offlineCallback: () => void
): void => {
  window.addEventListener('online', onlineCallback);
  window.addEventListener('offline', offlineCallback);
};

/**
 * Remove listeners de conectividade
 * @param onlineCallback Função registrada para evento online
 * @param offlineCallback Função registrada para evento offline
 */
export const removeConnectivityListeners = (
  onlineCallback: () => void,
  offlineCallback: () => void
): void => {
  window.removeEventListener('online', onlineCallback);
  window.removeEventListener('offline', offlineCallback);
};

/**
 * Registra o evento beforeinstallprompt
 */
export const registerInstallPrompt = (): void => {
  // First ensure we don't have duplicate event listeners
  try {
    window.removeEventListener('beforeinstallprompt', (e: any) => {
      console.log('Removed old beforeinstallprompt listener');
    });
  } catch (err) {
    console.log('No beforeinstallprompt listener to remove');
  }

  // Add the event listener
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event so it can be triggered later
    window.deferredPromptEvent = e;
    console.log('beforeinstallprompt event captured and stored');
  });

  // Detect if the app was installed
  window.addEventListener('appinstalled', () => {
    // Clear the deferredPrompt
    window.deferredPromptEvent = null;
    console.log('PWA was installed');
  });
};

/**
 * Checks if an install prompt is available
 * @returns boolean
 */
export const canInstallPwa = (): boolean => {
  console.log('Checking if PWA can be installed:', { 
    promptAvailable: !!window.deferredPromptEvent,
    isInstalled: isPwaInstalled()
  });
  return !!window.deferredPromptEvent && !isPwaInstalled();
};
