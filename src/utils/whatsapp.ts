import { AppState, CalcResult, SyllabusItem } from '../types';
import { ALL_ITEMS, CORE_SUBJECTS } from '../data/syllabus';
import { isItemDone } from './calc';

export interface WhatsAppBriefData {
  todayStr: string;
  daysToExam: number;
  newTopics: SyllabusItem[];
  revisionsDue: CalcResult['revisionsDue'];
  nextMock?: SyllabusItem;
  nextCsat?: SyllabusItem;
  nextEnglish?: SyllabusItem;
  nextCurrentAffairs?: SyllabusItem;
}

export const extractDailyBriefData = (state: AppState, calc: CalcResult): WhatsAppBriefData => {
  const maxTopics = state.whatsAppConfig?.maxTopicsCount || 5;

  // Next up topics across core subjects
  const newTopics: SyllabusItem[] = [];
  for (const subj of CORE_SUBJECTS) {
    if (newTopics.length >= maxTopics) break;
    const item = ALL_ITEMS.find((it) => it.subj === subj && !isItemDone(it, state));
    if (item) {
      newTopics.push(item);
    }
  }

  // Next up Mock Test
  const nextMock = ALL_ITEMS.find((it) => it.k === 'mock' && !isItemDone(it, state));

  // Next up CSAT topic
  const nextCsat = ALL_ITEMS.find((it) => it.k === 'csat' && !isItemDone(it, state));

  // Next up English / Essay / Vocab
  const nextEnglish = ALL_ITEMS.find(
    (it) => (it.k === 'essay' || it.k === 'vocab') && !isItemDone(it, state)
  );

  // Next Current Affairs
  const nextCurrentAffairs = ALL_ITEMS.find(
    (it) => (it.k === 'hindu' || it.k === 'tie' || it.k === 'vision') && !isItemDone(it, state)
  );

  return {
    todayStr: calc.todayStr,
    daysToExam: calc.daysToExam,
    newTopics,
    revisionsDue: calc.revisionsDue,
    nextMock,
    nextCsat,
    nextEnglish,
    nextCurrentAffairs
  };
};

