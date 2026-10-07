import React from 'react';
import { getYouTubeSearchUrl } from '../utils/calc';

interface YouTubeButtonProps {
  topic: string;
  subject?: string;
  className?: string;
}

export const YouTubeButton: React.FC<YouTubeButtonProps> = ({
  topic,
  subject,
  className = ''
}) => {
  const url = getYouTubeSearchUrl(topic, subject);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`p-0.5 rounded text-[#DC2626] dark:text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/30 transition-colors inline-flex items-center justify-center shrink-0 group ${className}`}
      title={`Watch UPSC lecture for "${topic}" on YouTube`}
      aria-label={`Watch lecture on ${topic} on YouTube`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 fill-current shrink-0 transition-transform group-hover:scale-115"
        aria-hidden="true"
      >
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    </a>
  );
};
