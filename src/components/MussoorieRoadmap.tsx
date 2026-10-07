import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

interface MussoorieRoadmapProps {
  scorePct: number; // 0 to 100
}

export interface RouteMilestone {
  name: string;
  subName?: string;
  km: number;
  visualPct: number; // Spaced percentage along the visual highway to avoid overlapping
  isOrigin?: boolean;
  isGoal?: boolean;
}

export const ROUTE_MILESTONES: RouteMilestone[] = [
  { name: "Mamuara", km: 0, visualPct: 0, isOrigin: true },
  { name: "Madhapar", km: 12, visualPct: 10 },
  { name: "Bhuj", km: 18, visualPct: 20 },
  { name: "Ahmedabad", km: 350, visualPct: 32 },
  { name: "Udaipur", km: 610, visualPct: 44 },
  { name: "Jaipur", km: 1000, visualPct: 56 },
  { name: "Gurugram", km: 1240, visualPct: 68 },
  { name: "Delhi", km: 1270, visualPct: 78 },
  { name: "Dehradun", km: 1550, visualPct: 89 },
  { name: "Mussoorie", subName: "(LBSNAA)", km: 1593, visualPct: 100, isGoal: true }
];

const TOTAL_KM = 1593;

/**
 * Calculates visual percentage along the curved road path
 * based on piecewise interpolation between route milestones.
 */
const getVisualProgress = (km: number): number => {
  if (km <= 0) return 0;
  if (km >= TOTAL_KM) return 100;

  for (let i = 0; i < ROUTE_MILESTONES.length - 1; i++) {
    const m1 = ROUTE_MILESTONES[i];
    const m2 = ROUTE_MILESTONES[i + 1];
    if (km >= m1.km && km <= m2.km) {
      const segmentSpan = m2.km - m1.km;
      const segmentFraction = segmentSpan > 0 ? (km - m1.km) / segmentSpan : 0;
      return m1.visualPct + segmentFraction * (m2.visualPct - m1.visualPct);
    }
  }
  return 100;
};

