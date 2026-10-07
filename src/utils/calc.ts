import { AppState, CalcResult, SyllabusItem } from '../types';
import { ALL_ITEMS, ALL_SUBJECTS, CORE_SUBJECTS, CURRENT_AFFAIRS_KEYS } from '../data/syllabus';

export const getIsoDate = (d: Date = new Date()): string => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

export const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const diffDays = (aStr: string, bStr: string): number => {
  const a = new Date(aStr + 'T00:00:00Z').getTime();
  const b = new Date(bStr + 'T00:00:00Z').getTime();
  return Math.round((a - b) / 86400000);
};

export const formatDate = (isoStr: string): string => {
  if (!isoStr || isoStr.length < 10) return isoStr;
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
};

export const formatDayMonth = (isoStr: string): string => {
  if (!isoStr || isoStr.length < 10) return isoStr;
  const [_, m, d] = isoStr.split('-');
  return `${d}/${m}`;
};

export const getRevisionOffsets = (mode: 'legacy' | 'corrected'): number[] => {
  return mode === 'legacy'
    ? [7, 15, 15, 30, 60, 90, 120, 240]
    : [1, 7, 15, 30, 60, 90, 120, 240];
};

export const isItemDone = (item: SyllabusItem, state: AppState): boolean => {
  if (state.mode === 'legacy' && item.k === 'pyq') return false;
  return Boolean(state.x[item.id]);
};

export const isCoreItem = (item: SyllabusItem): boolean => {
  return !CURRENT_AFFAIRS_KEYS.includes(item.k);
};

export const getActiveItems = (state: AppState): SyllabusItem[] => {
  const todayStr = getIsoDate();
  
  // Determine anchor date: use the completion date of the first newspaper, or earliest logged newspaper date, or fallback to today
  let hinduAnchorDate = state.d['hindu0'];
  if (!hinduAnchorDate) {
    const allHinduDates = Object.entries(state.d)
      .filter(([id, d]) => id.startsWith('hindu') && Boolean(d))
      .map(([_, d]) => d)
      .sort();
    if (allHinduDates.length > 0) {
      hinduAnchorDate = allHinduDates[0];
    }
  }

  let tieAnchorDate = state.d['tie0'];
  if (!tieAnchorDate) {
    const allTieDates = Object.entries(state.d)
      .filter(([id, d]) => id.startsWith('tie') && Boolean(d))
      .map(([_, d]) => d)
      .sort();
    if (allTieDates.length > 0) {
      tieAnchorDate = allTieDates[0];
    }
  }

  const defaultAnchor = hinduAnchorDate || tieAnchorDate || todayStr;
  const hinduBase = hinduAnchorDate || defaultAnchor;
  const tieBase = tieAnchorDate || defaultAnchor;

  const base = ALL_ITEMS.filter((it) => !state.deletedItemIds?.[it.id]).map((it) => {
    if (state.editedTopics?.[it.id]) {
      return { ...it, topic: state.editedTopics[it.id] };
    }

    // Dynamic sequential calendar dates for The Hindu (365 days)
    if (it.k === 'hindu') {
      const match = it.id.match(/^hindu(\d+)$/);
      if (match) {
        const dayIndex = parseInt(match[1], 10);
        const targetDate = addDays(hinduBase, dayIndex);
        return {
          ...it,
          topic: `The Hindu (${formatDate(targetDate)})`
        };
      }
    }

    // Dynamic sequential calendar dates for The Indian Express (365 days)
    if (it.k === 'tie') {
      const match = it.id.match(/^tie(\d+)$/);
      if (match) {
        const dayIndex = parseInt(match[1], 10);
        const targetDate = addDays(tieBase, dayIndex);
        return {
          ...it,
          topic: `Indian Express (${formatDate(targetDate)})`
        };
      }
    }

    return it;
  });

  if (state.customItems && state.customItems.length > 0) {
    const custom = state.customItems.filter((it) => !state.deletedItemIds?.[it.id]).map((it) => {
      if (state.editedTopics?.[it.id]) {
        return { ...it, topic: state.editedTopics[it.id] };
      }
      return it;
    });
    return [...base, ...custom];
  }
  return base;
};

