import React, { useState } from 'react';
import { RotateCcw, AlertCircle, CheckCircle2, Clock, Calendar, Check, ArrowRight } from 'lucide-react';
import { AppState, CalcResult, SyllabusItem } from '../types';
import { SUBJECT_COLORS } from '../data/syllabus';
import { getRevisionOffsets, addDays } from '../utils/calc';
import { YouTubeButton } from './YouTubeButton';

interface RevisionCockpitProps {
  calc: CalcResult;
  state: AppState;
  onLogRevision: (id: string, revIndex: number) => void;
  onLogAllDueRevisions: () => void;
}

export const RevisionCockpit: React.FC<RevisionCockpitProps> = ({
  calc,
  state,
  onLogRevision,
  onLogAllDueRevisions
}) => {
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'today'>('all');
  const offsets = getRevisionOffsets(state.mode);
  const todayStr = calc.todayStr;

  const overdueCount = calc.revisionsDue.filter((r) => r.isOverdue).length;
  const todayCount = calc.revisionsDue.filter((r) => !r.isOverdue).length;

  const displayedList = calc.revisionsDue.filter((rev) => {
    if (filterType === 'overdue') return rev.isOverdue;
    if (filterType === 'today') return !rev.isOverdue;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Info & Strategy Summary */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#C8873D]" />
              <h2 className="text-lg font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                Spaced Repetition Command Center
              </h2>
            </div>
            <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-1 max-w-2xl">
              UPSC requires retaining ~1,500 concepts. Active recall at day +1, +7, +15, +30, +60, +90, +120, and +240 breaks Ebbinghaus's forgetting curve and secures high marks in Prelims & Mains.
            </p>
          </div>

          {calc.revisionsDue.length > 0 && state.mode !== 'legacy' && (
            <button
              onClick={onLogAllDueRevisions}
              className="px-4 py-2 bg-[#28745A] hover:bg-[#1F5C47] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
            >
              <Check className="w-4 h-4" /> Mark All Due Revisions Done ({calc.revisionsDue.length})
            </button>
          )}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-[#E6E2DA] dark:border-[#2A3648]">
          <div className="p-3.5 rounded-lg bg-[#FFF5F5] dark:bg-[#2D1B1B] border border-[#FAD2D2] dark:border-[#522929]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#B94A48] dark:text-[#E07A78]">
                Overdue Revisions
              </span>
              <AlertCircle className="w-4 h-4 text-[#B94A48]" />
            </div>
            <div className="text-2xl font-bold font-mono-num text-[#B94A48] dark:text-[#E07A78] mt-1">
              {overdueCount}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-[#A3ADBD] mt-0.5">
              Prioritize these to prevent memory decay
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FFF8E6] dark:bg-[#2A2314] border border-[#F3E3B6] dark:border-[#4D3F22]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#D97706] dark:text-[#E0A458]">
                Scheduled for Today
              </span>
              <Clock className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl font-bold font-mono-num text-[#D97706] dark:text-[#E0A458] mt-1">
              {todayCount}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-[#A3ADBD] mt-0.5">
              Scheduled recall cycle for {todayStr}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F0FDF4] dark:bg-[#132A1C] border border-[#DCFCE7] dark:border-[#1E4D2B]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#16A34A] dark:text-[#4FA582]">
                Total Revision Passes
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-bold font-mono-num text-[#16A34A] dark:text-[#4FA582] mt-1">
              {calc.totalRevisionsDone}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-[#A3ADBD] mt-0.5">
              Logged milestone reviews to date
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] p-1 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-[#172A46] text-white shadow-2xs'
                : 'text-[#667085] hover:text-[#17202A]'
            }`}
          >
            All Actionable ({calc.revisionsDue.length})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'overdue'
                ? 'bg-[#B94A48] text-white shadow-2xs'
                : 'text-[#667085] hover:text-[#17202A]'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setFilterType('today')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'today'
                ? 'bg-[#D97706] text-white shadow-2xs'
                : 'text-[#667085] hover:text-[#17202A]'
            }`}
          >
            Today's Schedule ({todayCount})
          </button>
        </div>

        <div className="text-xs text-[#667085] dark:text-[#A3ADBD] font-mono-num">
          Schedule: +1d, +7d, +15d, +30d, +60d, +90d, +120d, +240d
        </div>
      </div>

      {/* Revision Queue Cards */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#28745A] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
              Revision Queue is Clear!
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-1 max-w-sm mx-auto">
              You are completely caught up with your scheduled spaced repetition. Complete more new syllabus modules in the "Topics" tab to feed new revision cycles.
            </p>
          </div>
        ) : (
          displayedList.map(({ item, dueDate, revIndex, isOverdue }) => {
            const subjectColor = SUBJECT_COLORS[item.subj] || '#172A46';
            const readingDate = state.d[item.id] || '';
            const revLogs = state.r[item.id] || [0, 0, 0, 0, 0, 0, 0, 0];
            const currentRevNum = revIndex >= 0 ? revIndex + 1 : 1;
            const currentIntervalDays = revIndex >= 0 ? offsets[revIndex] : 7;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: subjectColor }}
                    >
                      {item.subj}
                    </span>
                    {item.sec && item.sec !== item.subj && (
                      <span className="text-xs text-[#667085] dark:text-[#A3ADBD]">
                        {item.sec}
                      </span>
                    )}

                    {isOverdue ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#B94A48] text-white ml-auto sm:ml-2">
                        Overdue since {dueDate}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#D97706] text-white ml-auto sm:ml-2">
                        Due Today
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                      {item.topic}
                    </h3>
                    <YouTubeButton topic={item.topic} subject={item.subj} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085] dark:text-[#A3ADBD] mt-2">
                    <span>Initial reading: <strong className="font-mono-num">{readingDate}</strong></span>
                    <span>·</span>
                    <span>Target Recall: <strong>R{currentRevNum} (+{currentIntervalDays} days)</strong></span>
                  </div>

                  {/* 8 Pip Sequence */}
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="text-xs text-[#667085] dark:text-[#A3ADBD] mr-1">Progress:</span>
                    {offsets.map((off, idx) => {
                      const isDone = Boolean(revLogs[idx]);
                      const isCurrent = idx === revIndex;

                      let pipClass = 'bg-[#E6E2DA] dark:bg-[#2A3648] text-[#667085]';
                      if (isDone) pipClass = 'bg-[#28745A] text-white';
                      else if (isCurrent && isOverdue) pipClass = 'bg-[#B94A48] text-white animate-pulse ring-2 ring-[#B94A48]/30';
                      else if (isCurrent) pipClass = 'bg-[#D97706] text-white ring-2 ring-[#D97706]/30';

                      return (
                        <button
                          key={idx}
                          onClick={() => onLogRevision(item.id, idx)}
                          className={`w-6 h-6 rounded text-xs font-mono-num font-semibold flex items-center justify-center transition-all ${pipClass}`}
                          title={`Revision R${idx + 1} (+${off}d)`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Big Action button */}
                <div className="shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onLogRevision(item.id, revIndex >= 0 ? revIndex : 0)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#172A46] hover:bg-[#233B5D] text-white flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Log R{currentRevNum} Complete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