export const MussoorieRoadmap: React.FC<MussoorieRoadmapProps> = ({ scorePct }) => {
  const clampedPct = Math.min(100, Math.max(0, scorePct));
  const currentKm = (clampedPct / 100) * TOTAL_KM;
  const remainingKm = Math.max(0, TOTAL_KM - currentKm);
  const visualPct = getVisualProgress(currentKm);

  const svgWidth = 1000;
  const svgHeight = 104;
  const pathRef = useRef<SVGPathElement | null>(null);
  const [carPos, setCarPos] = useState<{ x: number; y: number; angle: number }>({ x: 28, y: 52, angle: 0 });

  // Natural asphalt roadway curve across the viewport
  const roadPathD = `M 28,52 C 170,66 250,38 370,52 C 490,66 610,38 730,52 C 830,62 905,42 972,52`;

  useEffect(() => {
    if (pathRef.current) {
      const totalLength = pathRef.current.getTotalLength();
      const targetLength = Math.max(0.001, (visualPct / 100) * totalLength);
      const point = pathRef.current.getPointAtLength(targetLength);
      
      const lookAhead = Math.min(totalLength, targetLength + 3);
      const lookBehind = Math.max(0, targetLength - 3);
      const pNext = pathRef.current.getPointAtLength(lookAhead);
      const pPrev = pathRef.current.getPointAtLength(lookBehind);
      const angleRad = Math.atan2(pNext.y - pPrev.y, pNext.x - pPrev.x);
      const angleDeg = (angleRad * 180) / Math.PI;

      setCarPos({ x: point.x, y: point.y, angle: angleDeg });
    }
  }, [visualPct]);

  // Current milestone passed
  const currentMilestone = useMemo(() => {
    let active = ROUTE_MILESTONES[0];
    for (const m of ROUTE_MILESTONES) {
      if (currentKm >= m.km) {
        active = m;
      }
    }
    return active;
  }, [currentKm]);

  // Next milestone ahead
  const nextMilestone = useMemo(() => {
    return ROUTE_MILESTONES.find(m => m.km > currentKm) || ROUTE_MILESTONES[ROUTE_MILESTONES.length - 1];
  }, [currentKm]);

  return (
    <div className="bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Mission Mussoorie 2027
            </h2>
            <span className="text-[10px] font-bold font-mono-num px-2 py-0.5 rounded-full bg-[#C8873D]/15 text-[#B45309] dark:text-[#F59E0B] border border-[#C8873D]/30">
              1,593 KM
            </span>
          </div>
          <div className="text-xs font-bold text-[#B45309] dark:text-[#F59E0B] flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#C8873D] dark:text-[#F59E0B] shrink-0" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1">
            <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">{currentMilestone.name}</span>
            <span className="mx-1 text-[#94A3B8] dark:text-[#64748B]">→</span>
            <strong className="text-[#2563EB] dark:text-[#60A5FA] font-semibold">
              {nextMilestone.name} {nextMilestone.subName ? nextMilestone.subName : ''}
            </strong>
            <span className="ml-1 text-[#64748B] dark:text-[#94A3B8]">({remainingKm.toFixed(0)} km to LBSNAA)</span>
          </p>
        </div>

        {/* Inline Odometer / Progress Counter */}
        <div className="flex items-center gap-3 bg-[#F8FAFC] dark:bg-[#0B1320] border border-[#E2E8F0] dark:border-[#1E293B] px-3.5 py-1.5 rounded-lg text-xs font-mono-num">
          <div>
            <span className="text-[#64748B] dark:text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider mr-1.5">Distance:</span>
            <strong className="text-[#0F172A] dark:text-[#F8FAFC] font-extrabold text-sm">{currentKm.toFixed(1)} km</strong>
          </div>
          <span className="text-[#CBD5E1] dark:text-[#334155]">|</span>
          <div>
            <span className="text-[#64748B] dark:text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider mr-1.5">LBSNAA:</span>
            <strong className="text-[#B45309] dark:text-[#F59E0B] font-extrabold text-sm">{clampedPct.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* Realistic Asphalt Road Canvas with Milestones & Iconic Ambassador IAS Car */}
      <div className="relative w-full bg-[#F1F5F9] dark:bg-[#070D18] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg px-2 py-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[800px] select-none"
        >
          <defs>
            {/* Realistic Asphalt Road Bed Gradient */}
            <linearGradient id="asphaltRoadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="25%" stopColor="#1E293B" />
              <stop offset="75%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Road Shoulder / Kerb Gradient */}
            <linearGradient id="shoulderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Active Trajectory Glow & Illumination */}
            <linearGradient id="activeLaneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="70%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Ambassador Car Body Metallic White Shading */}
            <linearGradient id="ambassadorBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#F8FAFC" />
              <stop offset="70%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Chrome Shading for Bumpers & Grille */}
            <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Car Soft Shadow */}
            <filter id="carShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.4" />
            </filter>

            {/* Milestone Drop Shadow */}
            <filter id="milestoneShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0F172A" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 1. Road Shoulders / Kerb Base */}
          <path
            d={roadPathD}
            fill="none"
            stroke="url(#shoulderGrad)"
            strokeWidth="19"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />

          {/* 2. Asphalt Roadway Surface */}
          <path
            d={roadPathD}
            fill="none"
            stroke="url(#asphaltRoadGrad)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Outer Road Edge Lines (Solid White Road Margins) */}
          <path
            d={roadPathD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0"
            opacity="0.15"
          />

          {/* 4. Center Lane Road Divider (Dashed White Markings) */}
          <path
            d={roadPathD}
            fill="none"
            stroke="#F8FAFC"
            strokeWidth="1.2"
            strokeDasharray="5,5"
            strokeOpacity="0.9"
          />

          {/* 5. Active Driven Lane (Glow Trajectory) */}
          <path
            ref={pathRef}
            d={roadPathD}
            fill="none"
            stroke="url(#activeLaneGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={pathRef.current ? pathRef.current.getTotalLength() : 1000}
            strokeDashoffset={
              pathRef.current
                ? pathRef.current.getTotalLength() * (1 - visualPct / 100)
                : 1000
            }
            className="transition-all duration-700 ease-out"
            opacity="0.85"
          />

          {/* 6. Authentic Highway Milestone Markers along the Route */}
          {ROUTE_MILESTONES.map((m, idx) => {
            if (!pathRef.current) return null;
            const totalLen = pathRef.current.getTotalLength();
            const pt = pathRef.current.getPointAtLength((m.visualPct / 100) * totalLen);
            const isPassed = currentKm >= m.km;
            const isCurrent = currentMilestone.name === m.name;

            // Alternate milestone placement above and below the road
            const isAbove = idx % 2 === 0;
            const milestoneY = isAbove ? pt.y - 19 : pt.y + 12;
            const textY = isAbove ? pt.y - 27 : pt.y + 32;
            const subTextY = isAbove ? pt.y - 36 : pt.y + 42;

            // Milestone colors: Yellow top for NH, Gold for LBSNAA goal, Green for State milestones
            const domeColor = m.isGoal 
              ? "#F59E0B" 
              : m.isOrigin 
              ? "#10B981" 
              : isPassed 
              ? "#EAB308" 
              : "#94A3B8";

            return (
              <g key={m.name} className="transition-all duration-300">
                {/* Connector Pin / Road Anchor */}
                <line
                  x1={pt.x}
                  y1={pt.y}
                  x2={pt.x}
                  y2={isAbove ? milestoneY + 8 : milestoneY - 1}
                  stroke={isPassed ? "#38BDF8" : "#94A3B8"}
                  strokeWidth="0.8"
                  strokeDasharray="1,1.5"
                  opacity="0.7"
                />

                {/* Roadway Contact Point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={m.isGoal ? 3 : 2}
                  className={
                    m.isGoal
                      ? 'fill-[#F59E0B] stroke-[#0F172A] stroke-1'
                      : isPassed
                      ? 'fill-[#38BDF8] stroke-white stroke-0.8'
                      : 'fill-[#64748B]'
                  }
                />

                {/* Milestone Marker Icon (Authentic Indian Highway Milestone) */}
                <g transform={`translate(${pt.x}, ${milestoneY})`} filter="url(#milestoneShadow)">
                  {/* Milestone Body (White Rectangular Pillar Base) */}
                  <rect
                    x="-5.5"
                    y="0"
                    width="11"
                    height="9"
                    fill="#FFFFFF"
                    stroke="#1E293B"
                    strokeWidth="0.7"
                    rx="0.5"
                  />
                  {/* Milestone Arched Dome Top */}
                  <path
                    d="M -5.5,0 A 5.5,5.5 0 0,1 5.5,0 Z"
                    fill={domeColor}
                    stroke="#1E293B"
                    strokeWidth="0.7"
                  />
                  {/* Inscribed NH code & distance lines */}
                  <circle cx="0" cy="-1.8" r="0.9" fill="#FFFFFF" opacity="0.95" />
                  <line x1="-3.5" y1="3" x2="3.5" y2="3" stroke="#475569" strokeWidth="0.5" />
                  <line x1="-2.5" y1="5.5" x2="2.5" y2="5.5" stroke="#475569" strokeWidth="0.5" />
                </g>

                {/* City Name Label */}
                <text
                  x={pt.x}
                  y={textY}
                  textAnchor="middle"
                  className={`text-[8.5px] font-bold ${
                    m.isGoal
                      ? 'fill-[#B45309] dark:fill-[#FBBF24] font-extrabold'
                      : isCurrent
                      ? 'fill-[#0F172A] dark:fill-[#FFFFFF] font-extrabold'
                      : isPassed
                      ? 'fill-[#1E293B] dark:fill-[#E2E8F0]'
                      : 'fill-[#64748B] dark:fill-[#94A3B8]'
                  }`}
                >
                  {m.name}
                </text>

                {/* Subtitle / Distance in KM */}
                <text
                  x={pt.x}
                  y={subTextY}
                  textAnchor="middle"
                  className={`text-[7px] font-mono-num font-semibold ${
                    m.isGoal
                      ? 'fill-[#D97706] dark:fill-[#F59E0B] font-bold'
                      : isPassed
                      ? 'fill-[#2563EB] dark:fill-[#60A5FA]'
                      : 'fill-[#94A3B8] dark:fill-[#64748B]'
                  }`}
                >
                  {m.subName ? `${m.subName} • ` : ''}{m.km} km
                </text>
              </g>
            );
          })}

          {/* 7. Actual Iconic Indian Ambassador IAS VIP Car */}
          <g
            transform={`translate(${carPos.x}, ${carPos.y}) rotate(${carPos.angle})`}
            className="transition-all duration-700 ease-out"
            filter="url(#carShadow)"
          >
            {/* 4 Wheels (Classic Black Tires with Chrome Hubcaps) */}
            <rect x="5" y="-7.2" width="5" height="2" rx="0.8" fill="#0F172A" />
            <circle cx="7.5" cy="-6.2" r="0.7" fill="#E2E8F0" />
            
            <rect x="-8.5" y="-7.2" width="5" height="2" rx="0.8" fill="#0F172A" />
            <circle cx="-6" cy="-6.2" r="0.7" fill="#E2E8F0" />

            <rect x="5" y="5.2" width="5" height="2" rx="0.8" fill="#0F172A" />
            <circle cx="7.5" cy="6.2" r="0.7" fill="#E2E8F0" />

            <rect x="-8.5" y="5.2" width="5" height="2" rx="0.8" fill="#0F172A" />
            <circle cx="-6" cy="6.2" r="0.7" fill="#E2E8F0" />

            {/* Rear Chrome Bumper with Classic Over-Riders */}
            <rect x="-13.5" y="-5.5" width="1.8" height="11" rx="0.8" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.4" />
            <circle cx="-13" cy="-3" r="0.7" fill="#0F172A" />
            <circle cx="-13" cy="3" r="0.7" fill="#0F172A" />

            {/* Front Chrome Bumper with Classic Over-Riders */}
            <rect x="11.8" y="-5.5" width="2" height="11" rx="0.8" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.4" />
            <circle cx="12.8" cy="-3" r="0.7" fill="#0F172A" />
            <circle cx="12.8" cy="3" r="0.7" fill="#0F172A" />

            {/* Ambassador Classic Bulbous / Rounded Body */}
            <path
              d="
                M 12,-4.8 
                C 13.5,-2.5 13.5,2.5 12,4.8 
                C 11,5.8 8.5,6.2 5,6.2 
                L -7,6.2 
                C -10.5,6 -12,4.5 -12.8,2.8 
                C -13.2,1.2 -13.2,-1.2 -12.8,-2.8 
                C -12,-4.5 -10.5,-6 -7,-6.2 
                L 5,-6.2 
                C 8.5,-6.2 11,-5.8 12,-4.8 Z
              "
              fill="url(#ambassadorBodyGrad)"
              stroke="#1E293B"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />

            {/* Ambassador Distinctive Rounded Front Bonnet Chrome Spear */}
            <line x1="12" y1="0" x2="5" y2="0" stroke="#94A3B8" strokeWidth="0.7" />
            {/* Ambassador Vintage Chrome Grille */}
            <path d="M 12.2,-3 C 12.8,-1.5 12.8,1.5 12.2,3" fill="none" stroke="#475569" strokeWidth="0.8" />

            {/* Iconic Ambassador Round Front Headlights */}
            <circle cx="11" cy="-4.2" r="1.2" fill="#FEF08A" stroke="#334155" strokeWidth="0.5" />
            <circle cx="11" cy="4.2" r="1.2" fill="#FEF08A" stroke="#334155" strokeWidth="0.5" />

            {/* Rear Vintage Tail Lights */}
            <rect x="-12.6" y="-4.8" width="0.9" height="1.8" rx="0.3" fill="#DC2626" />
            <rect x="-12.6" y="3" width="0.9" height="1.8" rx="0.3" fill="#DC2626" />

            {/* Ambassador Passenger Cabin / Curved Glass Area */}
            <path
              d="M 4,-4.6 C 4.8,-2 4.8,2 4,4.6 L 2,4.4 C 2.5,2 2.5,-2 2,-4.4 Z"
              fill="#1E293B"
              opacity="0.85"
            />

            {/* Ambassador Domed Cabin Roof */}
            <rect x="-6" y="-4.4" width="7.8" height="8.8" rx="1.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="0.4" />
            
            {/* Side Windows (Left & Right) */}
            <rect x="-4.8" y="-4.7" width="6.2" height="0.9" rx="0.3" fill="#334155" opacity="0.8" />
            <rect x="-4.8" y="3.8" width="6.2" height="0.9" rx="0.3" fill="#334155" opacity="0.8" />

            {/* Rear Curved Windshield Glass */}
            <path
              d="M -6.2,-4.2 C -6.8,-2 -6.8,2 -6.2,4.2 L -7.8,3.8 C -8.2,1.8 -8.2,-1.8 -7.8,-3.8 Z"
              fill="#1E293B"
              opacity="0.85"
            />

            {/* Ambassador Classic Boot Lid Line */}
            <path d="M -8.5,-3.5 C -9.5,-1.5 -9.5,1.5 -8.5,3.5" fill="none" stroke="#CBD5E1" strokeWidth="0.5" />

            {/* Official IAS VIP Lal Batti (Red Beacon on Roof) */}
            <circle cx="-1" cy="0" r="3.2" fill="#DC2626" opacity="0.3" className="animate-pulse" />
            <circle cx="-1" cy="0" r="1.6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="0.4" />
            <circle cx="-1" cy="0" r="0.6" fill="#FEF2F2" />
          </g>
        </svg>
      </div>
    </div>
  );
};
