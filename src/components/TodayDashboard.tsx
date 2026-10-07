import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Check, Sparkles, Plus, Clock, Target, ArrowRight, Send, Upload, X, FileText, Printer, Download, Undo2 } from 'lucide-react';
import { CalcResult, AppState, SyllabusItem, TopicAttachment, DailyTargetState } from '../types';
import { GrowthArcDial } from './GrowthArcDial';
import { ALL_SUBJECTS, CORE_SUBJECTS, SUBJECT_COLORS, MOTIVATIONAL_QUOTES, ALL_ITEMS } from '../data/syllabus';
import { isItemDone, getActiveItems, formatDate, getIsoDate } from '../utils/calc';
import { YouTubeButton } from './YouTubeButton';
import { CATrackerButton } from './CATrackerButton';
import { MussoorieRoadmap } from './MussoorieRoadmap';

interface TodayDashboardProps {
  calc: CalcResult;
  state: AppState;
  onToggleTopic: (id: string, date?: string, minutes?: number) => void;
  onSaveAttachment: (id: string, attachment: TopicAttachment | null) => void;
  onLogStudySession: (minutes: number, subject: string, note?: string) => void;
  onUpdateDailyTargets?: (dailyTargets: DailyTargetState) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenWhatsAppModal: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  calc,
  state,
  onToggleTopic,
  onSaveAttachment,
  onLogStudySession,
  onUpdateDailyTargets,
  onNavigateToTab,
  onOpenWhatsAppModal
}) => {
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState(CORE_SUBJECTS[0]);
  const [timerPreset, setTimerPreset] = useState<number | null>(null); // minutes
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Completion Modal State
  const [completionItem, setCompletionItem] = useState<SyllabusItem | null>(null);
  const [completionMinutes, setCompletionMinutes] = useState(60);
  const [completionAttachment, setCompletionAttachment] = useState<{ name: string; type: string; size: number; data: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Motivational quote cycling
  useEffect(() => {
    const qIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuoteIndex(qIdx);
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleStopAndLogTimer = () => {
    const minutes = Math.round(timerSeconds / 60);
    if (minutes > 0) {
      onLogStudySession(minutes, timerSubject);
    }
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && completionItem) {
        // Automatically rename file to topic name
        const extension = file.name.split('.').pop();
        const safeTopicName = completionItem.topic.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const newName = `${safeTopicName}.${extension}`;

        setCompletionAttachment({
          name: newName,
          type: file.type,
          size: file.size,
          data: event.target.result as string
        });
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFinishCompletion = () => {
    if (completionItem) {
      // 1. Toggle completion with actual minutes
      onToggleTopic(completionItem.id, undefined, completionMinutes);
      
      // 2. Save attachment if any
      if (completionAttachment) {
        onSaveAttachment(completionItem.id, completionAttachment);
      }
      
      // 3. Clear modal state
      setCompletionItem(null);
      setCompletionMinutes(60);
      setCompletionAttachment(null);
    }
  };

  const formatTimerTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to map friendly names to syllabus subject names
  const resolveSyllabusSubject = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('polity')) return 'Polity';
    if (lower.includes('geography')) return 'Geography';
    if (lower.includes('history')) return 'History';
    if (lower.includes('economy')) return 'Economy';
    if (lower.includes('pub') || lower.includes('administration')) return 'Optional : Public Administration';
    if (lower.includes('env') || lower.includes('ecology')) return 'Environment';
    if (lower.includes('sci')) return 'Sci and tech';
    if (lower.includes('essay')) return 'Essay';
    if (lower.includes('english')) return 'English';
    if (lower.includes('ethics')) return 'Ethics';
    if (lower.includes('csat') || lower.includes('aptitude') || lower.includes('reasoning')) return 'CSAT';
    if (lower.includes('gujarati') || lower.includes('language')) return 'Indian Language : Gujarati';
    if (lower.includes('answer') || lower.includes('writing')) return 'Answer writing';
    if (lower.includes('pyq')) return 'PYQs';
    if (lower.includes('mock')) return 'Mock tests';
    if (lower.includes('current')) return 'Current affairs';
    return name;
  };

  const isDaySelected = (dayArray: any[] | undefined, targetDay: number): boolean => {
    if (!dayArray || !Array.isArray(dayArray)) return false;
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const targetName = dayNames[targetDay];
    return dayArray.some(d => {
      if (typeof d === 'number') return d === targetDay;
      if (typeof d === 'string') {
        const str = d.trim().toLowerCase();
        return str.startsWith(targetName) || Number(str) === targetDay;
      }
      return false;
    });
  };

  // 1. Determine Today's Date String
  const todayStr = calc.todayStr || getIsoDate();
  const todayDateFormatted = formatDate(todayStr); // e.g. "05/10/2026"
  const activeItems = useMemo(() => getActiveItems(state), [state]);

  // 2. Compute Daily Target Batch for Today (2 CA + up to 4 Core/Scheduled)
  // Keeps topics completed today locked in place as [x] Completed without endless refilling.
  // Instantly responds to Settings changes in real time.
  const dailyTargetItems: SyllabusItem[] = useMemo(() => {
    const batch: SyllabusItem[] = [];

    // Part A: 2 Current Affairs topics for TODAY (The Hindu & The Indian Express)
    const hinduTodayDone = activeItems.find(it => it.k === 'hindu' && state.d[it.id] === todayStr);
    const hinduItem =
      hinduTodayDone ||
      activeItems.find(it => it.k === 'hindu' && it.topic.includes(todayDateFormatted)) ||
      activeItems.find(it => it.k === 'hindu' && !isItemDone(it, state)) ||
      activeItems.find(it => it.k === 'hindu');
    if (hinduItem) batch.push(hinduItem);

    const tieTodayDone = activeItems.find(it => it.k === 'tie' && state.d[it.id] === todayStr);
    const tieItem =
      tieTodayDone ||
      activeItems.find(it => it.k === 'tie' && it.topic.includes(todayDateFormatted)) ||
      activeItems.find(it => it.k === 'tie' && !isItemDone(it, state)) ||
      activeItems.find(it => it.k === 'tie');
    if (tieItem) batch.push(tieItem);

    // Part B: Up to 4 Other Topics (Vision, PIB, English, CSAT, Core Priority)
    const otherTopics: SyllabusItem[] = [];
    const TOTAL_SLOTS = 4;

    const targets = state.targetsConfig || {
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
    };

    const now = new Date();
    const todayDayOfWeek = now.getDay(); // 0-6
    const todayDateOfMonth = now.getDate(); // 1-31

    // Priority 1: VISION (1 topic on visionDay)
    const isVisionDay = Number(targets.visionDay) === todayDateOfMonth;
    if (isVisionDay && otherTopics.length < TOTAL_SLOTS) {
      const visionTodayDone = activeItems.find(it => it.k === 'vision' && state.d[it.id] === todayStr);
      const visionItem = visionTodayDone || activeItems.find((it) => it.k === 'vision' && !isItemDone(it, state));
      if (visionItem) otherTopics.push(visionItem);
    }

    // Priority 2: PIB (1 topic on pibDay)
    const isPibDay = Number(targets.pibDay) === todayDateOfMonth;
    if (isPibDay && otherTopics.length < TOTAL_SLOTS) {
      const pibTodayDone = activeItems.find(it => it.k === 'pib' && state.d[it.id] === todayStr);
      const pibItem = pibTodayDone || activeItems.find((it) => it.k === 'pib' && !isItemDone(it, state));
      if (pibItem) otherTopics.push(pibItem);
    }

    // Priority 3: English (1 topic on allotted weekdays)
    const isEnglishDay = isDaySelected(targets.englishDays, todayDayOfWeek);
    if (isEnglishDay && otherTopics.length < TOTAL_SLOTS) {
      const englishTodayDone = activeItems.find(it => it.subj.toLowerCase() === 'english' && state.d[it.id] === todayStr);
      const englishItem = englishTodayDone || activeItems.find((it) => it.subj.toLowerCase() === 'english' && !isItemDone(it, state));
      if (englishItem) otherTopics.push(englishItem);
    }

    // Priority 4: CSAT (1 topic on allotted weekdays)
    const isCsatDay = isDaySelected(targets.aptitudeDays, todayDayOfWeek);
    if (isCsatDay && otherTopics.length < TOTAL_SLOTS) {
      const csatTodayDone = activeItems.find(it => (it.subj === 'CSAT' || it.k === 'csat' || it.subj.toLowerCase() === 'aptitude & reasoning') && state.d[it.id] === todayStr);
      const csatItem = csatTodayDone || activeItems.find((it) => (it.subj === 'CSAT' || it.k === 'csat' || it.subj.toLowerCase() === 'aptitude & reasoning') && !isItemDone(it, state));
      if (csatItem) otherTopics.push(csatItem);
    }

    // Priority 5: Core Subjects (fill whatever remaining slots exist up to 4)
    const remainingSlots = TOTAL_SLOTS - otherTopics.length;
    if (remainingSlots > 0) {
      const selectedSubjects = (targets.subjectOrder || [])
        .map(s => resolveSyllabusSubject(s))
        .filter(s => s.toLowerCase() !== 'current affairs');

      const numSubjects = selectedSubjects.length;
      let limits: number[] = [];

      if (numSubjects === 1) {
        limits = [remainingSlots];
      } else if (numSubjects === 2) {
        limits = [Math.min(2, remainingSlots), Math.max(0, remainingSlots - 2)];
      } else if (numSubjects === 3) {
        limits = [Math.min(2, remainingSlots), Math.min(1, Math.max(0, remainingSlots - 2)), Math.max(0, remainingSlots - 3)];
      } else {
        limits = [Math.min(2, remainingSlots), 1, 1, 1];
        while (limits.length < numSubjects) limits.push(1);
      }

      const coreTopics: SyllabusItem[] = [];
      selectedSubjects.forEach((subj, idx) => {
        if (coreTopics.length >= remainingSlots) return;
        const limit = limits[idx] || 1;
        if (limit <= 0) return;

        // 1st Priority: Any topics for this subject completed TODAY
        const doneToday = activeItems.filter(it => it.subj.toLowerCase() === subj.toLowerCase() && state.d[it.id] === todayStr);
        doneToday.forEach(item => {
          if (coreTopics.length < remainingSlots && !coreTopics.some(t => t.id === item.id)) {
            coreTopics.push(item);
          }
        });

        // Fill remaining quota with unticked topics
        const needed = limit - doneToday.length;
        if (needed > 0) {
          const unticked = activeItems.filter(it => it.subj.toLowerCase() === subj.toLowerCase() && !isItemDone(it, state));
          const toTake = unticked.slice(0, needed);
          toTake.forEach(item => {
            if (coreTopics.length < remainingSlots && !coreTopics.some(t => t.id === item.id)) {
              coreTopics.push(item);
            }
          });
        }
      });

      coreTopics.forEach(item => otherTopics.push(item));
    }

    otherTopics.forEach(item => {
      if (!batch.some(t => t.id === item.id)) {
        batch.push(item);
      }
    });

    return batch;
  }, [state, todayStr, todayDateFormatted, activeItems]);

  // Persist locked batch for today to AppState so it stays consistent during the day
  useEffect(() => {
    if (dailyTargetItems.length > 0 && (!state.dailyTargets || state.dailyTargets.date !== todayStr)) {
      onUpdateDailyTargets?.({
        date: todayStr,
        topicIds: dailyTargetItems.map(it => it.id)
      });
    }
  }, [dailyTargetItems, state.dailyTargets, todayStr, onUpdateDailyTargets]);

  const totalDailyCount = dailyTargetItems.length;
  const doneDailyCount = dailyTargetItems.filter(it => isItemDone(it, state)).length;
  const isAllDailyDone = totalDailyCount > 0 && doneDailyCount === totalDailyCount;

  // Calculate velocity max for chart scaling
  const maxVelocity = Math.max(240, ...calc.dailyVelocityMinutes.map((v) => v[1]));

  return (
    <div className="space-y-6">
      {/* Top Dial & KPI Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Growth Arc Dial */}
        <div className="lg:col-span-5">
          <GrowthArcDial
            score={calc.legacyScorePct * 100}
            isLegacy={state.mode === 'legacy'}
          />
        </div>

        {/* 4 Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          {/* Card 1: Syllabus Done */}
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs text-[#667085] dark:text-[#A3ADBD] font-medium">
              Syllabus Completed
            </span>
            <div className="my-2">
              <span className="text-3xl font-bold font-mono-num text-[#17202A] dark:text-[#F7F5F0]">
                {(calc.syllabusDonePct * 100).toFixed(1)}%
              </span>
              <div className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                {calc.doneCoreCount} of {calc.totalCoreCount} core modules
              </div>
            </div>
            <div className="w-full bg-[#E6E2DA] dark:bg-[#2A3648] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#28745A] h-full transition-all duration-500"
                style={{ width: `${Math.min(100, calc.syllabusDonePct * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Performance / Retention */}
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs text-[#667085] dark:text-[#A3ADBD] font-medium">
              {state.mode === 'legacy' ? 'Legacy Performance' : 'Spaced Retention Score'}
            </span>
            <div className="my-2">
              <span className="text-3xl font-bold font-mono-num text-[#17202A] dark:text-[#F7F5F0]">
                {(calc.performanceScorePct * 100).toFixed(1)}%
              </span>
              <div className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                {calc.totalRevisionsDone} revision rounds completed
              </div>
            </div>
            <div className="w-full bg-[#E6E2DA] dark:bg-[#2A3648] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#C8873D] h-full transition-all duration-500"
                style={{ width: `${Math.min(100, calc.performanceScorePct * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Hours Studied */}
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs text-[#667085] dark:text-[#A3ADBD] font-medium">
              Hours Invested
            </span>
            <div className="my-2">
              <span className="text-3xl font-bold font-mono-num text-[#17202A] dark:text-[#F7F5F0]">
                {calc.totalStudyHours.toFixed(1)}
              </span>
              <span className="text-xs text-[#667085] dark:text-[#A3ADBD] ml-1">hrs total</span>
              <div className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                ~{calc.studyVelocityPerDay.toFixed(1)} topics / day average
              </div>
            </div>
            <div className="text-xs text-[#28745A] font-medium">
              Every minute compounds
            </div>
          </div>

          {/* Card 4: Projected Finish */}
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs text-[#667085] dark:text-[#A3ADBD] font-medium">
              Projected Finish Date
            </span>
            <div className="my-2">
              <span className="text-xl sm:text-2xl font-bold font-mono-num text-[#17202A] dark:text-[#F7F5F0]">
                {calc.projectedFinishDate ? formatDate(calc.projectedFinishDate) : 'Read 1st topic'}
              </span>
              <div className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                Target Prelims: {formatDate(state.exam)}
              </div>
            </div>
            <div className="text-xs text-[#667085] dark:text-[#A3ADBD]">
              {calc.daysToExam > 0 ? `${calc.daysToExam} days remaining` : 'Exam day reached'}
            </div>
          </div>
        </div>
      </div>

      {/* Mission Mussoorie 1,593 KM Highway Roadmap */}
      <MussoorieRoadmap scorePct={calc.legacyScorePct * 100} />

      {/* Revisions Alert Banner if Revisions Due */}
      {calc.revisionsDue.length > 0 && (
        <div className="bg-[#FFF8E6] dark:bg-[#2A2314] border border-[#F3E3B6] dark:border-[#4D3F22] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E0A458]/20 flex items-center justify-center text-[#C8873D]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                {calc.revisionsDue.length} Spaced Revisions Due Today
              </div>
              <div className="text-xs text-[#667085] dark:text-[#A3ADBD]">
                Active recall at planned intervals creates permanent long-term memory.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('rev')}
            className="px-3.5 py-1.5 bg-[#C8873D] hover:bg-[#B3742E] text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
          >
            Open Revision Queue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Two Column Layout: Next Up & Velocity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Next Up Checklist */}
        <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                    Immediate Targets
                  </h2>
                  <span className="text-[10px] font-bold font-mono-num px-2 py-0.5 rounded-full bg-[#172A46]/10 dark:bg-white/10 text-[#172A46] dark:text-[#F7F5F0]">
                    {doneDailyCount} / {totalDailyCount} done
                  </span>
                </div>
                <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                  Locked daily batch for {todayDateFormatted} (2 Daily CA + up to 4 Core)
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('topics')}
                className="text-xs text-[#172A46] dark:text-[#8FB0F0] font-semibold hover:underline"
              >
                View all topics →
              </button>
            </div>

            {/* Celebratory Bingo Banner if all targets for today are completed */}
            {isAllDailyDone && (
              <div className="bg-gradient-to-r from-emerald-500/15 via-amber-500/10 to-teal-500/15 border border-emerald-500/40 dark:border-emerald-500/30 rounded-xl p-4 mb-3.5 text-center shadow-xs">
                <div className="text-2xl mb-1">🎉 🎯 🎉</div>
                <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  Bingo! All daily targets completed.
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 font-medium">
                  Outstanding discipline! Have fun and rest for the rest of the day. New targets will load automatically on tomorrow's date.
                </p>
              </div>
            )}

            <div className="divide-y divide-[#E6E2DA] dark:divide-[#2A3648]">
              {dailyTargetItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#667085] dark:text-[#A3ADBD]">
                  🎉 All standard topics have been ticked!
                </div>
              ) : (
                dailyTargetItems.map((item) => {
                  const done = isItemDone(item, state);

                  return (
                    <div
                      key={item.id}
                      className={`py-2.5 flex items-center justify-between gap-3 group transition-colors ${
                        done ? 'opacity-85' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {done ? (
                          <button
                            onClick={() => onToggleTopic(item.id)}
                            className="mt-0.5 w-5 h-5 rounded bg-[#28745A] border border-[#28745A] flex items-center justify-center text-white transition-all shrink-0 shadow-2xs hover:bg-[#1E5C47]"
                            title="Completed! Click to uncheck"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setCompletionItem(item)}
                            className="mt-0.5 w-5 h-5 rounded border-2 border-[#C8873D] flex items-center justify-center bg-white dark:bg-[#162131] hover:bg-[#C8873D]/15 text-transparent transition-colors shrink-0"
                            title="Mark complete with study minutes & notes"
                          >
                            <Check className="w-3.5 h-3.5 text-[#C8873D] opacity-0 group-hover:opacity-40" />
                          </button>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div
                              className={`text-sm font-medium leading-snug ${
                                done
                                  ? 'text-[#64748B] dark:text-[#94A3B8] line-through'
                                  : 'text-[#17202A] dark:text-[#F7F5F0]'
                              }`}
                            >
                              {item.topic}
                            </div>
                            {done && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Completed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                            <span
                              className="font-semibold"
                              style={{ color: SUBJECT_COLORS[item.subj] || 'currentColor' }}
                            >
                              {item.sec && item.sec !== item.subj ? `${item.subj} (${item.sec})` : item.subj}
                            </span>
                            <span>·</span>
                            <span>{item.m} mins</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {(item.k === 'hindu' || item.k === 'tie') && (
                          <CATrackerButton />
                        )}
                        <YouTubeButton topic={item.topic} subject={item.subj} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E6E2DA] dark:border-[#2A3648] flex items-center justify-between text-xs text-[#667085] dark:text-[#A3ADBD]">
            <span>
              {doneDailyCount} of {totalDailyCount} targets finished
            </span>
            <span className="font-mono-num font-medium">
              {totalDailyCount > 0 ? Math.round((doneDailyCount / totalDailyCount) * 100) : 0}% day score
            </span>
          </div>
        </div>

        {/* 7-Day Velocity Chart */}
        <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                  Study Velocity (Last 7 Days)
                </h2>
                <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-1">
                  Daily focus minutes across the last week.
                </p>
              </div>
            </div>

            {/* Bars & Labels Container */}
            <div className="mt-6">
              <div className="flex items-stretch justify-between gap-3 h-32 px-2">
                {calc.dailyVelocityMinutes.map(([date, minutes], idx) => {
                  const heightPct = minutes > 0 ? Math.min(100, Math.max(6, (minutes / maxVelocity) * 100)) : 0;
                  let barColor = 'transparent';
                  if (minutes >= 240) barColor = '#28745A';
                  else if (minutes >= 120) barColor = '#D97706';
                  else if (minutes > 0) barColor = '#B94A48';

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end">
                      <span className="text-[10px] font-mono-num font-semibold text-[#667085] dark:text-[#A3ADBD] mb-1.5">
                        {minutes > 0 ? `${minutes}m` : ''}
                      </span>
                      <div
                        className={`w-full rounded-t-sm transition-all duration-500 shadow-2xs ${
                          minutes === 0 ? 'h-0' : ''
                        }`}
                        style={{
                          height: minutes > 0 ? `${heightPct}%` : '0px',
                          backgroundColor: minutes > 0 ? barColor : 'transparent'
                        }}
                        title={`${date}: ${minutes} mins studied`}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Solid Axis Line */}
              <div className="h-px w-full bg-[#E6E2DA] dark:bg-[#2A3648] mt-px" />
              
              <div className="flex justify-between gap-3 px-2 mt-2">
                {calc.dailyVelocityMinutes.map(([date], idx) => {
                  // DD-MM format
                  const dayLabel = date.slice(8) + '-' + date.slice(5, 7);
                  return (
                    <div key={idx} className="flex-1 text-center">
                      <span className="text-[10px] font-mono-num text-[#667085] dark:text-[#A3ADBD]">
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E6E2DA] dark:border-[#2A3648] flex items-center justify-between text-xs text-[#667085] dark:text-[#A3ADBD]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B94A48]" /> &lt;2h
              <span className="w-2 h-2 rounded-full bg-[#D97706] ml-2" /> 2–4h
              <span className="w-2 h-2 rounded-full bg-[#28745A] ml-2" /> 4h+
            </span>
            <span className="font-mono-num font-medium text-[#17202A] dark:text-[#F7F5F0]">
              7-Day Total: {calc.dailyVelocityMinutes.reduce((a, b) => a + b[1], 0)}m
            </span>
          </div>
        </div>
      </div>

      {/* Subject Progress Grid */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1">
          Subject-wise Syllabus Completion
        </h2>
        <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mb-4">
          All {ALL_SUBJECTS.length} curriculum pillars of the Civil Services examination syllabus
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {ALL_SUBJECTS.map((subj) => {
            const stat = calc.subjectStats[subj] || { total: 0, done: 0, pct: 0 };
            const pct = Math.round(stat.pct * 100);
            const color = SUBJECT_COLORS[subj] || '#172A46';

            return (
              <div key={subj} className="flex items-center gap-3 py-1">
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {subj[0]}
                </span>
                <span className="text-xs font-medium text-[#17202A] dark:text-[#F7F5F0] w-28 truncate">
                  {subj}
                </span>
                <div className="flex-1 bg-[#E6E2DA] dark:bg-[#2A3648] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
                <span className="text-xs font-mono-num font-medium text-[#667085] dark:text-[#A3ADBD] w-14 text-right">
                  {stat.done}/{stat.total} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Academy Quote */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#172A46]/5 to-[#C8873D]/10 border border-[#E6E2DA] dark:border-[#2A3648] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#C8873D] shrink-0" />
          <div>
            <div className="text-sm italic font-reading text-[#172A46] dark:text-[#F7F5F0]">
              "{MOTIVATIONAL_QUOTES[quoteIndex].text}"
            </div>
            <div className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
              — {MOTIVATIONAL_QUOTES[quoteIndex].author}
            </div>
          </div>
        </div>
        <button
          onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
          className="text-xs text-[#C8873D] hover:underline shrink-0 ml-3"
        >
          Next Quote
        </button>
      </div>

      {/* Completion Modal */}
      {completionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#E6E2DA] dark:border-[#2A3648] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#17202A] dark:text-[#F7F5F0]">
                  Mark Module Complete
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#A3ADBD]">
                  {completionItem.topic} ({completionItem.subj})
                </p>
              </div>
              <button
                onClick={() => setCompletionItem(null)}
                className="text-[#667085] hover:text-[#17202A] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Time Input */}
              <div>
                <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1.5">
                  Actual Study Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 w-4 h-4 text-[#667085]" />
                  <input
                    type="number"
                    value={completionMinutes}
                    onChange={(e) => setCompletionMinutes(parseInt(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648] rounded-lg text-sm font-mono-num font-semibold"
                    placeholder="e.g. 60"
                  />
                </div>
                <p className="text-[10px] text-[#667085] dark:text-[#A3ADBD] mt-1">
                  Default: 60 mins. This updates your total hours and growth arc.
                </p>
              </div>

              {/* Attachment Input */}
              <div>
                <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-1.5">
                  Attach Study Notes (PDF, Image, Text)
                </label>
                {!completionAttachment ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#E6E2DA] dark:border-[#2A3648] rounded-xl bg-[#F7F5F0]/50 dark:bg-[#0E1520]/50 hover:bg-[#F7F5F0] dark:hover:bg-[#0E1520] transition-colors cursor-pointer group">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                      <Upload className="w-6 h-6 text-[#667085] dark:text-[#A3ADBD] group-hover:text-[#C8873D] transition-colors mb-2" />
                      <p className="text-xs text-[#667085] dark:text-[#A3ADBD]">
                        <span className="font-semibold text-[#C8873D]">Click to upload</span> or drag and drop
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[#F0FDF4] dark:bg-[#132A1C] border border-[#DCFCE7] dark:border-[#1E4D2B] rounded-lg">
                    <div className="flex items-center gap-3 truncate">
                      <FileText className="w-5 h-5 text-[#16A34A] shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-bold text-[#111827] dark:text-[#F7F5F0] truncate">
                          {completionAttachment.name}
                        </div>
                        <div className="text-[10px] text-[#16A34A]">
                          {(completionAttachment.size / 1024).toFixed(1)} KB Ready
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCompletionAttachment(null)}
                      className="p-1 text-[#667085] hover:text-[#DC2626] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCompletionItem(null)}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-[#667085] hover:text-[#17202A] dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinishCompletion}
                className="flex-3 px-4 py-2.5 bg-[#28745A] hover:bg-[#1F5C47] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#28745A]/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" /> Confirm & Log Completion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
