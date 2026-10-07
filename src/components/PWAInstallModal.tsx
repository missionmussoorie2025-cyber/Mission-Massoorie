import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Smartphone, Download, Check, Copy, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = window.location.href.split('#')[0];

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-6 sm:my-auto max-h-[88vh] overflow-y-auto cursor-default transition-all z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#172A46] via-[#C8873D] to-[#2563EB] rounded-t-2xl" />

        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full text-[#64748B] hover:text-[#0F172A] dark:hover:text-white bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] transition-colors shadow-xs cursor-pointer"
          aria-label="Close modal"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5 pr-8 pt-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#172A46] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Install Mission Mussoorie (APK)
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] dark:text-[#34D399] border border-[#10B981]/30">
                Android & iOS
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Install directly on your phone with offline support, full-screen view, and home screen icon.
            </p>
          </div>
        </div>

        {/* Option 1: Direct 1-Click Install (Android Chrome / Edge / Desktop) */}
        {isInstalled ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Application Already Installed!
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                You are running the official standalone app.
              </p>
            </div>
          </div>
        ) : isInstallable ? (
          <div className="bg-[#F8FAFC] dark:bg-[#0B1320] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#F59E0B]" /> Instant 1-Click Android WebAPK
                </span>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  Android OS compiles an official WebAPK and places the app icon on your home screen.
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="w-full mt-2 py-2.5 px-4 bg-[#172A46] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Install App on this Device
            </button>
          </div>
        ) : (
          /* Mobile Android / iOS Manual Steps */
          <div className="bg-[#F8FAFC] dark:bg-[#0B1320] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4 mb-4 text-xs space-y-2.5">
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#F59E0B]" /> How to Install on Mobile:
            </span>
            <div className="space-y-2 text-[#475569] dark:text-[#CBD5E1]">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#172A46] text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <span>Open this link in <strong>Chrome</strong> on your Android phone (or <strong>Safari</strong> on iPhone).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#172A46] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <span>Tap the browser menu <strong>(⋮ on Chrome)</strong> or <strong>Share (⎋ on Safari)</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#172A46] text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                <span>Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </div>
            </div>
          </div>
        )}

        {/* Option 2: Build Standalone .APK File via PWABuilder */}
        <div className="border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4 bg-white dark:bg-[#0B1320]/50 mb-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> Generate Standalone .APK / .AAB File
            </span>
            <span className="text-[10px] font-mono-num px-1.5 py-0.2 rounded bg-[#2563EB]/10 text-[#2563EB] font-bold">
              PWABuilder
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-3 leading-relaxed">
            Need a raw <code>.apk</code> package to sideload or upload to Google Play? You can generate it in 30 seconds using Microsoft's official free PWA-to-APK builder:
          </p>

          {/* Copyable URL box */}
          <div className="flex items-center gap-2 bg-[#F1F5F9] dark:bg-[#162131] border border-[#CBD5E1] dark:border-[#334155] rounded-lg p-2 mb-3">
            <input
              type="text"
              readOnly
              value={currentAppUrl}
              className="bg-transparent text-[11px] font-mono-num text-[#1E293B] dark:text-[#E2E8F0] flex-1 outline-hidden select-all"
            />
            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 bg-white dark:bg-[#0B1320] border border-[#CBD5E1] dark:border-[#334155] rounded text-[11px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#E2E8F0] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <a
            href={`https://www.pwabuilder.com/?url=${encodeURIComponent(currentAppUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open PWABuilder & Download .APK</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Footer & Fail-safe Close Button */}
        <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between gap-3">
          <p className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">
            Includes offline storage, auto-sync, and all syllabus telemetry for UPSC 2027.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[#0F172A] dark:text-[#F8FAFC] text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
