import React, { useState, useEffect } from 'react';
import { onInstallPromptChange, promptInstall, isInstalledPWA } from '../../utils/pwa';

export default function InstallAppButton({ className = '' }) {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(isInstalledPWA());

  useEffect(() => {
    const unsub = onInstallPromptChange(setCanInstall);
    return unsub;
  }, []);

  if (installed || !canInstall) return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setInstalled(true);
  };

  return (
    <button
      onClick={handleInstall}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
        bg-brand-primary text-white hover:opacity-90 transition-opacity shadow-sm ${className}`}
      style={{ backgroundColor: 'var(--brand-primary, #1E40AF)' }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
      </svg>
      Install App
    </button>
  );
}
