import React, { useMemo } from 'react';

// Generates an authentic, tiered pine/deodar tree silhouette path
function createPineTreePath(
  x: number,
  yBase: number,
  height: number,
  width: number,
  tiers: number = 4
): string {
  const topY = yBase - height;
  const tierH = (height * 0.88) / tiers;
  const trunkW = Math.max(1.5, Math.min(3, width * 0.12));

  // Build left edge down
  let left = `M ${x.toFixed(1)} ${topY.toFixed(1)} `;
  for (let i = 1; i <= tiers; i++) {
    const tProgress = i / tiers;
    const tierW = width * (0.35 + 0.65 * tProgress);
    const tierY = topY + i * tierH;
    const innerW = tierW * 0.42;
    const innerY = tierY - tierH * 0.35;

    // Serrated conifer needles drooping downward
    left += `L ${(x - tierW * 0.65).toFixed(1)} ${(tierY - tierH * 0.25).toFixed(1)} `;
    left += `L ${(x - tierW).toFixed(1)} ${tierY.toFixed(1)} `;
    if (i < tiers) {
      left += `L ${(x - innerW).toFixed(1)} ${innerY.toFixed(1)} `;
    }
  }

  // Trunk
  left += `L ${(x - trunkW).toFixed(1)} ${(yBase - height * 0.12).toFixed(1)} `;
  left += `L ${(x - trunkW).toFixed(1)} ${yBase.toFixed(1)} `;
  left += `L ${(x + trunkW).toFixed(1)} ${yBase.toFixed(1)} `;
  left += `L ${(x + trunkW).toFixed(1)} ${(yBase - height * 0.12).toFixed(1)} `;

  // Build right edge up
  for (let i = tiers; i >= 1; i--) {
    const tProgress = i / tiers;
    const tierW = width * (0.35 + 0.65 * tProgress);
    const tierY = topY + i * tierH;
    const innerW = tierW * 0.42;
    const innerY = tierY - tierH * 0.35;

    left += `L ${(x + tierW).toFixed(1)} ${tierY.toFixed(1)} `;
    left += `L ${(x + tierW * 0.65).toFixed(1)} ${(tierY - tierH * 0.25).toFixed(1)} `;
    if (i > 1) {
      left += `L ${(x + innerW).toFixed(1)} ${innerY.toFixed(1)} `;
    }
  }

  left += `Z `;
  return left;
}

