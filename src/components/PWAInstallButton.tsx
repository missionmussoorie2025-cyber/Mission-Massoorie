import React, { useState } from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already installed, we can still provide the modal from settings or show a compact button
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172A46] hover:bg-[#1E3A5F] text-white text-xs font-semibold shadow-xs border border-[#C8873D]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="Install Android App / Download APK"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span className="hidden sm:inline">Install App (APK)</span>
        <span className="sm:hidden">APK</span>
      </button>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
