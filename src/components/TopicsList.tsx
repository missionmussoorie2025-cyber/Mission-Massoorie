import React, { useState, useMemo } from 'react';
import { Search, Star, FileText, Check, Calendar, Filter, Sparkles, X, ChevronRight, Plus, Edit2, Trash2, Upload, Eye, Download } from 'lucide-react';
import { AppState, CalcResult, SyllabusItem, TopicAttachment } from '../types';
import { SECTION_CONFIGS, SUBJECT_COLORS } from '../data/syllabus';
import { isItemDone, getRevisionOffsets, addDays, getIsoDate, getActiveItems } from '../utils/calc';
import { YouTubeButton } from './YouTubeButton';
import { CATrackerButton } from './CATrackerButton';

interface TopicsListProps {
  calc: CalcResult;
  state: AppState;
  onToggleTopic: (id: string, date?: string) => void;
  onToggleStar: (id: string) => void;
  onSaveNote: (id: string, note: string) => void;
  onSaveAttachment?: (id: string, attachment: TopicAttachment | null) => void;
  onLogRevision: (id: string, revIndex: number) => void;
  onUpdateCompletionDate: (id: string, newDate: string) => void;
  onAddTopic?: (item: { subj: string; sec: string; topic: string; m: number }) => void;
  onEditTopic?: (id: string, newTitle: string) => void;
  onDeleteTopic?: (id: string) => void;
}

