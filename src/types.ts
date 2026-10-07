export interface SyllabusItem {
  id: string;
  k: string;
  subj: string; // Subject
  sec: string;  // Section
  subSec?: string; // Sub-section / Chapter
  row: number;
  m: number; // Minutes allotted
  topic: string;
}

export type CalcMode = 'corrected' | 'legacy';
export type AppTheme = 'light' | 'dark' | 'system';

export interface MockScore {
  p1Score?: number;
  csatScore?: number;
  date?: string;
  notes?: string;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  subject: string;
  note?: string;
}

export interface WhatsAppConfig {
  phone: string; // e.g. 919876543210
  watiEndpoint?: string; // e.g. https://live-mt-server.wati.io/10265277
  watiToken?: string; // WATI Bearer access token
  watiTemplateName?: string; // template name in WATI (e.g. daily_study_brief or custom)
  watiBroadcastName?: string; // broadcast label
  sendTime?: string; // e.g. "07:00"
  includeMocks: boolean;
  includeCsat: boolean;
  includeEnglish: boolean;
  maxTopicsCount: number;
}

export interface TopicAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 or ObjectURL (using base64 for persistence in state)
}

export interface TargetsConfig {
  subjectOrder: string[];
  englishDays: number[]; // 0-6 (Sun-Sat)
  aptitudeDays: number[]; // 0-6 (Sun-Sat)
  visionDay: number; // 1-28
  pibDay: number; // 1-28
}

export interface DailyTargetState {
  date: string; // YYYY-MM-DD
  topicIds: string[];
}

export interface UserProfile {
  username?: string;
  fullName?: string;
  aspirantId?: string; // e.g. MM-2027-8891
  optionalSubject?: string;
  targetCadre?: string;
  motto?: string;
  passcodePin?: string; // optional 4-digit PIN lock
  isPinEnabled?: boolean;
}

export interface AppState {
  theme: AppTheme;
  mode: CalcMode;
  exam: string; // YYYY-MM-DD
  x: Record<string, number>; // done flags
  d: Record<string, string>; // completion dates
  r: Record<string, number[]>; // revision status [r1..r8]
  starred: Record<string, boolean>; // starred / high-yield topics
  notes: Record<string, string>; // personal notes
  attachments: Record<string, TopicAttachment>; // topic attachments
  topicMinutes: Record<string, number>; // actual minutes logged per topic
  mockScores: Record<string, MockScore>;
  studySessions: StudySession[];
  targetsConfig: TargetsConfig; // New settings
  dailyTargets?: DailyTargetState; // Locked daily target batch for current day
  whatsAppConfig?: WhatsAppConfig;
  userProfile?: UserProfile; // Personal account & profile info
  customItems?: SyllabusItem[]; // user added custom topics
  deletedItemIds?: Record<string, boolean>; // user removed topics
  editedTopics?: Record<string, string>; // custom renamed topics
}

export interface CalcResult {
  todayStr: string;
  daysToExam: number;
  subjectStats: Record<string, { total: number; done: number; minutes: number; pct: number }>;
  legacyScorePct: number;
  syllabusDonePct: number;
  performanceScorePct: number;
  totalStudyHours: number;
  projectedFinishDate: string | null;
  dailyVelocityMinutes: Array<[string, number]>; // [date, minutes]
  revisionsDue: Array<{
    item: SyllabusItem;
    dueDate: string;
    revIndex: number;
    isOverdue: boolean;
  }>;
  totalCoreCount: number;
  doneCoreCount: number;
  totalRevisionsDone: number;
  studyVelocityPerDay: number;
  isPyqUnlocked: boolean;
  isMockUnlocked: boolean;
}
