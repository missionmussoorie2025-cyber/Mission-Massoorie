import React from 'react';
import { Newspaper } from 'lucide-react';

interface CATrackerButtonProps {
  className?: string;
}

export const CATrackerButton: React.FC<CATrackerButtonProps> = ({ className = '' }) => {
  return (
    <a
      href="https://catrackerpro.com/tracker"
      target="_blank"
      rel="noopener noreferrer"
      className={`p-1 rounded text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/40 transition-colors inline-flex items-center justify-center shrink-0 group ${className}`}
      title="Open CA Tracker Pro (catrackerpro.com/tracker)"
      aria-label="Open Current Affairs Tracker Pro"
    >
      <Newspaper className="w-4 h-4 transition-transform group-hover:scale-110" />
    </a>
  );
};