export const TopicsList: React.FC<TopicsListProps> = ({
  calc,
  state,
  onToggleTopic,
  onToggleStar,
  onSaveNote,
  onSaveAttachment,
  onLogRevision,
  onUpdateCompletionDate,
  onAddTopic,
  onEditTopic,
  onDeleteTopic
}) => {
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'starred' | 'due'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(60);
  const [activeNoteItem, setActiveNoteItem] = useState<SyllabusItem | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Add / Edit topic modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSec, setNewTopicSec] = useState('History');
  const [newTopicMinutes, setNewTopicMinutes] = useState(60);

  const [editingTopicItem, setEditingTopicItem] = useState<SyllabusItem | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState('');
  const [deletingTopicItem, setDeletingTopicItem] = useState<SyllabusItem | null>(null);

  // Attachment states for the note modal
  const [activeAttachment, setActiveAttachment] = useState<{ name: string; type: string; size: number; data: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const todayStr = calc.todayStr;
  const offsets = getRevisionOffsets(state.mode);
  const allActiveItems = useMemo(() => getActiveItems(state), [state]);

  // Filtered item list
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allActiveItems.filter((item) => {
      // Section filter
      if (sectionFilter !== 'all' && item.k !== sectionFilter) {
        return false;
      }

      const done = isItemDone(item, state);
      const isStarred = Boolean(state.starred?.[item.id]);

      // Status filter
      if (statusFilter === 'pending' && done) return false;
      if (statusFilter === 'completed' && !done) return false;
      if (statusFilter === 'starred' && !isStarred) return false;
      if (statusFilter === 'due') {
        const isDue = calc.revisionsDue.some((r) => r.item.id === item.id);
        if (!isDue) return false;
      }

      // Search query
      if (q) {
        const matchTopic = item.topic.toLowerCase().includes(q);
        const matchSec = item.sec.toLowerCase().includes(q);
        const matchSubj = item.subj.toLowerCase().includes(q);
        const matchRow = item.row.toString() === q;
        if (!matchTopic && !matchSec && !matchSubj && !matchRow) {
          return false;
        }
      }

      return true;
    });
  }, [sectionFilter, statusFilter, searchQuery, state, calc.revisionsDue, allActiveItems]);

  // Section progress stats for current selection
  const sectionStats = useMemo(() => {
    if (sectionFilter === 'all') {
      return { total: allActiveItems.length, done: allActiveItems.filter((it) => isItemDone(it, state)).length };
    }
    const secItems = allActiveItems.filter((it) => it.k === sectionFilter);
    return {
      total: secItems.length,
      done: secItems.filter((it) => isItemDone(it, state)).length
    };
  }, [sectionFilter, state, allActiveItems]);

  const handleOpenNote = (item: SyllabusItem) => {
    setActiveNoteItem(item);
    setNoteText(state.notes?.[item.id] || '');
    setActiveAttachment(state.attachments?.[item.id] || null);
  };

  const handleSaveNoteAndClose = () => {
    if (activeNoteItem) {
      onSaveNote(activeNoteItem.id, noteText);
      if (onSaveAttachment) {
        onSaveAttachment(activeNoteItem.id, activeAttachment);
      }
      setActiveNoteItem(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && activeNoteItem) {
        // Automatically rename file to topic name
        const extension = file.name.split('.').pop();
        const safeTopicName = activeNoteItem.topic.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const newName = `${safeTopicName}.${extension}`;

        setActiveAttachment({
          name: newName,
          type: file.type,
          size: file.size,
          data: event.target.result as string
        });
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!activeAttachment) return;
    const link = document.createElement('a');
    link.href = activeAttachment.data;
    link.download = activeAttachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    if (!activeAttachment) return;
    
    // Convert base64 data URL to Blob for better browser PDF reader support
    try {
      const parts = activeAttachment.data.split(',');
      const contentType = activeAttachment.type || parts[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
      } else {
        // Fallback if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.click();
      }
    } catch (e) {
      // Final fallback to raw data URL
      window.open(activeAttachment.data, '_blank');
    }
  };

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim()) return;
    const secCfg = SECTION_CONFIGS.find(([_, label]) => label === newTopicSec) || SECTION_CONFIGS[0];
    if (onAddTopic) {
      onAddTopic({
        subj: secCfg[2],
        sec: secCfg[1],
        topic: newTopicTitle.trim(),
        m: newTopicMinutes || 60
      });
    }
    setNewTopicTitle('');
    setIsAddModalOpen(false);
  };

  const handleSaveEditedTitle = () => {
    if (editingTopicItem && editingTopicTitle.trim() && onEditTopic) {
      onEditTopic(editingTopicItem.id, editingTopicTitle.trim());
      setEditingTopicItem(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Search Controls Bar */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Section dropdown */}
          <div className="w-full md:w-64">
            <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
              Curriculum Section
            </label>
            <select
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setDisplayLimit(60);
              }}
              className="w-full px-3 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] text-xs font-medium"
            >
              <option value="all">All 14 Sections ({allActiveItems.length} items)</option>
              {SECTION_CONFIGS.map(([key, label]) => {
                const count = allActiveItems.filter((it) => it.k === key).length;
                return (
                  <option key={key} value={key}>
                    {label} ({count} items)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search box */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD]">
                Search Topics & Articles
              </label>
              {onAddTopic && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-xs font-semibold text-[#28745A] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Topic
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#667085] dark:text-[#A3ADBD] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDisplayLimit(60);
                }}
                placeholder="Search across topics (e.g. Harappa, FRs, GDP, Biodiversity, ISRO)..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#667085] hover:text-[#17202A]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Filter Tabs & Section Metrics */}
        <div className="mt-3 pt-3 border-t border-[#E6E2DA] dark:border-[#2A3648] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'pending', label: 'Pending Only' },
              { id: 'completed', label: 'Completed' },
              { id: 'starred', label: '★ High Yield' },
              { id: 'due', label: '⚡ Revision Due' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setDisplayLimit(60);
                }}
                className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${
                  statusFilter === tab.id
                    ? 'bg-[#172A46] text-white shadow-2xs'
                    : 'text-[#667085] dark:text-[#A3ADBD] hover:text-[#17202A] dark:hover:text-white bg-[#F7F5F0] dark:bg-[#0E1520]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[#667085] dark:text-[#A3ADBD] font-mono-num">
            <span>
              Showing {Math.min(displayLimit, filteredItems.length)} of {filteredItems.length}
            </span>
            <span>·</span>
            <span>
              Section: {sectionStats.done}/{sectionStats.total} done (
              {Math.round((sectionStats.done / (sectionStats.total || 1)) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Topics Table List */}
      <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl shadow-xs overflow-hidden">
        <div className="divide-y divide-[#E6E2DA] dark:divide-[#2A3648]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-[#667085] dark:text-[#A3ADBD] text-sm">
              No syllabus topics match the selected filters.
            </div>
          ) : (
            filteredItems.slice(0, displayLimit).map((item) => {
              const done = isItemDone(item, state);
              const isStarred = Boolean(state.starred?.[item.id]);
              const readingDate = state.d?.[item.id] || '';
              const revLogs = state.r?.[item.id] || [0, 0, 0, 0, 0, 0, 0, 0];
              const note = state.notes?.[item.id];
              const subjectColor = SUBJECT_COLORS[item.subj] || '#172A46';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    done
                      ? 'bg-[#F7F5F0]/40 dark:bg-[#0E1520]/40'
                      : 'hover:bg-[#F7F5F0]/60 dark:hover:bg-[#1C293D]'
                  }`}
                >
                  {/* Left: Checkbox & Topic Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTopic(item.id)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        done
                          ? 'bg-[#28745A] border-[#28745A] text-white shadow-2xs'
                          : 'border-[#A3ADBD] dark:border-[#4B5563] hover:border-[#172A46] bg-white dark:bg-[#162131]'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-medium leading-snug break-words ${
                            done ? 'text-[#667085] dark:text-[#A3ADBD] line-through' : 'text-[#17202A] dark:text-[#F7F5F0]'
                          }`}
                        >
                          {item.topic}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Star High Yield button */}
                          <button
                            onClick={() => onToggleStar(item.id)}
                            className={`shrink-0 p-0.5 hover:scale-110 transition-transform ${
                              isStarred ? 'text-[#C8873D]' : 'text-[#A3ADBD] hover:text-[#C8873D]'
                            }`}
                            title={isStarred ? 'Starred High Yield' : 'Mark High Yield'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085] dark:text-[#A3ADBD] mt-1">
                        <span
                          className="font-semibold"
                          style={{ color: subjectColor }}
                        >
                          {item.sec && item.sec !== item.subj ? `${item.subj} (${item.sec})` : item.subj}
                        </span>
                        <span>·</span>
                        <span className="font-mono-num">{item.m} mins</span>

                        {readingDate && (
                          <>
                            <span>·</span>
                            <span className="text-[#28745A] dark:text-[#4FA582]">
                              Done: {readingDate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Revision Pips, Date Picker, Edit/Delete & Notes */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
                    {/* Revision Pips if item is done */}
                    {done && state.mode !== 'legacy' && (
                      <div className="flex items-center gap-1" title="8-Stage Spaced Repetition Pips">
                        {offsets.map((offset, revIdx) => {
                          const isRevDone = Boolean(revLogs[revIdx]);
                          const revDueDate = addDays(readingDate, offset);
                          const isDue = !isRevDone && revDueDate <= todayStr;
                          const isOverdue = !isRevDone && revDueDate < todayStr;

                          let pipClass = 'bg-[#E6E2DA] dark:bg-[#2A3648] text-[#667085] border-transparent';
                          if (isRevDone) {
                            pipClass = 'bg-[#28745A] text-white border-[#28745A]';
                          } else if (isOverdue) {
                            pipClass = 'bg-[#B94A48] text-white border-[#B94A48] animate-pulse';
                          } else if (isDue) {
                            pipClass = 'bg-[#D97706] text-white border-[#D97706]';
                          }

                          return (
                            <button
                              key={revIdx}
                              onClick={() => onLogRevision(item.id, revIdx)}
                              className={`w-5 h-5 rounded text-[10px] font-mono-num font-semibold border flex items-center justify-center transition-transform hover:scale-115 ${pipClass}`}
                              title={`R${revIdx + 1} (${offset}d): ${isRevDone ? 'Completed' : `Due ${revDueDate}`}`}
                            >
                              {revIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Date Picker trigger */}
                    {done && (
                      <div className="relative">
                        <input
                          type="date"
                          value={readingDate || todayStr}
                          onChange={(e) => onUpdateCompletionDate(item.id, e.target.value)}
                          className="text-[11px] font-mono-num px-1.5 py-1 rounded border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0]"
                          title="Change reading completion date"
                        />
                      </div>
                    )}

                    {/* YouTube & CA Tracker Links */}
                    <div className="flex items-center gap-1 ml-auto">
                      {(item.k === 'hindu' || item.k === 'tie') && (
                        <CATrackerButton />
                      )}
                      <YouTubeButton topic={item.topic} subject={item.subj} />
                    </div>

                    {/* Edit title button */}
                    {onEditTopic && (
                      <button
                        onClick={() => {
                          setEditingTopicItem(item);
                          setEditingTopicTitle(item.topic);
                        }}
                        className="p-1.5 rounded-lg text-[#667085] hover:text-[#17202A] dark:hover:text-white hover:bg-black/5"
                        title="Edit topic name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete topic button */}
                    {onDeleteTopic && (
                      <button
                        onClick={() => setDeletingTopicItem(item)}
                        className="p-1.5 rounded-lg text-[#667085] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 dark:hover:bg-[#7F1D1D]/30 transition-colors"
                        title="Delete topic from syllabus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Personal Notes & Attachments button */}
                    <button
                      onClick={() => handleOpenNote(item)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        state.attachments?.[item.id]
                          ? 'bg-[#172A46] text-white border-[#172A46] shadow-sm' 
                          : note
                            ? 'border-[#C8873D] text-[#C8873D] bg-[#FFF8E6] dark:bg-[#2A2314]'
                            : 'border-transparent text-[#667085] hover:text-[#17202A] hover:bg-[#F7F5F0] dark:hover:bg-[#1C293D]'
                      }`}
                      title={state.attachments?.[item.id] ? 'View Attachment & Note' : note ? 'View / Edit Note' : 'Add Note (mnemonics, key articles)'}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {filteredItems.length > displayLimit && (
          <div className="p-4 text-center border-t border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0]/30 dark:bg-[#0E1520]/30">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 60)}
              className="px-5 py-2 bg-[#172A46] text-white hover:bg-[#233B5D] text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Show Next 60 Topics ({filteredItems.length - displayLimit} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Confirm Delete Topic Modal Dialog */}
      {deletingTopicItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] dark:bg-[#7F1D1D]/30 text-[#DC2626] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-[#17202A] dark:text-[#F7F5F0]">
                Are you sure you want to delete this topic?
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-1.5 leading-relaxed">
                "<span className="font-semibold text-[#17202A] dark:text-white">{deletingTopicItem.topic}</span>" ({deletingTopicItem.sec}) will be permanently removed from your syllabus tracker.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTopicItem(null)}
                className="px-4 py-2 text-xs font-semibold border border-[#E6E2DA] dark:border-[#2A3648] text-[#667085] hover:text-[#17202A] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteTopic && deletingTopicItem) {
                    onDeleteTopic(deletingTopicItem.id);
                    setDeletingTopicItem(null);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg shadow-sm transition-colors"
              >
                Yes, Delete Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Topic Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA] dark:border-[#2A3648]">
              <h3 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                Add Custom Topic to Syllabus
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#667085] hover:text-[#17202A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                  Section / Subject
                </label>
                <select
                  value={newTopicSec}
                  onChange={(e) => setNewTopicSec(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0]"
                >
                  {SECTION_CONFIGS.map(([_, label]) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Constitutional Morality & Judicial Doctrines..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                  Estimated Minutes
                </label>
                <input
                  type="number"
                  value={newTopicMinutes}
                  onChange={(e) => setNewTopicMinutes(parseInt(e.target.value, 10) || 60)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] font-mono-num"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-medium text-[#667085]">
                Cancel
              </button>
              <button
                onClick={handleCreateTopic}
                className="px-4 py-2 text-xs font-semibold bg-[#28745A] text-white hover:bg-[#1F5C47] rounded-lg"
              >
                Add Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Topic Title Modal */}
      {editingTopicItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA] dark:border-[#2A3648]">
              <h3 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                Edit Topic Name
              </h3>
              <button onClick={() => setEditingTopicItem(null)} className="text-[#667085] hover:text-[#17202A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#667085] dark:text-[#A3ADBD] mb-1">
                Topic Name ({editingTopicItem.sec})
              </label>
              <input
                type="text"
                value={editingTopicTitle}
                onChange={(e) => setEditingTopicTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setEditingTopicItem(null)} className="px-4 py-2 text-xs font-medium text-[#667085]">
                Cancel
              </button>
              <button
                onClick={handleSaveEditedTitle}
                className="px-4 py-2 text-xs font-semibold bg-[#172A46] text-white hover:bg-[#233B5D] rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {activeNoteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-2xl w-full max-w-lg p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA] dark:border-[#2A3648]">
              <div>
                <h3 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0]">
                  Study Notes & Mnemonics
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#A3ADBD] mt-0.5">
                  {activeNoteItem.topic} ({activeNoteItem.sec})
                </p>
              </div>
              <button
                onClick={() => setActiveNoteItem(null)}
                className="text-[#667085] hover:text-[#17202A] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Jot down key articles, case laws, mnemonics, page references or revision doubts..."
              className="w-full h-40 p-3 rounded-lg border border-[#E6E2DA] dark:border-[#2A3648] bg-[#F7F5F0] dark:bg-[#0E1520] text-[#17202A] dark:text-[#F7F5F0] text-xs leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-[#C8873D]"
            />

            {/* Attachment Section */}
            <div className="pt-2 border-t border-[#E6E2DA] dark:border-[#2A3648]">
              <label className="block text-xs font-semibold text-[#17202A] dark:text-[#F7F5F0] mb-2">
                Attachment
              </label>
              
              {!activeAttachment ? (
                <label className="flex items-center gap-2 px-4 py-2 bg-[#F7F5F0] dark:bg-[#0E1520] border border-[#E6E2DA] dark:border-[#2A3648] rounded-lg cursor-pointer hover:bg-[#E6E2DA] dark:hover:bg-[#2A3648] transition-colors text-xs font-medium text-[#667085] dark:text-[#A3ADBD] w-fit">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Study Material (PDF, Image)</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#172A46]/5 dark:bg-[#8FB0F0]/5 border border-[#172A46]/10 dark:border-[#8FB0F0]/10 rounded-xl gap-3">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] shadow-xs">
                      <FileText className="w-4 h-4 text-[#172A46] dark:text-[#8FB0F0]" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#17202A] dark:text-[#F7F5F0] truncate">
                        {activeAttachment.name}
                      </div>
                      <div className="text-[10px] text-[#667085] dark:text-[#A3ADBD]">
                        {(activeAttachment.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#667085] hover:text-[#17202A] dark:hover:text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleView}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#667085] hover:text-[#17202A] dark:hover:text-white transition-colors"
                      title="View in Browser"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-[#E6E2DA] dark:border-[#2A3648] mx-1" />
                    <button
                      onClick={() => setActiveAttachment(null)}
                      className="p-2 rounded-lg hover:bg-[#FEE2E2] text-[#667085] hover:text-[#DC2626] transition-colors"
                      title="Remove Attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveNoteItem(null)}
                className="px-4 py-2 text-xs font-medium text-[#667085] hover:text-[#17202A]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNoteAndClose}
                className="px-4 py-2 text-xs font-semibold bg-[#172A46] text-white hover:bg-[#233B5D] rounded-lg"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
