import React from 'react';

interface GrowthArcDialProps {
  score: number; // 0 to 100
  title?: string;
  subtitle?: string;
  isLegacy?: boolean;
}

export const GrowthArcDial: React.FC<GrowthArcDialProps> = ({
  score,
  title = "Growth Arc",
  subtitle = "UPSC Preparation Momentum",
  isLegacy = false
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Gauge coordinates
  const cx = 150;
  const cy = 120;
  const outerR = 105;
  const innerR = 68;

  const getPoint = (radius: number, valuePct: number): [number, number] => {
    // 0% is at PI (180 deg, left), 100% is at 0 (0 deg, right)
    const angle = Math.PI * (1 - valuePct / 100);
    return [
      parseFloat((cx + radius * Math.cos(angle)).toFixed(1)),
      parseFloat((cy - radius * Math.sin(angle)).toFixed(1))
    ];
  };

  const createArc = (startPct: number, endPct: number): string => {
    const [o1x, o1y] = getPoint(outerR, startPct);
    const [o2x, o2y] = getPoint(outerR, endPct);
    const [i2x, i2y] = getPoint(innerR, endPct);
    const [i1x, i1y] = getPoint(innerR, startPct);
    return `M ${o1x} ${o1y} A ${outerR} ${outerR} 0 0 1 ${o2x} ${o2y} L ${i2x} ${i2y} A ${innerR} ${innerR} 0 0 0 ${i1x} ${i1y} Z`;
  };

  // 4 bands from the iconic workbook
  const bands = [
    { start: 0, end: 40, color: '#B94A48', label: 'Red' },        // Red zone: 0 - 40%
    { start: 40, end: 75, color: '#D97706', label: 'Amber' },     // Amber zone: 40 - 75%
    { start: 75, end: 90, color: '#28745A', label: 'Green' },     // Green zone: 75 - 90%
    { start: 90, end: 100, color: '#1B5A43', label: 'Royal' }     // Dark Green: 90 - 100%
  ];

  const [nx, ny] = getPoint(outerR - 10, clampedScore);

  let zoneLabel = 'Red Zone (Initial Phase)';
  let zoneColor = '#B94A48';
  if (clampedScore >= 90) {
    zoneLabel = 'Elite Green Zone (Mussoorie Bound)';
    zoneColor = '#1B5A43';
  } else if (clampedScore >= 75) {
    zoneLabel = 'Green Zone (High Confidence)';
    zoneColor = '#28745A';
  } else if (clampedScore >= 40) {
    zoneLabel = 'Amber Zone (Steady Momentum)';
    zoneColor = '#D97706';
  }

  return (
    <div className="bg-white dark:bg-[#162131] border border-[#E6E2DA] dark:border-[#2A3648] rounded-xl p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-semibold text-[#17202A] dark:text-[#F7F5F0] tracking-tight">
            {title}
          </h2>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded text-white"
          style={{ backgroundColor: zoneColor }}
        >
          {zoneLabel.split(' ')[0]} {zoneLabel.split(' ')[1]}
        </span>
      </div>

      <div className="relative flex justify-center py-1">
        <svg
          viewBox="0 0 300 175"
          className="w-full max-w-[320px] select-none"
          role="img"
          aria-label={`Preparation Growth Arc speedometer indicating ${clampedScore.toFixed(1)} percent, in ${zoneLabel}`}
        >
          {/* Arc segments */}
          {bands.map((band, idx) => (
            <path
              key={idx}
              d={createArc(band.start, band.end)}
              fill={band.color}
              className="transition-all duration-300 opacity-95 hover:opacity-100"
              stroke="var(--card-bg, #FFFFFF)"
              strokeWidth="2"
            />
          ))}

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="text-[#17202A] dark:text-[#F7F5F0] transition-all duration-700 ease-out"
          />
          {/* Needle center pin */}
          <circle cx={cx} cy={cy} r="7" className="fill-[#17202A] dark:fill-[#F7F5F0]" />
          <circle cx={cx} cy={cy} r="2.5" className="fill-white dark:fill-[#162131]" />

          {/* Central digital value with ample clearance below needle pin */}
          <text
            x={cx}
            y={cy + 36}
            textAnchor="middle"
            className="font-bold text-2xl font-mono-num fill-[#17202A] dark:fill-[#F7F5F0]"
          >
            {clampedScore.toFixed(1)}%
          </text>
        </svg>
      </div>

      <div className="mt-1 pt-3 border-t border-[#E6E2DA] dark:border-[#2A3648] flex items-center justify-between text-xs font-semibold">
        <span style={{ color: '#B94A48' }}>0–40% Foundation</span>
        <span style={{ color: '#D97706' }}>40–75% Consolidate</span>
        <span style={{ color: '#28745A' }}>75–90% Peak</span>
        <span style={{ color: '#1B5A43' }}>90%+ Mussoorie</span>
      </div>
    </div>
  );
};
