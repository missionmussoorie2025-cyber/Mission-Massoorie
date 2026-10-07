import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, RotateCcw, Award, CheckCircle2, Send, User } from 'lucide-react';
import { CalcResult, AppState } from '../types';
import { formatDate } from '../utils/calc';

interface HeroProps {
  calc: CalcResult;
  state: AppState;
}

export const Hero: React.FC<HeroProps> = ({
  calc,
  state
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#172A46] text-[#F7F5F0] border border-[#233B5D] shadow-md mb-6">
      {/* Background artwork with gradient overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/src/assets/images/mission_mussoorie_hero_1791210617003.jpg"
          alt="Ashoka Lion Capital with Indian Tricolor drapery"
          className="absolute right-0 top-0 h-full w-full sm:w-[58%] object-cover object-center opacity-35 sm:opacity-50"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,1) 80%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,1) 80%)'
          }}
          onError={(e) => {
            // Graceful fallback to styled subtle gradient
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#172A46] via-[#172A46]/85 to-transparent sm:w-[75%]" />
      </div>

      <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-between min-h-[150px]">
        {/* Brand & Main Countdown */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif-title">
              Mission Mussoorie 2027
            </h1>
            {state.userProfile && (
              <div className="flex items-center gap-2 bg-[#0B1320]/75 border border-[#C8873D]/40 px-3 py-1 rounded-full text-xs font-medium text-[#F59E0B] backdrop-blur-xs">
                <User className="w-3.5 h-3.5 text-[#C8873D]" />
                <span className="font-bold text-white">{state.userProfile.fullName || 'IAS Aspirant'}</span>
                <span className="text-white/40">|</span>
                <span className="font-mono-num font-extrabold text-[#F59E0B]">{state.userProfile.aspirantId || 'MM-2027'}</span>
              </div>
            )}
          </div>

          {state.userProfile?.motto && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#E6E2DA]/90 italic font-serif">
                "{state.userProfile.motto}"
              </span>
              {state.userProfile.optionalSubject && (
                <span className="not-italic font-bold px-2 py-0.5 rounded-full bg-[#C8873D]/20 text-[#F59E0B] border border-[#C8873D]/30 text-[10px]">
                  Optional: {state.userProfile.optionalSubject}
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-black font-mono-num text-[#C8873D] leading-none">
                {calc.daysToExam > 0 ? calc.daysToExam : 0}
              </span>
              <span className="text-sm sm:text-base font-medium text-[#E6E2DA]/90">
                {calc.daysToExam === 1 ? 'day to Prelims' : 'days to Prelims'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#E6E2DA]/70">
              <span>·</span>
              <span>Target: {formatDate(state.exam)}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="pt-3 border-t border-[#E6E2DA]/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C8873D] shrink-0" />
            <div>
              <div className="text-[11px] text-[#E6E2DA]/70">Study Time</div>
              <div className="font-semibold font-mono-num text-white">{calc.totalStudyHours.toFixed(1)} hrs</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#4FA582] shrink-0" />
            <div>
              <div className="text-[11px] text-[#E6E2DA]/70">Syllabus Done</div>
              <div className="font-semibold font-mono-num text-white">
                {(calc.syllabusDonePct * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#E0A458] shrink-0" />
            <div>
              <div className="text-[11px] text-[#E6E2DA]/70">Revisions Due</div>
              <div className="font-semibold font-mono-num text-white">
                {calc.revisionsDue.length} topics
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#8FB0F0] shrink-0" />
            <div>
              <div className="text-[11px] text-[#E6E2DA]/70">Projected Finish</div>
              <div className="font-semibold font-mono-num text-white">
                {calc.projectedFinishDate ? formatDate(calc.projectedFinishDate) : 'Pending reading'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
