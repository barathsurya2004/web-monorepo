import React, { useState } from 'react';
import { useStore } from '@/store';
import {
  computeStrengthProfile,
  STRENGTH_TIERS,
  TIER_COLOR,
  type StrengthBenchmark,
  type StrengthTier,
  fmtNum,
} from '@/lib/calc';
import { Card } from '@/components/ui';
import { haptic } from '@/lib/feedback';
import {
  ShieldCheck,
  TrendingUp,
  Target,
  Trophy,
  Award,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Scale,
} from 'lucide-react';

export const StrengthRadarChart: React.FC = () => {
  const { prs, settings } = useStore();
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string>('bench');

  const profile = React.useMemo(
    () => computeStrengthProfile(prs, settings.bodyweight || 58.5),
    [prs, settings.bodyweight]
  );

  const activeBenchmark =
    profile.benchmarks.find((b) => b.id === activeBenchmarkId) || profile.benchmarks[0];

  // SVG Radar Geometry calculations
  // Center: (150, 150), Radius: 105
  const cx = 150;
  const cy = 150;
  const maxR = 105;
  const numAxes = profile.benchmarks.length; // 5

  const getAxisPoint = (axisIdx: number, normalizedValue: number) => {
    // Top axis starts at -90 degrees (-pi/2)
    const angle = (axisIdx * 2 * Math.PI) / numAxes - Math.PI / 2;
    const r = normalizedValue * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Generate 5 concentric polygon rings (Beginner 0.2 to Elite 1.0)
  const tierRings = [0.2, 0.4, 0.6, 0.8, 1.0].map((tierScale) => {
    return profile.benchmarks
      .map((_, idx) => {
        const pt = getAxisPoint(idx, tierScale);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  });

  // User's polygon points
  const userPolygonPoints = profile.benchmarks
    .map((b, idx) => {
      // Normalize tier score (1 to 5) to 0.2 to 1.0
      const norm = Math.min(1.0, Math.max(0.1, b.tierScore / 5));
      const pt = getAxisPoint(idx, norm);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber/15 p-1.5 text-amber">
              <Trophy size={18} />
            </div>
            <span className="label text-xs text-amber">Kinetic Symmetry Matrix</span>
          </div>
          <h3 className="mt-1 text-lg sm:text-xl font-black text-fg tracking-tight">
            Strength Standards & Radar
          </h3>
          <p className="text-xs text-muted">
            Relative strength rating normalized to your bodyweight ({settings.bodyweight || 58.5} {settings.unit})
          </p>
        </div>

        {/* Overall Rank Pill */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-ink-950 p-2 px-3.5 border border-white/10 self-start sm:self-auto shadow-inner">
          <Award size={18} className="text-amber" />
          <div>
            <div className="text-[10px] font-mono text-muted uppercase tracking-wider">
              Overall Athlete Level
            </div>
            <div className="text-sm font-black text-fg font-mono">
              <span
                style={{ color: TIER_COLOR[profile.overallTier] }}
                className="font-black"
              >
                {profile.overallTier}
              </span>{' '}
              <span className="text-xs text-dim">({profile.overallScore} / 5.0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar SVG + Inspection Sidebar */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* RADAR CHART CANVAS */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-2xl bg-ink-950/70 border border-white/5 p-4 sm:p-6">
          <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible select-none">
              <defs>
                {/* User Radar Area Gradient */}
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00F5A0" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#C8B6FF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FFD166" stopOpacity="0.1" />
                </radialGradient>
              </defs>

              {/* Concentric Tier Polygon Rings */}
              {tierRings.map((pts, i) => (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray={i === 4 ? undefined : '3,3'}
                />
              ))}

              {/* Radial Spoke Axes */}
              {profile.benchmarks.map((_, idx) => {
                const outerPt = getAxisPoint(idx, 1.0);
                return (
                  <line
                    key={idx}
                    x1={cx}
                    y1={cy}
                    x2={outerPt.x}
                    y2={outerPt.y}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* User Plotted Polygon Area */}
              <polygon
                points={userPolygonPoints}
                fill="url(#radarGlow)"
                stroke="#00F5A0"
                strokeWidth="2.5"
                strokeLinejoin="round"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(0, 245, 160, 0.4))',
                  transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />

              {/* Vertex Markers & Labels */}
              {profile.benchmarks.map((b, idx) => {
                const norm = Math.min(1.0, Math.max(0.1, b.tierScore / 5));
                const pt = getAxisPoint(idx, norm);
                const labelPt = getAxisPoint(idx, 1.25);
                const isSelected = activeBenchmarkId === b.id;

                return (
                  <g key={b.id} className="cursor-pointer" onClick={() => setActiveBenchmarkId(b.id)}>
                    {/* Interactive Vertex Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6.5 : 4.5}
                      fill={isSelected ? '#FFF' : '#00F5A0'}
                      stroke="#141226"
                      strokeWidth="2"
                      className="transition-all hover:scale-125"
                    />

                    {/* Axis Outer Label */}
                    <text
                      x={labelPt.x}
                      y={labelPt.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`font-mono text-[10px] font-bold transition-colors select-none ${
                        isSelected ? 'fill-mint font-black' : 'fill-slate-300 hover:fill-fg'
                      }`}
                    >
                      {b.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tier Scale Indicator */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono">
            {STRENGTH_TIERS.map((tier) => (
              <span key={tier} className="flex items-center gap-1 text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TIER_COLOR[tier] }} />
                {tier}
              </span>
            ))}
          </div>
        </div>

        {/* BENCHMARK DETAIL & KINETIC BALANCE SIDEBAR */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Benchmark Selectors */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {profile.benchmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  haptic.tap();
                  setActiveBenchmarkId(b.id);
                }}
                className={`rounded-xl px-2.5 py-1 text-xs font-mono font-bold transition-all whitespace-nowrap ${
                  activeBenchmarkId === b.id
                    ? 'bg-amber text-ink-950 shadow-md font-black'
                    : 'bg-white/[0.04] text-muted hover:text-fg'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Selected Lift Detail Card */}
          <div className="rounded-2xl border border-white/10 bg-ink-950/80 p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="label text-[10px] text-muted">{activeBenchmark.movementType} Movement</span>
                <h4 className="text-xl font-black text-fg mt-0.5">{activeBenchmark.name}</h4>
              </div>

              {/* Tier Badge */}
              <div
                className="rounded-full px-3 py-1 text-xs font-mono font-black border"
                style={{
                  borderColor: `${TIER_COLOR[activeBenchmark.tier]}60`,
                  backgroundColor: `${TIER_COLOR[activeBenchmark.tier]}15`,
                  color: TIER_COLOR[activeBenchmark.tier],
                }}
              >
                {activeBenchmark.tier}
              </div>
            </div>

            {/* Readout Numbers */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-muted text-[10px]">Estimated 1RM</div>
                <div className="font-mono text-xl font-black text-fg mt-0.5">
                  {activeBenchmark.userE1RM > 0 ? (
                    <>
                      {activeBenchmark.userE1RM}{' '}
                      <span className="text-xs text-muted font-normal">{settings.unit}</span>
                    </>
                  ) : (
                    <span className="text-xs text-dim italic">Not logged yet</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-muted text-[10px]">Bodyweight Ratio</div>
                <div className="font-mono text-xl font-black text-fg mt-0.5">
                  {activeBenchmark.ratio > 0 ? `${activeBenchmark.ratio}× BW` : '—'}
                </div>
              </div>
            </div>

            {/* Next Milestone Target */}
            {activeBenchmark.nextTier && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
                <div className="flex items-center justify-between text-muted text-[11px] font-mono">
                  <span>Next Goal: <strong>{activeBenchmark.nextTier}</strong></span>
                  <span className="text-amber font-bold">
                    Target: {activeBenchmark.standards[activeBenchmark.nextTier]} {settings.unit}
                  </span>
                </div>
                {activeBenchmark.weightToNextTier > 0 && (
                  <p className="mt-1 text-[11px] text-dim">
                    Add <strong>+{activeBenchmark.weightToNextTier} {settings.unit}</strong> to reach {activeBenchmark.nextTier} tier.
                  </p>
                )}
              </div>
            )}

            {/* Kinetic Symmetry Score Breakdown */}
            <div className="mt-4 border-t border-white/[0.08] pt-3">
              <div className="flex items-center justify-between text-xs text-muted font-mono mb-2">
                <span className="flex items-center gap-1 font-bold text-fg">
                  <Scale size={14} className="text-mint" /> Kinetic Balance
                </span>
                <span className="text-mint font-bold">{profile.symmetryBalance}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                <div className="rounded-lg bg-white/5 p-1.5">
                  <span className="text-muted block">Push</span>
                  <span className="font-bold text-fg text-xs">{profile.pushScore}</span>
                </div>
                <div className="rounded-lg bg-white/5 p-1.5">
                  <span className="text-muted block">Pull</span>
                  <span className="font-bold text-fg text-xs">{profile.pullScore}</span>
                </div>
                <div className="rounded-lg bg-white/5 p-1.5">
                  <span className="text-muted block">Legs</span>
                  <span className="font-bold text-fg text-xs">{profile.legScore}</span>
                </div>
              </div>
            </div>

            {/* Coaching Insight */}
            <div className="mt-4 rounded-xl border border-amber/20 bg-amber/5 p-3 text-xs text-amber/90 flex items-start gap-2">
              <Sparkles size={16} className="text-amber shrink-0 mt-0.5" />
              <span>{profile.insight}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