export const calculateMetrics = (state: AppState): CalcResult => {
  const todayStr = getIsoDate();
  const daysToExam = diffDays(state.exam, todayStr);
  const isLegacy = state.mode === 'legacy';
  const offsets = getRevisionOffsets(state.mode);
  const activeItems = getActiveItems(state);

  // Subject accumulator
  const S: Record<string, { total: number; done: number; minutes: number; pct: number }> = {};
  ALL_SUBJECTS.forEach((subj) => {
    S[subj] = { total: 0, done: 0, minutes: 0, pct: 0 };
  });

  let totalStudyMinutes = 0;
  let totalDoneCount = 0;

  activeItems.forEach((it) => {
    const s = S[it.subj] || (S[it.subj] = { total: 0, done: 0, minutes: 0, pct: 0 });
    s.total++;
    const done = isItemDone(it, state);
    if (done) {
      s.done++;
      const actualMins = state.topicMinutes?.[it.id] ?? it.m;
      s.minutes += actualMins;
      totalDoneCount++;
      if (!isLegacy || it.row <= 1000) {
        totalStudyMinutes += actualMins;
      }
    }
  });

  // Include custom logged sessions if any
  if (state.studySessions && state.studySessions.length > 0) {
    state.studySessions.forEach((sess) => {
      totalStudyMinutes += sess.minutes;
    });
  }

  // 1. Calculate Current Affairs 3-Part Accumulator: Newspapers (X), Vision (Y), PIB (Z)
  const newsItems = activeItems.filter(it => it.k === 'hindu' || it.k === 'tie');
  const newsDone = newsItems.filter(it => isItemDone(it, state)).length;
  const newsTotal = newsItems.length;
  const X = newsTotal > 0 ? newsDone / newsTotal : 0;

  const visionItems = activeItems.filter(it => it.k === 'vision');
  const visionDone = visionItems.filter(it => isItemDone(it, state)).length;
  const visionTotal = visionItems.length;
  const Y = visionTotal > 0 ? visionDone / visionTotal : 0;

  const pibItems = activeItems.filter(it => it.k === 'pib');
  const pibDone = pibItems.filter(it => isItemDone(it, state)).length;
  const pibTotal = pibItems.length;
  const Z = pibTotal > 0 ? pibDone / pibTotal : 0;

  // Overall Current Affairs % = (X + Y + Z) / 3
  const caOverallPct = (X + Y + Z) / 3;

  // Calculate subject percentages
  const flatLegacySubjects = ['PYQs', 'English', 'Mock tests'];
  ALL_SUBJECTS.forEach((subj) => {
    const s = S[subj];
    if (subj === 'Current affairs') {
      s.pct = caOverallPct;
    } else if (isLegacy && flatLegacySubjects.includes(subj)) {
      s.pct = 0;
    } else {
      s.pct = s.total > 0 ? s.done / s.total : 0;
    }
  });

  // Overall syllabus done & total count (Exact ratio: doneCoreCount / totalCoreCount)
  const coreItems = activeItems.filter(isCoreItem);
  const totalCoreCount = coreItems.length;
  const doneCoreCount = coreItems.filter((it) => isItemDone(it, state)).length;
  const syllabusDonePct = totalCoreCount > 0 ? doneCoreCount / totalCoreCount : 0;

  // Total revisions done
  let totalRevisionsDone = 0;
  activeItems.forEach((it) => {
    if (isItemDone(it, state) && state.r[it.id]) {
      totalRevisionsDone += state.r[it.id].reduce((a, b) => a + b, 0);
    }
  });

  // Performance score
  const maxPossibleRevisions = Math.max(1, totalCoreCount * 8);
  const revScore = totalRevisionsDone / maxPossibleRevisions;
  const performanceScorePct = (syllabusDonePct + revScore) / 2;

  // Master Composite Score for Growth Arc Dial & Mussoorie Highway (80% Core Syllabus + 20% Current Affairs)
  const legacyScorePct = (syllabusDonePct * 0.8) + (caOverallPct * 0.2);

  // Study Velocity (last 7 days minutes)
  const dailyVelocityMinutes: Array<[string, number]> = [];
  const startDayOffset = isLegacy ? 7 : 6;
  const endDayOffset = isLegacy ? 1 : 0;

  for (let i = startDayOffset; i >= endDayOffset; i--) {
    const targetDate = addDays(todayStr, -i);
    let dayMins = activeItems.filter((it) => isItemDone(it, state) && state.d[it.id] === targetDate).reduce(
      (sum, it) => sum + (state.topicMinutes?.[it.id] ?? it.m),
      0
    );
    if (state.studySessions) {
      const sessMins = state.studySessions
        .filter((s) => s.date === targetDate)
        .reduce((sum, s) => sum + s.minutes, 0);
      dayMins += sessMins;
    }
    dailyVelocityMinutes.push([targetDate, dayMins]);
  }

  // Projected finish date
  const completedDates = activeItems.filter((it) => isItemDone(it, state))
    .map((it) => state.d[it.id])
    .filter(Boolean)
    .sort();

  let projectedFinishDate: string | null = null;
  let studyVelocityPerDay = 0;

  if (completedDates.length > 0) {
    const earliestDate = completedDates[0];
    const daysSinceStart = diffDays(todayStr, earliestDate) + 1;
    studyVelocityPerDay = daysSinceStart > 0 ? doneCoreCount / daysSinceStart : 0;
    if (doneCoreCount >= totalCoreCount) {
      projectedFinishDate = todayStr;
    } else if (studyVelocityPerDay > 0) {
      const remainingItems = totalCoreCount - doneCoreCount;
      const daysToFinish = Math.round(remainingItems / studyVelocityPerDay);
      projectedFinishDate = addDays(todayStr, daysToFinish);
    }
  }

  // Revisions due
  const revisionsDue: CalcResult['revisionsDue'] = [];
  activeItems.forEach((it) => {
    if (!isItemDone(it, state) || !state.d[it.id]) return;
    const completionDate = state.d[it.id];

    if (isLegacy) {
      if (it.k !== 'pyq') {
        const matchesToday = offsets.some((n) => addDays(completionDate, n) === todayStr);
        if (matchesToday) {
          revisionsDue.push({
            item: it,
            dueDate: todayStr,
            revIndex: -1,
            isOverdue: false
          });
        }
      }
    } else {
      const revArr = state.r[it.id] || [];
      for (let j = 0; j < 8; j++) {
        if (!revArr[j]) {
          const dueDate = addDays(completionDate, offsets[j]);
          if (dueDate <= todayStr) {
            revisionsDue.push({
              item: it,
              dueDate,
              revIndex: j,
              isOverdue: dueDate < todayStr
            });
          }
          break; // only track the first uncompleted revision step
        }
      }
    }
  });

  // Unlock logic
  const isPyqUnlocked = activeItems.filter(isCoreItem).every(it => isItemDone(it, state));
  const isMockUnlocked = activeItems.filter(it => it.k !== 'pyq' && it.k !== 'mock').every(it => isItemDone(it, state));

  return {
    todayStr,
    daysToExam,
    subjectStats: S,
    legacyScorePct,
    syllabusDonePct,
    performanceScorePct,
    totalStudyHours: totalStudyMinutes / 60,
    projectedFinishDate,
    dailyVelocityMinutes,
    revisionsDue,
    totalCoreCount,
    doneCoreCount,
    totalRevisionsDone,
    studyVelocityPerDay,
    isPyqUnlocked,
    isMockUnlocked
  };
};

