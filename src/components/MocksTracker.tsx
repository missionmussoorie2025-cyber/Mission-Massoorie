import React, { useState } from 'react';
import { Award, CheckCircle2, TrendingUp, HelpCircle, FileText, Check, Plus, Edit2, Calendar } from 'lucide-react';
import { AppState, CalcResult, MockScore } from '../types';
import { ALL_ITEMS } from '../data/syllabus';
import { isItemDone } from '../utils/calc';

interface MocksTrackerProps {
  calc: CalcResult;
  state: AppState;
  onToggleTopic: (id: string) => void;
  onSaveMockScore: (id: string, score: MockScore) => void;
}

export const MocksTracker: React.FC<MocksTrackerProps> = ({
  calc,
  state,
  onToggleTopic,
  onSaveMockScore
}) => {
  const [activeTab, setActiveTab] = useState<'mocks' | 'pyq'>('mocks');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editP1, setEditP1] = useState<string>('');
  const [editCsat, setEditCsat] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const mockItems = ALL_ITEMS.filter((it) => it.k === 'mock');
  const pyqItems = ALL_ITEMS.filter((it) => it.k === 'pyq');

  const activeItems = activeTab === 'mocks' ? mockItems : pyqItems;

  // Compute mock stats
  const attemptedMocks = mockItems.filter((it) => isItemDone(it, state));
  const attemptedPYQs = pyqItems.filter((it) => state.x[it.id]);

  let totalP1Score = 0;
  let p1Count = 0;
  let highestP1 = 0;

  mockItems.forEach((it) => {
    const sc = state.mockScores?.[it.id];
    if (sc?.p1Score !== undefined) {
      totalP1Score += sc.p1Score;
      p1Count++;
      if (sc.p1Score > highestP1) highestP1 = sc.p1Score;
    }
  });

  const avgP1Score = p1Count > 0 ? (totalP1Score / p1Count).toFixed(1) : '—';

  const handleOpenEdit = (id: string) => {
    const existing = state.mockScores?.[id] || {};
    setEditingItemId(id);
    setEditP1(existing.p1Score !== undefined ? existing.p1Score.toString() : '');
    setEditCsat(existing.csatScore !== undefined ? existing.csatScore.toString() : '');
    setEditDate(existing.date || state.d[id] || calc.todayStr);
    setEditNotes(existing.notes || '');
  };

  const handleSaveScore = () => {
    if (editingItemId) {
      const p1 = editP1 !== '' ? parseFloat(editP1) : undefined;
      const csat = editCsat !== '' ? parseFloat(editCsat) : undefined;
      onSaveMockScore(editingItemId, {
        p1Score: p1,
        csatScore: csat,
        date: editDate,
        notes: editNotes
      });
      // Also ensure topic is ticked if score was entered
      if (p1 !== undefined && !isItemDone(mockItems.find((it) => it.id === editingItemId) || pyqItems.find((it) => it.id === editingItemId)!, state)) {
        onToggleTopic(editingItemId);
      }
      setEditingItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C8873D]" />
              <h2 className="text-lg font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                Mock Tests & PYQ Performance Journal
              </h2>
            </div>
            <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-1 max-w-2xl">
              100 Full-Length Mocks & 31 Years of UPSC Prelims (1996–2026). Record GS Paper 1 marks and ensure CSAT Paper 2 safely clears the 66.67 qualifying cutoff.
            </p>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#E6E2DA] dark:border-[#2A3648]">
          <div className="p-3 rounded-lg bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648]">
            <span className="text-xs text-[#667085] dark:text-[#A3ADBD]">Mocks Attempted</span>
            <div className="text-2xl font-bold font-mono-num text-[#17202A] dark:text-[#F7F5F0] mt-1">
              {attemptedMocks.length} / 100
            </div>
            <div className="text-[11px] text-[#28745A] mt-0.5">
              {Math.round((attemptedMocks.length / 100) * 100)}% completed
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648]">
            <span className="text-xs text-[#667085] dark:text-[#A3ADBD]">PYQ Papers (1996–2026)</span>
            <div className="text-2xl font-bold font-mono-num text-[#17202A] dark:text-[#F7F5F0] mt-1">
              {attemptedPYQs.length} / 31
            </div>
            <div className="text-[11px] text-[#C8873D] mt-0.5">
              UPSC gold standard
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648]">
            <span className="text-xs text-[#667085] dark:text-[#A3ADBD]">Avg GS-1 Score</span>
            <div className="text-2xl font-bold font-mono-num text-[#172A46] dark:text-[#8FB0F0] mt-1">
              {avgP1Score}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-[#A3ADBD] mt-0.5">
              Target: 95–105+
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648]">
            <span className="text-xs text-[#667085] dark:text-[#A3ADBD]">Highest Mock Score</span>
            <div className="text-2xl font-bold font-mono-num text-[#28745A] dark:text-[#4FA582] mt-1">
              {highestP1 > 0 ? highestP1 : '—'}
            </div>
            <div className="text-[11px] text-[#667085] dark:text-[#A3ADBD] mt-0.5">
              Personal Best / 200
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('mocks')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'mocks'
              ? 'bg-[#172A46] text-white shadow-2xs'
              : 'bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] text-[#667085] hover:text-[#17202A]'
          }`}
        >
          100 Mock Test Series ({attemptedMocks.length}/100)
        </button>
        <button
          onClick={() => setActiveTab('pyq')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'pyq'
              ? 'bg-[#172A46] text-white shadow-2xs'
              : 'bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] text-[#667085] hover:text-[#17202A]'
          }`}
        >
          Previous Year Papers (1996–2026) ({attemptedPYQs.length}/31)
        </button>
      </div>

      {/* Grid of Tests */}
      {activeTab === 'pyq' && !calc.isPyqUnlocked ? (
        <div className="p-12 text-center bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl">
          <p className="text-sm text-[#667085] dark:text-[#A3ADBD]">PYQs unlock after completing the first reading of all core subjects.</p>
        </div>
      ) : activeTab === 'mocks' && !calc.isMockUnlocked ? (
        <div className="p-12 text-center bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl">
          <p className="text-sm text-[#667085] dark:text-[#A3ADBD]">Mocks unlock after completing the first cycle of the full syllabus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeItems.map((item) => {
            const done = isItemDone(item, state);
            const score = state.mockScores?.[item.id];
            const hasScore = score?.p1Score !== undefined;
            const csatQualifies = score?.csatScore !== undefined && score.csatScore >= 66.67;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  done
                    ? 'bg-white dark:bg-[#162131] border-[#28745A]/40 shadow-xs'
                    : 'bg-white dark:bg-[#162131] border-[#E6E2DA] dark:border-[#2A3648] hover:border-[#172A46]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleTopic(item.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        done
                          ? 'bg-[#28745A] border-[#28745A] text-white'
                          : 'border-[#A3ADBD] bg-white dark:bg-[#162131] hover:border-[#172A46]'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-sm font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                      {item.topic}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(item.id)}
                    className="text-xs text-[#667085] hover:text-[#172A46] dark:hover:text-white p-1"
                    title="Record / Edit Score"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Score Display */}
                <div className="mt-3 pt-2.5 border-t border-[#E6E2DA] dark:border-[#2A3648] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#667085] dark:text-[#A3ADBD]">GS 1: </span>
                    <strong className="font-mono-num text-[#17202A] dark:text-[#F7F5F0]">
                      {hasScore ? `${score!.p1Score} / 200` : 'Not recorded'}
                    </strong>
                  </div>

                  {score?.csatScore !== undefined && (
                    <div
                      className={`font-mono-num font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                        csatQualifies
                          ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#132A1C]'
                          : 'bg-[#FEE2E2] text-[#DC2626] dark:bg-[#2D1B1B]'
                      }`}
                    >
                      CSAT: {score.csatScore} ({csatQualifies ? 'Pass' : 'Fail'})
                    </div>
                  )}
                </div>

                {score?.notes && (
                  <div className="mt-2 text-xs italic text-[#667085] dark:text-[#A3ADBD] truncate font-reading">
                    "{score.notes}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Score Modal */}
      {editingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
              Record Mock Scorecard
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                  GS Paper 1 (/200)
                </label>
                <input
                  type="number"
                  step="0.33"
                  value={editP1}
                  onChange={(e) => setEditP1(e.target.value)}
                  placeholder="e.g. 102.66"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] font-mono-num"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                  CSAT Paper 2 (/200)
                </label>
                <input
                  type="number"
                  step="0.33"
                  value={editCsat}
                  onChange={(e) => setEditCsat(e.target.value)}
                  placeholder="e.g. 84.5 (Pass >= 66.67)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] font-mono-num"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                Attempt Date
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                Analysis & Weak Areas Journal
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="What mistakes were made? (Silly mistakes, conceptual gaps, time management in CSAT)..."
                className="w-full h-24 p-3 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItemId(null)}
                className="px-4 py-2 text-xs font-medium text-[#667085]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScore}
                className="px-4 py-2 text-xs font-semibold bg-[#172A46] text-white hover:bg-[#233B5D] rounded-lg"
              >
                Save Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
