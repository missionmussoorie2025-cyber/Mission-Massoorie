import React, { useState } from 'react';
import { 
  User, Key, Lock, Globe, Share2, Shield, Smartphone, ShieldCheck, 
  Download, Upload, Copy, Check, Moon, Sun, Monitor, 
  Sparkles, Send, Settings2, RefreshCw, Award
} from 'lucide-react';
import { AppState, CalcResult, AppTheme, UserProfile } from '../types';
import { exportToCsv } from '../utils/calc';
import { PWAInstallModal } from './PWAInstallModal';

interface DataSettingsProps {
  calc: CalcResult;
  state: AppState;
  onUpdateState: (newState: Partial<AppState>) => void;
  onLoadSampleData: () => void;
  onResetAllData: () => void;
  onOpenWhatsAppModal: () => void;
}

export const DataSettings: React.FC<DataSettingsProps> = ({
  calc,
  state,
  onUpdateState,
  onLoadSampleData,
  onResetAllData,
  onOpenWhatsAppModal
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [importText, setImportText] = useState<string>('');
  const [importMessage, setImportMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [syncUrlCopied, setSyncUrlCopied] = useState(false);

  // Profile Form Local State
  const profile: UserProfile = state.userProfile || {
    fullName: 'IAS Aspirant',
    username: 'mussoorie_2027',
    aspirantId: 'MM-2027-IAS',
    optionalSubject: 'Public Administration',
    targetCadre: 'Home Cadre',
    motto: 'LBSNAA Mussoorie 2027 • Rank 1 Mission',
    isPinEnabled: false,
    passcodePin: ''
  };

  const [fullName, setFullName] = useState(profile.fullName || '');
  const [username, setUsername] = useState(profile.username || '');
  const [aspirantId, setAspirantId] = useState(profile.aspirantId || '');
  const [optionalSubject, setOptionalSubject] = useState(profile.optionalSubject || '');
  const [targetCadre, setTargetCadre] = useState(profile.targetCadre || '');
  const [motto, setMotto] = useState(profile.motto || '');
  const [isPinEnabled, setIsPinEnabled] = useState(Boolean(profile.isPinEnabled));
  const [passcodePin, setPasscodePin] = useState(profile.passcodePin || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: UserProfile = {
      fullName,
      username,
      aspirantId,
      optionalSubject,
      targetCadre,
      motto,
      isPinEnabled,
      passcodePin
    };
    onUpdateState({ userProfile: updatedProfile });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Generate 1-Click Cross Device Sync URL
  const getSyncUrl = () => {
    try {
      const compactState = {
        x: state.x,
        d: state.d,
        r: state.r,
        u: state.userProfile
      };
      const encoded = btoa(encodeURIComponent(JSON.stringify(compactState)));
      const baseUrl = window.location.href.split('?')[0];
      return `${baseUrl}?sync=${encoded}`;
    } catch (e) {
      return window.location.href;
    }
  };

  const handleCopySyncUrl = () => {
    const url = getSyncUrl();
    navigator.clipboard.writeText(url).then(() => {
      setSyncUrlCopied(true);
      setTimeout(() => setSyncUrlCopied(false), 2500);
    });
  };

  const handleCopy = (type: 'json' | 'csv') => {
    const text = type === 'json' ? JSON.stringify(state, null, 2) : exportToCsv(state);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  const handleDownload = (type: 'json' | 'csv') => {
    const text = type === 'json' ? JSON.stringify(state, null, 2) : exportToCsv(state);
    const mimeType = type === 'json' ? 'application/json' : 'text/csv';
    const filename = `mission_mussoorie_backup_${calc.todayStr}.${type}`;
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    try {
      let textToParse = importText.trim();
      if (!textToParse) {
        setImportMessage({ text: 'Please paste valid backup JSON text or Sync Link into the box.', isError: true });
        return;
      }

      // Handle Sync URL if pasted directly
      if (textToParse.includes('?sync=')) {
        const syncParam = new URLSearchParams(textToParse.split('?')[1]).get('sync');
        if (syncParam) {
          textToParse = decodeURIComponent(atob(syncParam));
        }
      }

      const parsed = JSON.parse(textToParse);
      if (!parsed || typeof parsed.x !== 'object') {
        throw new Error('Missing completion data object');
      }
      onUpdateState({
        theme: parsed.theme || state.theme,
        mode: parsed.mode || state.mode,
        exam: parsed.exam || state.exam,
        x: parsed.x || {},
        d: parsed.d || {},
        r: parsed.r || {},
        starred: parsed.starred || {},
        notes: parsed.notes || {},
        attachments: parsed.attachments || {},
        topicMinutes: parsed.topicMinutes || {},
        mockScores: parsed.mockScores || {},
        studySessions: parsed.studySessions || [],
        userProfile: parsed.u || parsed.userProfile || state.userProfile
      });
      setImportMessage({ text: 'Progress & Profile data restored successfully! All records updated.' });
      setImportText('');
    } catch (err) {
      setImportMessage({ text: 'Invalid JSON format or Sync Key. Please verify the structure.', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Personal Account & Aspirant Profile Section */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#172A46] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                Aspirant Personalization & Account Profile
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#A3ADBD]">
                Customize your name, aspirant roll number, optional subject, and personal passcode PIN.
              </p>
            </div>
          </div>
          {profileSaved && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
                Full Name / Title
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. IAS Raj Sharma"
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-xs text-[#17202A] dark:text-[#F7F5F0] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
                Username / Call Sign
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. mussoorie_2027"
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-xs text-[#17202A] dark:text-[#F7F5F0] font-mono-num font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
                Aspirant Roll / Cadre ID
              </label>
              <input
                type="text"
                value={aspirantId}
                onChange={(e) => setAspirantId(e.target.value)}
                placeholder="e.g. MM-2027-IAS"
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-xs text-[#17202A] dark:text-[#F7F5F0] font-mono-num font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
                Optional Subject Choice
              </label>
              <input
                type="text"
                value={optionalSubject}
                onChange={(e) => setOptionalSubject(e.target.value)}
                placeholder="e.g. Public Administration / Sociology / PSIR"
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-xs text-[#17202A] dark:text-[#F7F5F0] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
                Preferred State / Home Cadre
              </label>
              <input
                type="text"
                value={targetCadre}
                onChange={(e) => setTargetCadre(e.target.value)}
                placeholder="e.g. Gujarat / AGMUT / Uttarakhand"
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-xs text-[#17202A] dark:text-[#F7F5F0] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
              Personal Goal Motto / Vision Banner
            </label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="e.g. LBSNAA Mussoorie 2027 • Rank 1 Mission"
              className="w-full px-3 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-xs text-[#17202A] dark:text-[#F7F5F0] font-medium"
            />
          </div>

          {/* Passcode Security PIN Lock */}
          <div className="pt-3 border-t border-[#E6E2DA] dark:border-[#2A3648] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pinEnabledToggle"
                checked={isPinEnabled}
                onChange={(e) => setIsPinEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#172A46] focus:ring-[#172A46]"
              />
              <label htmlFor="pinEnabledToggle" className="text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] cursor-pointer flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#C8873D]" /> Enable Passcode PIN Protection
              </label>
            </div>

            {isPinEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#667085] dark:text-[#A3ADBD]">4-Digit Secret PIN:</span>
                <input
                  type="password"
                  maxLength={4}
                  value={passcodePin}
                  onChange={(e) => setPasscodePin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="1234"
                  className="w-20 px-2.5 py-1 text-center font-mono-num font-bold rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-xs"
                />
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-[#172A46] hover:bg-[#233B5D] text-white text-xs font-bold rounded-lg transition-colors ml-auto shadow-xs"
            >
              Save Profile Preferences
            </button>
          </div>
        </form>
      </div>

      {/* 2. Real-Time Cross-Device Data Sync Section */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                  Real-Time Cross-Device Sync Link
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30">
                  Instant Sync
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                Share or bookmark this personal Sync URL on your mobile, tablet, or laptop to instantly open your progress anywhere.
              </p>
            </div>
          </div>
        </div>

        {/* Sync Link Box */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648] rounded-lg p-2">
            <input
              type="text"
              readOnly
              value={getSyncUrl()}
              className="bg-transparent text-xs font-mono-num text-[#17202A] dark:text-[#F7F5F0] flex-1 outline-hidden truncate px-1 select-all"
            />
            <button
              type="button"
              onClick={handleCopySyncUrl}
              className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
            >
              {syncUrlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {syncUrlCopied ? 'Sync Link Copied!' : 'Copy Sync URL'}
            </button>
          </div>

          <p className="text-[11px] text-[#667085] dark:text-[#A3ADBD] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            Opening this link on any new browser or mobile phone will merge your topics, revisions & profile in 1 second.
          </p>
        </div>
      </div>

      {/* 3. Interface & Visual Theme */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
          Interface & Visual Theme
        </h2>
        <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mb-4">
          Select your preferred display mode. Settings are preserved on this browser.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onUpdateState({ theme: id as AppTheme })}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                state.theme === id
                  ? 'border-[#172A46] bg-[#172A46] text-white shadow-2xs'
                  : 'border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] hover:border-[#172A46]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Immediate Target Section */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
          Immediate Target Section
        </h2>
        <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mb-4">
          Configure unlocking rules and priority subjects.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-2">
              Next Priority Subjects
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Polity',
                'Geography',
                'History',
                'Economy',
                'Optional : Public Administration',
                'Env & Ecology',
                'Sci & Tech',
                'Essay',
                'Ethics',
                'Indian Language : Gujarati',
                'Answer Writing',
                'PYQs',
                'Mock Tests'
              ].map(subj => (
                <button 
                  key={subj}
                  onClick={() => {
                    const currentOrder = state.targetsConfig?.subjectOrder || [];
                    const newOrder = currentOrder.includes(subj) 
                      ? currentOrder.filter(s => s !== subj)
                      : [...currentOrder, subj];
                    onUpdateState({ targetsConfig: { ...state.targetsConfig, subjectOrder: newOrder } });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    state.targetsConfig?.subjectOrder?.includes(subj)
                      ? 'border-[#C8873D] bg-[#FFF8E6] dark:bg-[#2A2314] text-[#C8873D]'
                      : 'border-[#E6E2DA] dark:border-[#2A3648] text-[#667085] dark:text-[#A3ADBD]'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'english', label: 'English', key: 'englishDays' as const },
              { id: 'csat', label: 'CSAT', key: 'aptitudeDays' as const }
            ].map(({ id, label, key }) => {
              const currentDays: number[] = Array.isArray(state.targetsConfig?.[key]) 
                ? (state.targetsConfig[key] as any[]).map(d => typeof d === 'number' ? d : Number(d)).filter(d => !isNaN(d))
                : [];

              return (
                <div key={id}>
                  <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1.5">
                    {label} Allotted Days
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                      const active = currentDays.includes(i);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            const newDays = active 
                              ? currentDays.filter(day => day !== i)
                              : [...currentDays, i];
                            onUpdateState({ targetsConfig: { ...state.targetsConfig, [key]: newDays } });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            active 
                              ? 'bg-[#172A46] text-white dark:bg-[#8FB0F0] dark:text-[#0E1520] shadow-2xs scale-105' 
                              : 'bg-[#F7F5F0] dark:bg-[#0E1520] text-[#667085] dark:text-[#A3ADBD] hover:bg-black/5 dark:hover:bg-white/5 border border-[#E6E2DA] dark:border-[#2A3648]'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['VisionIAS', 'PIB'].map(item => (
              <div key={item}>
                <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
                  {item} Day of Month
                </label>
                <select
                  value={state.targetsConfig[item === 'VisionIAS' ? 'visionDay' : 'pibDay']}
                  onChange={e => onUpdateState({ targetsConfig: { ...state.targetsConfig, [item === 'VisionIAS' ? 'visionDay' : 'pibDay']: parseInt(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-xs font-mono-num font-semibold"
                >
                  {Array.from({length: 28}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648] text-xs text-[#667085] dark:text-[#A3ADBD] space-y-1">
            <p><span className="font-semibold text-[#C8873D]">🔓 PYQs Rule:</span> Unlocked after first reading of every subject is 100% complete.</p>
            <p><span className="font-semibold text-[#C8873D]">🔓 Mock Test Rule:</span> Unlocked after the first cycle of the full syllabus is done.</p>
          </div>
        </div>
      </div>

      {/* 5. WhatsApp Daily Reminder Integration */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-[#25D366] shrink-0">
              <Send className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                  WhatsApp Daily Study Reminders
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366]">
                  Active
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                Automatically formats today's topic list, revision queue ({calc.revisionsDue.length} due), and mock/CSAT targets into an instant WhatsApp briefing.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenWhatsAppModal}
            className="px-4 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs shrink-0 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
            <span>Open WhatsApp Briefing Dispatcher</span>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E6E2DA] dark:border-[#2A3648] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648]">
            <span className="text-[#667085] dark:text-[#A3ADBD] block">Saved Target Phone:</span>
            <span className="font-mono-num font-semibold text-[#17202A] dark:text-[#F7F5F0]">
              {state.whatsAppConfig?.phone || 'Not set (prompt in chat)'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648]">
            <span className="text-[#667085] dark:text-[#A3ADBD] block">WATI API Endpoint:</span>
            <span className="font-mono-num font-semibold text-[#16A34A] truncate block" title={state.whatsAppConfig?.watiEndpoint || 'https://live-mt-server.wati.io/10265277'}>
              {state.whatsAppConfig?.watiEndpoint || 'https://live-mt-server.wati.io/10265277'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648]">
            <span className="text-[#667085] dark:text-[#A3ADBD] block">WATI Method:</span>
            <span className="font-mono-num font-semibold text-[#17202A] dark:text-[#F7F5F0]">
              sendTemplateMessage ({state.whatsAppConfig?.watiTemplateName || 'mission_mussoorie_reminder'})
            </span>
          </div>
        </div>
      </div>

      {/* 6. Export & Backup Section */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
          Data Export & Backup
        </h2>
        <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mb-4">
          Export your complete preparation progress as standard JSON or CSV (openable in Microsoft Excel / Google Sheets).
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleCopy('json')}
            className="px-3.5 py-2 text-xs font-semibold bg-[#172A46] text-white hover:bg-[#233B5D] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedType === 'json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedType === 'json' ? 'JSON Copied!' : 'Copy JSON'}
          </button>

          <button
            onClick={() => handleDownload('json')}
            className="px-3.5 py-2 text-xs font-semibold border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] hover:border-[#172A46] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download .json
          </button>

          <button
            onClick={() => handleCopy('csv')}
            className="px-3.5 py-2 text-xs font-semibold bg-[#28745A] text-white hover:bg-[#1F5C47] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedType === 'csv' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedType === 'csv' ? 'CSV Copied!' : 'Copy CSV'}
          </button>

          <button
            onClick={() => handleDownload('csv')}
            className="px-3.5 py-2 text-xs font-semibold border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] hover:border-[#28745A] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download .csv (Excel)
          </button>
        </div>

        {/* Restore Backup Area */}
        <div className="mt-5 pt-5 border-t border-[#E6E2DA] dark:border-[#2A3648]">
          <h3 className="text-sm font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
            Restore Backup or Sync Code
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mb-2">
            Paste JSON content or a Sync Link exported from another device to restore progress:
          </p>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='Paste Sync Link or {"x": {...}, "d": {...}} here...'
            className="w-full h-24 p-3 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] text-xs font-mono font-mono-num leading-relaxed"
          />

          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={handleImportJson}
              className="px-4 py-2 bg-[#172A46] text-white hover:bg-[#233B5D] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Restore Progress
            </button>

            {importMessage && (
              <span
                className={`text-xs font-medium ${
                  importMessage.isError ? 'text-[#B94A48]' : 'text-[#28745A]'
                }`}
              >
                {importMessage.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 7. Mobile App & APK Installation */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
              Mobile App & Standalone APK
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
              Install the app directly onto your Android/iOS phone or build a standalone <code>.apk</code> package.
            </p>
          </div>
          <button
            onClick={() => setIsPwaModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-[#172A46] text-white hover:bg-[#1E3A5F] rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#F59E0B]" /> Install / Get APK
          </button>
        </div>
      </div>

      {/* 8. Demo Data & Reset Safety */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
          Demo Preset & Reset
        </h2>
        <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mb-4">
          Quickly populate sample study records to explore all features, or clear the local database.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onLoadSampleData}
            className="px-4 py-2 text-xs font-semibold bg-[#FFF8E6] dark:bg-[#2A2314] text-[#C8873D] border border-[#F3E3B6] dark:border-[#4D3F22] hover:bg-[#FFEFC7] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Load Realistic Sample Progress (~35% Complete)
          </button>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 text-xs font-semibold text-[#B94A48] hover:bg-[#FFF5F5] dark:hover:bg-[#2D1B1B] border border-[#FAD2D2] dark:border-[#522929] rounded-lg transition-colors cursor-pointer"
            >
              Reset All Progress
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#B94A48] font-medium">Are you sure?</span>
              <button
                onClick={() => {
                  onResetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-[#B94A48] text-white hover:bg-[#A33937] rounded-md cursor-pointer"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#667085] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <PWAInstallModal isOpen={isPwaModalOpen} onClose={() => setIsPwaModalOpen(false)} />
    </div>
  );
};
