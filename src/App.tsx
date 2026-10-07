import React, { useState, useEffect, useMemo } from 'react';
import { Hero } from './components/Hero';
import { TodayDashboard } from './components/TodayDashboard';
import { TopicsList } from './components/TopicsList';
import { RevisionCockpit } from './components/RevisionCockpit';
import { MocksTracker } from './components/MocksTracker';
import { DataSettings } from './components/DataSettings';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { PineSilhouetteFooter } from './components/PineSilhouetteFooter';
import { PWAInstallButton } from './components/PWAInstallButton';
import { UserAccountButton } from './components/UserAccountButton';
import { useFirebaseSync } from './utils/useFirebaseSync';
import { AppState, AppTheme, CalcMode, MockScore, WhatsAppConfig, SyllabusItem, TopicAttachment, DailyTargetState } from './types';
import { calculateMetrics, getIsoDate, addDays } from './utils/calc';
import { ALL_ITEMS } from './data/syllabus';
import { Send } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { DEFAULT_WATI_ENDPOINT, DEFAULT_WATI_TOKEN, DEFAULT_WATI_TEMPLATE } from './utils/whatsapp';

const STORAGE_KEY = 'mm27_state_v2';
const LEGACY_STORAGE_KEY = 'mm27';

const DEFAULT_STATE: AppState = {
  theme: 'system',
  mode: 'corrected',
  exam: '2027-05-23',
  x: {},
  d: {},
  r: {},
  starred: {},
  notes: {},
  attachments: {},
  topicMinutes: {},
  mockScores: {},
  studySessions: [],
  targetsConfig: {
    subjectOrder: [
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
    ],
    englishDays: [],
    aptitudeDays: [],
    visionDay: 1,
    pibDay: 10
  },
  whatsAppConfig: {
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
  },
  userProfile: {
    fullName: 'IAS Aspirant',
    username: 'mussoorie_2027',
    aspirantId: 'MM-2027-IAS',
    optionalSubject: 'Public Administration',
    targetCadre: 'Home Cadre',
    motto: 'LBSNAA Mussoorie 2027 • Rank 1 Mission',
    isPinEnabled: false,
    passcodePin: ''
  }
};

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'topics' | 'rev' | 'mocks' | 'data'>('today');
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Live Cloud Firebase Firestore & Auth Sync
  const { currentUser, isSyncing, lastSyncTime } = useFirebaseSync(state, setState, isLoaded);

  // Load state from IndexedDB (fallback to localStorage)
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Try IndexedDB
        const saved = await get(STORAGE_KEY);
        if (saved) {
          setState({
            ...DEFAULT_STATE,
            ...saved,
            targetsConfig: {
              ...DEFAULT_STATE.targetsConfig,
              ...(saved.targetsConfig || {})
            },
            whatsAppConfig: {
              ...DEFAULT_STATE.whatsAppConfig,
              ...(saved.whatsAppConfig || {})
            }
          });
        } else {
          // 2. Try localStorage (Migration)
          const lsSaved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
          if (lsSaved) {
            const parsed = JSON.parse(lsSaved);
            setState({
              ...DEFAULT_STATE,
              ...parsed,
              targetsConfig: {
                ...DEFAULT_STATE.targetsConfig,
                ...(parsed.targetsConfig || {})
              },
              whatsAppConfig: {
                ...DEFAULT_STATE.whatsAppConfig,
                ...(parsed.whatsAppConfig || {})
              }
            });
          }
        }

        // 3. Check for URL Sync parameter for cross-device instant sync
        const urlParams = new URLSearchParams(window.location.search);
        const syncDataParam = urlParams.get('sync');
        if (syncDataParam) {
          try {
            const decodedJson = decodeURIComponent(atob(syncDataParam));
            const synced = JSON.parse(decodedJson);
            if (synced && typeof synced.x === 'object') {
              setState((prev) => ({
                ...prev,
                x: { ...prev.x, ...synced.x },
                d: { ...prev.d, ...synced.d },
                r: { ...prev.r, ...synced.r },
                userProfile: synced.u ? { ...prev.userProfile, ...synced.u } : prev.userProfile
              }));
              // Clean URL query without reloading
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (e) {
            console.error('Failed to parse URL sync parameter', e);
          }
        }
      } catch (e) {
        console.error('Failed to load state from IndexedDB', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // Sync to IndexedDB
  useEffect(() => {
    if (!isLoaded) return;

    async function saveData() {
      try {
        await set(STORAGE_KEY, state);
      } catch (e) {
        console.error('Failed to save state to IndexedDB', e);
      }
    }
    saveData();
  }, [state, isLoaded]);

  // Apply visual theme
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (state.theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      // System match
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  }, [state.theme]);

  // Calculate live preparation metrics
  const calc = useMemo(() => calculateMetrics(state), [state]);

  // Format Today's Day & Date for upper left header
  const todayDisplayDate = useMemo(() => {
    const d = calc.todayStr ? new Date(calc.todayStr + 'T00:00:00Z') : new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[d.getUTCDay()];
    const dateNum = d.getUTCDate().toString().padStart(2, '0');
    const monthName = months[d.getUTCMonth()];
    const yearNum = d.getUTCFullYear();
    return `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
  }, [calc.todayStr]);

  // Handlers
  const handleToggleTopic = (id: string, customDate?: string, minutes?: number) => {
    if (!isLoaded) return;
    setState((prev) => {
      const isDone = Boolean(prev.x[id]);
      const newX = { ...prev.x };
      const newD = { ...prev.d };
      const newTM = { ...prev.topicMinutes };

      if (isDone) {
        delete newX[id];
        delete newD[id];
        delete newTM[id];
      } else {
        newX[id] = 1;
        newD[id] = customDate || newD[id] || getIsoDate();
        if (minutes !== undefined) {
          newTM[id] = minutes;
        }
      }

      return {
        ...prev,
        x: newX,
        d: newD,
        topicMinutes: newTM
      };
    });
  };

  const handleSaveAttachment = (id: string, attachment: TopicAttachment | null) => {
    if (!isLoaded) return;
    setState((prev) => {
      const newAttachments = { ...(prev.attachments || {}) };
      if (attachment) {
        newAttachments[id] = attachment;
      } else {
        delete newAttachments[id];
      }
      return {
        ...prev,
        attachments: newAttachments
      };
    });
  };

  const handleUpdateDailyTargets = (dailyTargets: DailyTargetState) => {
    if (!isLoaded) return;
    setState((prev) => ({
      ...prev,
      dailyTargets
    }));
  };

  const handleUpdateCompletionDate = (id: string, newDate: string) => {
    setState((prev) => ({
      ...prev,
      d: {
        ...prev.d,
        [id]: newDate
      }
    }));
  };

  const handleToggleStar = (id: string) => {
    setState((prev) => ({
      ...prev,
      starred: {
        ...prev.starred,
        [id]: !prev.starred?.[id]
      }
    }));
  };

  const handleSaveNote = (id: string, noteText: string) => {
    setState((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [id]: noteText
      }
    }));
  };

  const handleLogRevision = (id: string, revIndex: number) => {
    setState((prev) => {
      const existing = prev.r[id] ? [...prev.r[id]] : [0, 0, 0, 0, 0, 0, 0, 0];
      existing[revIndex] = existing[revIndex] ? 0 : 1;
      return {
        ...prev,
        r: {
          ...prev.r,
          [id]: existing
        }
      };
    });
  };

  const handleLogAllDueRevisions = () => {
    setState((prev) => {
      const newR = { ...prev.r };
      calc.revisionsDue.forEach(({ item, revIndex }) => {
        if (revIndex >= 0) {
          const arr = newR[item.id] ? [...newR[item.id]] : [0, 0, 0, 0, 0, 0, 0, 0];
          arr[revIndex] = 1;
          newR[item.id] = arr;
        }
      });
      return {
        ...prev,
        r: newR
      };
    });
  };

  const handleSaveMockScore = (id: string, score: MockScore) => {
    setState((prev) => ({
      ...prev,
      mockScores: {
        ...prev.mockScores,
        [id]: score
      }
    }));
  };

  const handleAddTopic = (newItem: { subj: string; sec: string; topic: string; m: number }) => {
    const secCfg = ALL_ITEMS.find((it) => it.sec === newItem.sec);
    const customId = `custom_${Date.now()}`;
    const customItem: SyllabusItem = {
      id: customId,
      k: secCfg ? secCfg.k : 'custom',
      subj: newItem.subj,
      sec: newItem.sec,
      row: 2000 + ((state.customItems || []).length + 1),
      m: newItem.m,
      topic: newItem.topic
    };
    setState((prev) => ({
      ...prev,
      customItems: [...(prev.customItems || []), customItem]
    }));
  };

  const handleEditTopic = (id: string, newTitle: string) => {
    setState((prev) => ({
      ...prev,
      editedTopics: {
        ...(prev.editedTopics || {}),
        [id]: newTitle
      }
    }));
  };

  const handleDeleteTopic = (id: string) => {
    setState((prev) => ({
      ...prev,
      deletedItemIds: {
        ...(prev.deletedItemIds || {}),
        [id]: true
      }
    }));
  };

  const handleLogStudySession = (minutes: number, subject: string, note?: string) => {
    const todayStr = getIsoDate();
    const newSession = {
      id: `sess_${Date.now()}`,
      date: todayStr,
      minutes,
      subject,
      note
    };
    setState((prev) => ({
      ...prev,
      studySessions: [...(prev.studySessions || []), newSession]
    }));
  };

  const handleUpdateExamDate = (date: string) => {
    if (!isLoaded) return;
    setState((prev) => ({ ...prev, exam: date }));
  };

  const handleToggleMode = (mode: CalcMode) => {
    if (!isLoaded) return;
    setState((prev) => ({ ...prev, mode }));
  };

  const handleUpdateWhatsAppConfig = (cfg: WhatsAppConfig) => {
    if (!isLoaded) return;
    setState((prev) => ({
      ...prev,
      whatsAppConfig: cfg
    }));
  };

  const handleUpdateState = (newState: Partial<AppState>) => {
    if (!isLoaded) return;
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Sample progress generator for instant demo & verification
  const handleLoadSampleData = () => {
    const todayStr = getIsoDate();
    const newX: Record<string, number> = {};
    const newD: Record<string, string> = {};
    const newR: Record<string, number[]> = {};
    const newStarred: Record<string, boolean> = {};
    const newNotes: Record<string, string> = {};
    const newMockScores: Record<string, MockScore> = {};

    // Complete ~35% of History, Polity, Geography, Economy
    const sampleItems = ALL_ITEMS.slice(0, 160);
    sampleItems.forEach((it, idx) => {
      newX[it.id] = 1;
      const daysAgo = (idx % 35) + 1;
      const compDate = addDays(todayStr, -daysAgo);
      newD[it.id] = compDate;

      // Realistic revisions based on age
      const rArr = [0, 0, 0, 0, 0, 0, 0, 0];
      if (daysAgo >= 1) rArr[0] = 1;
      if (daysAgo >= 7) rArr[1] = 1;
      if (daysAgo >= 15 && idx % 2 === 0) rArr[2] = 1; // leave some due/overdue
      newR[it.id] = rArr;

      if (idx % 8 === 0) newStarred[it.id] = true;
    });

    newNotes['hist0'] = "Mohenjo-daro: Great Bath, Bronze Dancing Girl, Pashupati Seal. Harappa: Granaries.";
    newNotes['pol7'] = "Fundamental Rights (Art 12-35): Part III, Magna Carta of India. Art 21 expanded in Maneka Gandhi.";

    // Sample Mocks
    newMockScores['mock0'] = { p1Score: 106.66, csatScore: 82.5, date: addDays(todayStr, -10), notes: "Polity 100% accuracy, need to review modern history dates" };
    newMockScores['mock1'] = { p1Score: 98.33, csatScore: 78.0, date: addDays(todayStr, -5), notes: "Silly mistake in CSAT reading comprehension tone questions" };
    newMockScores['mock2'] = { p1Score: 112.0, csatScore: 89.2, date: addDays(todayStr, -1), notes: "Great score! Strong environmental conventions revision." };

    newX['mock0'] = 1;
    newX['mock1'] = 1;
    newX['mock2'] = 1;

    setState((prev) => ({
      ...prev,
      x: newX,
      d: newD,
      r: newR,
      starred: newStarred,
      notes: newNotes,
      mockScores: newMockScores
    }));
  };

  const handleResetAllData = () => {
    setState({
      ...DEFAULT_STATE,
      theme: state.theme,
      mode: state.mode,
      exam: state.exam
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0E1520] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#172A46] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-[#172A46] dark:text-[#F7F5F0]">Loading your preparation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] flex flex-col transition-colors selection:bg-[#C8873D]/20 selection:text-[#172A46]">
      {/* Top Bar Contract: Zone 1 (Wordmark), Zone 2 (Nav links), Zone 3 (Primary Actions) */}
      <header className="sticky top-0 z-40 bg-[#F7F5F0]/90 dark:bg-[#0E1520]/90 backdrop-blur-md border-b border-[#E6E2DA] dark:border-[#2A3648]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark with live Day & Date */}
          <button
            onClick={() => setActiveTab('today')}
            className="text-left group flex flex-col justify-center shrink-0"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#172A46] dark:text-[#F7F5F0] font-serif-title group-hover:opacity-90 transition-opacity whitespace-nowrap leading-tight">
              Mission Mussoorie 2027
            </span>
            <span className="text-[11px] font-bold text-[#C8873D] dark:text-[#F59E0B] font-mono-num whitespace-nowrap leading-none mt-0.5">
              {todayDisplayDate}
            </span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-[#667085] dark:text-[#A3ADBD] overflow-x-auto py-1">
            {[
              { id: 'today', label: 'Dashboard' },
              { id: 'topics', label: 'Syllabus' },
              {
                id: 'rev',
                label: calc.revisionsDue.length > 0 ? `Revision (${calc.revisionsDue.length})` : 'Revision'
              },
              ...(calc.isMockUnlocked || calc.isPyqUnlocked ? [{ id: 'mocks', label: 'Mocks & PYQs' }] : []),
              { id: 'data', label: 'Setting' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#172A46] text-white dark:bg-[#8FB0F0] dark:text-[#0E1520] font-semibold shadow-2xs'
                    : 'hover:text-[#17202A] dark:hover:text-[#F7F5F0] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Action / Mode Tag */}
          <div className="flex items-center gap-2 shrink-0">
            <UserAccountButton
              currentUser={currentUser}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
            />
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Hero Section */}
        <Hero
          calc={calc}
          state={state}
        />

        {/* Tab Views */}
        {activeTab === 'today' && (
          <TodayDashboard
            calc={calc}
            state={state}
            onToggleTopic={handleToggleTopic}
            onSaveAttachment={handleSaveAttachment}
            onLogStudySession={handleLogStudySession}
            onUpdateDailyTargets={handleUpdateDailyTargets}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
            onOpenWhatsAppModal={() => setIsWhatsAppOpen(true)}
          />
        )}

        {activeTab === 'topics' && (
          <TopicsList
            calc={calc}
            state={state}
            onToggleTopic={handleToggleTopic}
            onToggleStar={handleToggleStar}
            onSaveNote={handleSaveNote}
            onSaveAttachment={handleSaveAttachment}
            onLogRevision={handleLogRevision}
            onUpdateCompletionDate={handleUpdateCompletionDate}
            onAddTopic={handleAddTopic}
            onEditTopic={handleEditTopic}
            onDeleteTopic={handleDeleteTopic}
          />
        )}

        {activeTab === 'rev' && (
          <RevisionCockpit
            calc={calc}
            state={state}
            onLogRevision={handleLogRevision}
            onLogAllDueRevisions={handleLogAllDueRevisions}
          />
        )}

        {activeTab === 'mocks' && (
          <MocksTracker
            calc={calc}
            state={state}
            onToggleTopic={handleToggleTopic}
            onSaveMockScore={handleSaveMockScore}
          />
        )}

        {activeTab === 'data' && (
          <DataSettings
            calc={calc}
            state={state}
            onUpdateState={handleUpdateState}
            onLoadSampleData={handleLoadSampleData}
            onResetAllData={handleResetAllData}
            onOpenWhatsAppModal={() => setIsWhatsAppOpen(true)}
          />
        )}

        {/* WhatsApp Daily Reminder Modal */}
        <WhatsAppReminderModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          calc={calc}
          state={state}
          onUpdateWhatsAppConfig={handleUpdateWhatsAppConfig}
        />
      </main>

      {/* Artistic Pine Silhouette Footer */}
      <PineSilhouetteFooter />
    </div>
  );
}