export const exportToCsv = (state: AppState): string => {
  const offsets = getRevisionOffsets(state.mode);
  const activeItems = getActiveItems(state);
  const headers = [
    'id',
    'section',
    'subject',
    'topic',
    'done',
    'reading_date',
    ...offsets.map((_, i) => `rev${i + 1}_due`),
    'starred',
    'notes'
  ];

  const rows = activeItems.map((it) => {
    const done = isItemDone(it, state);
    const readingDate = (done && state.d[it.id]) || '';
    const revDates = offsets.map((off) => (readingDate ? addDays(readingDate, off) : ''));
    const isStarred = state.starred?.[it.id] ? 1 : 0;
    const note = (state.notes?.[it.id] || '').replace(/"/g, '""');
    const topicEscaped = `"${it.topic.replace(/"/g, '""')}"`;

    return [
      it.id,
      it.sec,
      it.subj,
      topicEscaped,
      done ? 1 : 0,
      readingDate,
      ...revDates,
      isStarred,
      `"${note}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const getFormattedTodayForSearch = (date: Date = new Date()): string => {
  const day = date.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const getYouTubeSearchUrl = (topic: string, subject?: string): string => {
  const lower = topic.toLowerCase();
  const todayFormatted = getFormattedTodayForSearch();

  // Special direct search queries for Daily Current Affairs (The Hindu & The Indian Express)
  if (lower.includes('hindu')) {
    const query = `The Hindu Analysis ${todayFormatted} UPSC`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
  if (lower.includes('indian express') || lower.includes('tie')) {
    const query = `Indian Express Editorial Analysis ${todayFormatted} UPSC`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
  if (lower.includes('pib')) {
    const query = `PIB Analysis UPSC ${topic}`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
  if (lower.includes('vision')) {
    const query = `Vision IAS Magazine Analysis UPSC ${topic}`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  const query = subject ? `UPSC ${subject} ${topic}` : `UPSC ${topic}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
};