export const PineSilhouetteFooter: React.FC = () => {
  // Pre-calculated realistic, uneven Himalayan pine groves
  const { backgroundPinesPath, foregroundPinesPath } = useMemo(() => {
    const yBase = 72;

    // Distant background pines (taller, slightly wider, softer opacity)
    const bgSpecs = [
      { x: 12, h: 54, w: 18, t: 5 },
      { x: 38, h: 46, w: 16, t: 4 },
      { x: 80, h: 62, w: 20, t: 5 },
      { x: 115, h: 48, w: 17, t: 4 },
      { x: 148, h: 58, w: 19, t: 5 },
      { x: 195, h: 66, w: 21, t: 6 },
      { x: 235, h: 50, w: 17, t: 4 },
      { x: 275, h: 56, w: 19, t: 5 },
      { x: 318, h: 64, w: 20, t: 5 },
      { x: 360, h: 49, w: 17, t: 4 },
      { x: 405, h: 59, w: 19, t: 5 },
      { x: 442, h: 67, w: 22, t: 6 },
      { x: 488, h: 52, w: 18, t: 4 },
      { x: 528, h: 60, w: 20, t: 5 },
      { x: 565, h: 47, w: 16, t: 4 },
      { x: 610, h: 65, w: 21, t: 6 },
      { x: 652, h: 53, w: 18, t: 5 },
      { x: 692, h: 61, w: 20, t: 5 },
      { x: 735, h: 48, w: 16, t: 4 },
      { x: 778, h: 63, w: 21, t: 5 },
      { x: 818, h: 55, w: 19, t: 5 },
      { x: 860, h: 68, w: 22, t: 6 },
      { x: 902, h: 50, w: 17, t: 4 },
      { x: 945, h: 58, w: 19, t: 5 },
      { x: 988, h: 64, w: 21, t: 5 },
      { x: 1032, h: 47, w: 16, t: 4 },
      { x: 1072, h: 62, w: 20, t: 5 },
      { x: 1115, h: 53, w: 18, t: 5 },
      { x: 1155, h: 65, w: 21, t: 6 },
      { x: 1190, h: 49, w: 17, t: 4 }
    ];

    // Foreground crisp pines: uneven groves, pairs, trios, varied heights
    const fgSpecs = [
      { x: 4, h: 40, w: 14, t: 4 },
      { x: 22, h: 52, w: 17, t: 5 },
      { x: 34, h: 36, w: 13, t: 3 },
      { x: 60, h: 28, w: 11, t: 3 },
      { x: 92, h: 56, w: 18, t: 5 },
      { x: 106, h: 44, w: 15, t: 4 },
      { x: 132, h: 33, w: 12, t: 3 },
      { x: 165, h: 60, w: 19, t: 5 },
      { x: 180, h: 46, w: 15, t: 4 },
      { x: 215, h: 38, w: 14, t: 4 },
      { x: 228, h: 50, w: 16, t: 5 },
      { x: 250, h: 31, w: 11, t: 3 },
      { x: 288, h: 58, w: 18, t: 5 },
      { x: 302, h: 42, w: 14, t: 4 },
      { x: 338, h: 54, w: 17, t: 5 },
      { x: 350, h: 35, w: 12, t: 3 },
      { x: 375, h: 48, w: 16, t: 4 },
      { x: 390, h: 62, w: 20, t: 6 },
      { x: 422, h: 37, w: 13, t: 4 },
      { x: 458, h: 53, w: 17, t: 5 },
      { x: 472, h: 39, w: 13, t: 4 },
      { x: 505, h: 57, w: 18, t: 5 },
      { x: 518, h: 43, w: 14, t: 4 },
      { x: 542, h: 30, w: 11, t: 3 },
      { x: 578, h: 61, w: 19, t: 6 },
      { x: 592, h: 45, w: 15, t: 4 },
      { x: 628, h: 36, w: 13, t: 3 },
      { x: 642, h: 51, w: 16, t: 5 },
      { x: 672, h: 40, w: 14, t: 4 },
      { x: 705, h: 59, w: 19, t: 5 },
      { x: 718, h: 44, w: 15, t: 4 },
      { x: 748, h: 32, w: 12, t: 3 },
      { x: 788, h: 55, w: 17, t: 5 },
      { x: 802, h: 41, w: 14, t: 4 },
      { x: 835, h: 49, w: 16, t: 4 },
      { x: 848, h: 63, w: 20, t: 6 },
      { x: 882, h: 37, w: 13, t: 3 },
      { x: 915, h: 54, w: 17, t: 5 },
      { x: 930, h: 38, w: 13, t: 4 },
      { x: 965, h: 58, w: 18, t: 5 },
      { x: 978, h: 42, w: 14, t: 4 },
      { x: 1008, h: 31, w: 11, t: 3 },
      { x: 1045, h: 60, w: 19, t: 5 },
      { x: 1058, h: 45, w: 15, t: 4 },
      { x: 1088, h: 37, w: 13, t: 3 },
      { x: 1102, h: 52, w: 17, t: 5 },
      { x: 1132, h: 41, w: 14, t: 4 },
      { x: 1168, h: 57, w: 18, t: 5 },
      { x: 1182, h: 43, w: 14, t: 4 },
      { x: 1198, h: 35, w: 12, t: 3 }
    ];

    const bgPath = bgSpecs.map((s) => createPineTreePath(s.x, yBase, s.h, s.w, s.t)).join(' ');
    const fgPath = fgSpecs.map((s) => createPineTreePath(s.x, yBase, s.h, s.w, s.t)).join(' ');

    return {
      backgroundPinesPath: bgPath,
      foregroundPinesPath: fgPath
    };
  }, []);

  return (
    <footer className="relative border-t border-[#E6E2DA] dark:border-[#2A3648] pt-12 pb-7 px-4 overflow-hidden bg-gradient-to-b from-transparent via-[#172A46]/[0.02] to-[#172A46]/[0.05] dark:via-[#172A46]/15 dark:to-[#0A121A]">
      {/* Background Practical Uneven Pine Forest Silhouette */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none h-16 sm:h-20 overflow-hidden flex items-end">
        {/* Layer 1: Distant softer pine canopy */}
        <svg
          viewBox="0 0 1200 72"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-14 sm:h-18 text-[#172A46]/10 dark:text-[#8FB0F0]/10 fill-current"
          aria-hidden="true"
        >
          <path d={backgroundPinesPath} />
        </svg>

        {/* Layer 2: Foreground crisp, uneven pine & deodar trees with needle tiers */}
        <svg
          viewBox="0 0 1200 72"
          preserveAspectRatio="none"
          className="relative w-full h-12 sm:h-15 text-[#172A46]/22 dark:text-[#8FB0F0]/25 fill-current"
          aria-hidden="true"
        >
          <path d={foregroundPinesPath} />
          {/* Subtle ground ridge at base */}
          <rect x="0" y="70.5" width="1200" height="1.5" className="fill-current opacity-30" />
        </svg>
      </div>

      {/* Centered Academy Motto & Branding with ample breathing room */}
      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center justify-center gap-1.5 text-center">
        <div className="text-base sm:text-lg font-serif-title font-semibold tracking-wide text-[#17202A] dark:text-[#F7F5F0] drop-shadow-2xs">
          "शीलं परं भूषणम्"
        </div>
        <div className="text-sm sm:text-base font-bold italic text-[#172A46] dark:text-[#8FB0F0] tracking-tight">
          Mission Mussoorie 2027
        </div>
      </div>
    </footer>
  );
};
