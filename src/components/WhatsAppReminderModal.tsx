import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, Copy, Check, X, Phone, Settings2, Bell, Sparkles, ExternalLink, Key, Globe, Eye, EyeOff } from 'lucide-react';
import { AppState, CalcResult, WhatsAppConfig } from '../types';
import {
  formatWhatsAppMessage,
  getWhatsAppUrl,
  sendWatiTemplateMessage,
  DEFAULT_WATI_ENDPOINT,
  DEFAULT_WATI_TOKEN,
  DEFAULT_WATI_TEMPLATE
} from '../utils/whatsapp';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  calc: CalcResult;
  state: AppState;
  onUpdateWhatsAppConfig: (config: WhatsAppConfig) => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  calc,
  state,
  onUpdateWhatsAppConfig
}) => {
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'watiSettings'>('preview');
  const [isSendingWati, setIsSendingWati] = useState(false);
  const [watiResult, setWatiResult] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Local config state with user provided defaults
  const config = state.whatsAppConfig || {
    phone: '',
    watiEndpoint: DEFAULT_WATI_ENDPOINT,
    watiToken: DEFAULT_WATI_TOKEN,
    watiTemplateName: DEFAULT_WATI_TEMPLATE,
    watiBroadcastName: 'Mission_Mussoorie_Daily_Brief',
    sendTime: '07:00',
    includeMocks: true,
    includeCsat: true,
    includeEnglish: true,
    maxTopicsCount: 5
  };

  const [phone, setPhone] = useState(config.phone || '');
  const [watiEndpoint, setWatiEndpoint] = useState(config.watiEndpoint || DEFAULT_WATI_ENDPOINT);
  const [watiToken, setWatiToken] = useState(config.watiToken || DEFAULT_WATI_TOKEN);
  const [watiTemplateName, setWatiTemplateName] = useState(config.watiTemplateName || DEFAULT_WATI_TEMPLATE);
  const [watiBroadcastName, setWatiBroadcastName] = useState(config.watiBroadcastName || 'Mission_Mussoorie_Daily_Brief');
  const [sendTime, setSendTime] = useState(config.sendTime || '07:00');
  const [includeMocks, setIncludeMocks] = useState(config.includeMocks);
  const [includeCsat, setIncludeCsat] = useState(config.includeCsat);
  const [includeEnglish, setIncludeEnglish] = useState(config.includeEnglish);
  const [maxTopicsCount, setMaxTopicsCount] = useState(config.maxTopicsCount || 5);

  if (!isOpen) return null;

  // Build the message preview
  const formattedMessage = formatWhatsAppMessage(
    {
      ...state,
      whatsAppConfig: {
        phone,
        watiEndpoint,
        watiToken,
        watiTemplateName,
        watiBroadcastName,
        sendTime,
        includeMocks,
        includeCsat,
        includeEnglish,
        maxTopicsCount
      }
    },
    calc,
    customNote
  );

  const whatsAppUrl = getWhatsAppUrl(phone, formattedMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSaveConfig = () => {
    const updatedCfg: WhatsAppConfig = {
      phone,
      watiEndpoint,
      watiToken,
      watiTemplateName,
      watiBroadcastName,
      sendTime,
      includeMocks,
      includeCsat,
      includeEnglish,
      maxTopicsCount
    };
    onUpdateWhatsAppConfig(updatedCfg);
    setWatiResult({ text: 'WATI dispatch settings saved to your local profile!' });
  };

  const handleSendViaWati = async () => {
    if (!phone.replace(/[^0-9]/g, '')) {
      setWatiResult({
        text: 'Please enter a target WhatsApp phone number with country code (e.g. 919876543210).',
        isError: true
      });
      return;
    }
    if (!watiEndpoint || !watiToken) {
      setWatiResult({
        text: 'Please provide both WATI API Endpoint and Access Token.',
        isError: true
      });
      return;
    }

    setIsSendingWati(true);
    setWatiResult(null);

    // Auto save settings
    onUpdateWhatsAppConfig({
      phone,
      watiEndpoint,
      watiToken,
      watiTemplateName,
      watiBroadcastName,
      sendTime,
      includeMocks,
      includeCsat,
      includeEnglish,
      maxTopicsCount
    });

    const res = await sendWatiTemplateMessage({
      endpoint: watiEndpoint,
      token: watiToken,
      phone,
      templateName: watiTemplateName,
      broadcastName: watiBroadcastName,
      state,
      calc,
      customNotes: customNote
    });

    setIsSendingWati(false);
    setWatiResult({
      text: res.message,
      isError: !res.success
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-[10000]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E2DA] dark:border-[#2A3648] flex items-center justify-between bg-[#F7F5F0]/60 dark:bg-[#0E1520]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
              <Send className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#17202A] dark:text-[#F7F5F0]">
                  WhatsApp Daily Study Briefing
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#172A46] text-[#E6E2DA]">
                  WATI API Powered
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#A3ADBD]">
                Send today's core syllabus targets, spaced revisions & mocks directly via WATI WhatsApp Business API
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#667085] hover:text-[#17202A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-[#E6E2DA] dark:border-[#2A3648] px-5 bg-white dark:bg-[#162131]">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-colors ${
              activeTab === 'preview'
                ? 'border-[#25D366] text-[#25D366]'
                : 'border-transparent text-[#667085] hover:text-[#17202A]'
            }`}
          >
            Today's Briefing Preview
          </button>
          <button
            onClick={() => setActiveTab('watiSettings')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'watiSettings'
                ? 'border-[#172A46] dark:border-[#8FB0F0] text-[#172A46] dark:text-[#8FB0F0]'
                : 'border-transparent text-[#667085] hover:text-[#17202A]'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" /> WATI API & Dispatch Settings
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'preview' ? (
            <>
              {/* Phone quick input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648]">
                <div className="flex items-center gap-2 text-xs text-[#17202A] dark:text-[#F7F5F0] font-semibold shrink-0">
                  <Phone className="w-4 h-4 text-[#25D366]" />
                  <span>Target WhatsApp Number:</span>
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    onUpdateWhatsAppConfig({ ...config, phone: e.target.value });
                  }}
                  placeholder="e.g. 919876543210 (Country code + Phone number)"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0] text-xs font-mono-num"
                />
              </div>

              {/* Status Banner after dispatch */}
              {watiResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                    watiResult.isError
                      ? 'bg-[#FEE2E2] text-[#DC2626] dark:bg-[#2D1B1B] border border-[#FCA5A5]'
                      : 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#132A1C] border border-[#86EFAC]'
                  }`}
                >
                  <span className="font-medium">{watiResult.text}</span>
                  <button onClick={() => setWatiResult(null)} className="opacity-70 hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Personal custom focus note */}
              <div>
                <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                  Add Personal Focus Note for Today (Optional):
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Solve 50 Modern History MCQs & revise Articles 14 to 32..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0]"
                />
              </div>

              {/* WhatsApp Message Preview Card */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#667085] dark:text-[#A3ADBD]">
                    Formatted Message Preview:
                  </span>
                  <span className="text-[11px] text-[#25D366] font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Ready for WATI / WhatsApp
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#EFEAE2] dark:bg-[#0B141B] border border-[#DAD2C7] dark:border-[#1F2C34] text-[#111B21] dark:text-[#E9EDEF] font-reading text-xs leading-relaxed whitespace-pre-wrap select-all font-mono-num shadow-inner">
                  {formattedMessage}
                </div>
              </div>
            </>
          ) : (
            /* WATI API Settings Tab */
            <div className="space-y-4">
              {/* WATI API Credentials Card */}
              <div className="p-4 rounded-xl bg-[#F0FDF4] dark:bg-[#132A1C] border border-[#DCFCE7] dark:border-[#1E4D2B] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#16A34A]" />
                    <span className="text-sm font-bold text-[#16A34A] dark:text-[#4FA582]">
                      WATI API Configuration (sendTemplateMessage)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-num text-[#16A34A] bg-[#DCFCE7] dark:bg-[#1E4D2B] px-2 py-0.5 rounded">
                    Tenant: 10265277
                  </span>
                </div>

                {/* Endpoint input */}
                <div>
                  <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
                    WATI API Endpoint:
                  </label>
                  <input
                    type="text"
                    value={watiEndpoint}
                    onChange={(e) => setWatiEndpoint(e.target.value)}
                    placeholder="https://live-mt-server.wati.io/10265277"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0] font-mono-num"
                  />
                  <span className="text-[11px] text-[#667085] dark:text-[#A3ADBD] mt-0.5 block">
                    Targets: <code className="text-[#16A34A]">{watiEndpoint.replace(/\/+$/, '')}/api/v1/sendTemplateMessage</code>
                  </span>
                </div>

                {/* Access Token input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                      WATI Access Token:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-[11px] text-[#16A34A] hover:underline flex items-center gap-1"
                    >
                      {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showToken ? 'Hide Token' : 'Show Token'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={watiToken}
                      onChange={(e) => setWatiToken(e.target.value)}
                      placeholder="Bearer eyJhbGciOiJIUzI1Ni..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0] font-mono-num"
                    />
                  </div>
                </div>

                {/* Template Name & Broadcast Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-[#17202A] dark:text-[#F7F5F0] mb-1">
                      Template Name (in WATI)
                    </label>
                    <input
                      type="text"
                      value={watiTemplateName}
                      onChange={(e) => setWatiTemplateName(e.target.value)}
                      placeholder="mission_mussoorie_reminder"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0] font-mono"
                    />
                    <span className="text-[10px] text-[#667085] dark:text-[#A3ADBD]">
                      Name of your WhatsApp template approved in WATI
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#17202A] dark:text-[#F7F5F0] mb-1">
                      Broadcast Label
                    </label>
                    <input
                      type="text"
                      value={watiBroadcastName}
                      onChange={(e) => setWatiBroadcastName(e.target.value)}
                      placeholder="Mission_Mussoorie_Daily_Brief"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0]"
                    />
                  </div>
                </div>
              </div>

              {/* Recipient & Content Customization */}
              <div className="p-3.5 rounded-xl bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648] space-y-3">
                <h3 className="text-sm font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                  Recipient & Schedule Preferences
                </h3>

                <div>
                  <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                    Recipient WhatsApp Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="919876543210 (e.g. India 91 + 10 digits)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0] font-mono-num"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                      Max Primary Topics
                    </label>
                    <select
                      value={maxTopicsCount}
                      onChange={(e) => setMaxTopicsCount(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0]"
                    >
                      <option value={3}>Top 3 Topics</option>
                      <option value={5}>Top 5 Topics</option>
                      <option value={7}>Top 7 Topics</option>
                      <option value={10}>Top 10 Topics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                      Daily Reminder Target Time
                    </label>
                    <input
                      type="time"
                      value={sendTime}
                      onChange={(e) => setSendTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0] font-mono-num"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E6E2DA] dark:border-[#2A3648] space-y-2">
                  <span className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD]">
                    Include Special Modules:
                  </span>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeMocks}
                        onChange={(e) => setIncludeMocks(e.target.checked)}
                        className="rounded accent-[#25D366]"
                      />
                      <span>Mock Tests (1–100)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCsat}
                        onChange={(e) => setIncludeCsat(e.target.checked)}
                        className="rounded accent-[#25D366]"
                      />
                      <span>CSAT Modules</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeEnglish}
                        onChange={(e) => setIncludeEnglish(e.target.checked)}
                        className="rounded accent-[#25D366]"
                      />
                      <span>English & Essay Modules</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Status feedback */}
              {watiResult && (
                <div
                  className={`text-xs p-3 rounded-lg ${
                    watiResult.isError
                      ? 'bg-[#FEE2E2] text-[#DC2626] dark:bg-[#2D1B1B] border border-[#FCA5A5]'
                      : 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#132A1C] border border-[#86EFAC]'
                  }`}
                >
                  {watiResult.text}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 py-2 bg-[#172A46] text-white hover:bg-[#233B5D] text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Save WATI Configuration
                </button>
                <button
                  onClick={handleSendViaWati}
                  disabled={isSendingWati}
                  className="px-4 py-2 bg-[#16A34A] text-white hover:bg-[#13863D] text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 fill-current" />
                  <span>{isSendingWati ? 'Sending...' : 'Test Send via WATI'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0]/60 dark:bg-[#0E1520]/60 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 text-xs font-semibold border border-[#E6E2DA] dark:border-[#2A3648] bg-white dark:bg-[#162131] text-[#17202A] dark:text-[#F7F5F0] hover:border-[#25D366] rounded-xl flex items-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-[#25D366]" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}
          </button>

          <div className="flex items-center gap-2">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 text-xs font-semibold border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 rounded-xl flex items-center gap-1.5 transition-colors"
              title="Open WhatsApp Web or App directly"
            >
              <span>Open in WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleSendViaWati}
              disabled={isSendingWati}
              className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>{isSendingWati ? 'Sending via WATI API...' : 'Dispatch via WATI API'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