export const formatWhatsAppMessage = (
  state: AppState,
  calc: CalcResult,
  customNotes?: string
): string => {
  const brief = extractDailyBriefData(state, calc);
  const cfg = state.whatsAppConfig || {
    phone: '',
    includeMocks: true,
    includeCsat: true,
    includeEnglish: true,
    maxTopicsCount: 5
  };

  const lines: string[] = [];

  // Header
  lines.push(`🏛️ *MISSION MUSSOORIE 2027 — DAILY STUDY BRIEF* 🇮🇳`);
  lines.push(`📅 *Date:* ${brief.todayStr} | ⏳ *${brief.daysToExam} Days to Prelims*`);
  lines.push(
    `📊 *Syllabus Done:* ${(calc.syllabusDonePct * 100).toFixed(1)}% | ⏱️ *Studied:* ${calc.totalStudyHours.toFixed(1)}h`
  );
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  // Section 1: Today's Primary Topics
  lines.push(`🎯 *TODAY'S NEW TOPICS TO TACKLE:*`);
  if (brief.newTopics.length === 0) {
    lines.push(`• 🎉 All standard core syllabus modules completed!`);
  } else {
    brief.newTopics.forEach((t, i) => {
      lines.push(`${i + 1}. *[${t.subj}]* ${t.topic} (~${t.m}m)`);
    });
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  // Section 2: Spaced Revisions Due
  lines.push(`🔄 *SPACED REVISIONS DUE TODAY (${brief.revisionsDue.length}):*`);
  if (brief.revisionsDue.length === 0) {
    lines.push(`• ✨ No revisions due today. Active recall is 100% up-to-date!`);
  } else {
    // Show top 6 revisions to keep message readable
    const topRev = brief.revisionsDue.slice(0, 6);
    topRev.forEach((r, i) => {
      const tag = r.isOverdue ? `⚠️ OVERDUE since ${r.dueDate}` : `📌 DUE TODAY`;
      const round = r.revIndex >= 0 ? `R${r.revIndex + 1}` : 'Rev';
      lines.push(`${i + 1}. *${r.item.topic}* (${r.item.subj} · ${round}) — ${tag}`);
    });
    if (brief.revisionsDue.length > 6) {
      lines.push(`  _...plus ${brief.revisionsDue.length - 6} more topics in your queue._`);
    }
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  // Section 3: Special Target (Mocks / CSAT / English / Newspapers)
  const specialLines: string[] = [];
  if (cfg.includeMocks && brief.nextMock) {
    specialLines.push(`• 📝 *Mock Test:* ${brief.nextMock.topic}`);
  }
  if (cfg.includeCsat && brief.nextCsat) {
    specialLines.push(`• 🧮 *CSAT:* ${brief.nextCsat.topic}`);
  }
  if (cfg.includeEnglish && brief.nextEnglish) {
    specialLines.push(`• ✍️ *English/Essay:* ${brief.nextEnglish.topic}`);
  }
  if (brief.nextCurrentAffairs) {
    specialLines.push(`• 📰 *Current Affairs:* ${brief.nextCurrentAffairs.topic}`);
  }

  if (specialLines.length > 0) {
    lines.push(`⚡ *SPECIAL & SKILL TARGETS:*`);
    specialLines.forEach((sl) => lines.push(sl));
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  }

  if (customNotes && customNotes.trim()) {
    lines.push(`📌 *PERSONAL FOCUS NOTE:*`);
    lines.push(`_${customNotes.trim()}_`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  }

  // Quote & Footer
  lines.push(`💡 *"शीलं परं भूषणम्" — Character is the highest virtue.*`);
  lines.push(`🎯 _Stay consistent. Every hour invested brings you closer to LBSNAA._`);

  return lines.join('\n');
};

export const DEFAULT_WATI_ENDPOINT = 'https://live-mt-server.wati.io/10265277';
export const DEFAULT_WATI_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6Im1pc3Npb25tdXNzb29yaWUyMDI1QGdtYWlsLmNvbSIsIm5hbWVpZCI6Im1pc3Npb25tdXNzb29yaWUyMDI1QGdtYWlsLmNvbSIsImVtYWlsIjoibWlzc2lvbm11c3Nvb3JpZTIwMjVAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMTAvMDUvMjAyNiAxNTowMjo0MyIsInRlbmFudF9pZCI6IjEwMjY1Mjc3IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.2Rjli73geACpondhPJdSssCGcEOx_5dQWU2lJQIv3ao';
export const DEFAULT_WATI_TEMPLATE = 'mission_mussoorie_reminder';

export const getWhatsAppUrl = (phoneNumber: string, message: string): string => {
  // Clean phone number: remove +, spaces, dashes
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
};

export interface WatiSendResult {
  success: boolean;
  message: string;
  data?: any;
}

export const sendWatiTemplateMessage = async ({
  endpoint,
  token,
  phone,
  templateName = DEFAULT_WATI_TEMPLATE,
  broadcastName = 'Mission_Mussoorie_Daily_Brief',
  state,
  calc,
  customNotes
}: {
  endpoint: string;
  token: string;
  phone: string;
  templateName?: string;
  broadcastName?: string;
  state: AppState;
  calc: CalcResult;
  customNotes?: string;
}): Promise<WatiSendResult> => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    return {
      success: false,
      message: 'Please provide a valid recipient WhatsApp phone number with country code (e.g. 919876543210).'
    };
  }

  const cleanEndpoint = (endpoint || DEFAULT_WATI_ENDPOINT).trim().replace(/\/+$/, '');
  const cleanToken = (token || DEFAULT_WATI_TOKEN).trim();
  const authHeader = cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`;

  const brief = extractDailyBriefData(state, calc);
  const fullText = formatWhatsAppMessage(state, calc, customNotes);

  const topicsListSummary = brief.newTopics.length > 0
    ? brief.newTopics.map((t, i) => `${i + 1}. [${t.subj}] ${t.topic}`).join('\n')
    : 'All standard core modules completed';

  const revisionsSummary = brief.revisionsDue.length > 0
    ? brief.revisionsDue.slice(0, 5).map((r, i) => `${i + 1}. ${r.item.topic} (${r.item.subj} R${r.revIndex + 1})`).join('\n')
    : 'All revision queues up-to-date';

  const specialSummary = [
    brief.nextMock ? `Mock: ${brief.nextMock.topic}` : '',
    brief.nextCsat ? `CSAT: ${brief.nextCsat.topic}` : '',
    brief.nextEnglish ? `English: ${brief.nextEnglish.topic}` : ''
  ].filter(Boolean).join(' | ') || 'None scheduled';

  // Construct payload with both named and positional parameters
  const payload = {
    template_name: templateName.trim() || DEFAULT_WATI_TEMPLATE,
    broadcast_name: broadcastName.trim() || 'Mission_Mussoorie_Daily_Brief',
    parameters: [
      { name: 'date', value: brief.todayStr },
      { name: 'days_to_prelims', value: String(brief.daysToExam) },
      { name: 'topics_list', value: topicsListSummary },
      { name: 'revision_list', value: revisionsSummary },
      { name: 'special_targets', value: specialSummary },
      { name: 'full_brief', value: fullText },
      { name: '1', value: brief.todayStr },
      { name: '2', value: topicsListSummary },
      { name: '3', value: revisionsSummary },
      { name: '4', value: specialSummary }
    ]
  };

  try {
    // 1. Try local Vite proxy first to avoid any browser CORS issues
    let res: Response;
    try {
      res = await fetch('/api/wati-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: cleanEndpoint,
          token: authHeader,
          phone: cleanPhone,
          payload
        })
      });
    } catch {
      // 2. Fallback to direct fetch
      const directUrl = `${cleanEndpoint}/api/v1/sendTemplateMessage?whatsappNumber=${cleanPhone}`;
      res = await fetch(directUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json().catch(() => ({}));

    // Check WATI response structure
    if (res.ok && (data.result === 'success' || data.result === true || data.validWhatsAppNumber || !data.error)) {
      return {
        success: true,
        message: `Template "${payload.template_name}" dispatched successfully to ${cleanPhone} via WATI!`,
        data
      };
    } else {
      const errMsg = data.error || data.message || data.info || (typeof data === 'string' ? data : `Status code ${res.status}`);
      return {
        success: false,
        message: `WATI API response (${res.status}): ${errMsg}`,
        data
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to WATI endpoint: ${err.message || 'Network error'}`
    };
  }
};
