import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  LineChart,
  PieChart,
  Repeat,
  Compass,
  Bell,
  Check,
  ThumbsUp,
  Cpu,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Flame,
  Zap
} from 'lucide-react';
import { useToast } from './AlertBanner';
import { PageTagHeader } from './PageTagHeader';

interface FeatureCardProps {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: React.ReactNode;
  mockComponent: React.ReactNode;
  votes: number;
  hasVoted: boolean;
  onVote: (id: string) => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  id,
  title,
  badge,
  badgeColor,
  description,
  icon,
  mockComponent,
  votes,
  hasVoted,
  onVote,
}) => {
  return (
    <div className="velvet-card p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden group space-y-3.5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#232044] border border-white/10 flex items-center justify-center text-[#FBD8B3] group-hover:scale-105 transition-transform duration-200">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <span
              className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${badgeColor}`}
            >
              {badge}
            </span>
          </div>
        </div>

        {/* Upvote Button */}
        <button
          onClick={() => onVote(id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
            hasVoted
              ? 'bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/40 shadow-[0_0_12px_rgba(168,230,207,0.25)]'
              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10'
          }`}
          title="Vote to prioritize this feature"
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-[#A8E6CF]' : ''}`} />
          <span>{votes}</span>
        </button>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{description}</p>

      {/* Interactive Mock Preview Box */}
      <div className="p-3 rounded-xl bg-[#131128]/80 border border-white/5 space-y-2">
        {mockComponent}
      </div>
    </div>
  );
};

export const InsightsPage: React.FC = () => {
  const { addToast } = useToast();
  const [isNotified, setIsNotified] = useState<boolean>(() => {
    return localStorage.getItem('penne_insights_notify') === 'true';
  });

  const [votes, setVotes] = useState<Record<string, { count: number; voted: boolean }>>({
    runway: { count: 38, voted: false },
    optimizer: { count: 29, voted: false },
    subscriptions: { count: 44, voted: false },
    wishlist: { count: 31, voted: false },
  });

  const handleToggleNotify = () => {
    const next = !isNotified;
    setIsNotified(next);
    localStorage.setItem('penne_insights_notify', String(next));
    if (next) {
      addToast({
        title: 'Notification Alert Saved',
        message: "You're on the early access list for Penne Analytics & Insights!",
        type: 'success',
      });
    } else {
      addToast({
        title: 'Alert Removed',
        message: 'Notification preferences updated.',
        type: 'info',
      });
    }
  };

  const handleVote = (id: string) => {
    setVotes((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const nextVoted = !current.voted;
      const nextCount = nextVoted ? current.count + 1 : current.count - 1;

      if (nextVoted) {
        addToast({
          title: 'Priority Vote Recorded!',
          message: 'Thank you! We prioritize backend features based on user votes.',
          type: 'success',
        });
      }

      return {
        ...prev,
        [id]: { count: nextCount, voted: nextVoted },
      };
    });
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fadeIn pb-28 overflow-x-hidden">
      {/* Top Tag Header */}
      <PageTagHeader
        title="Analytics & Insights"
        dotColor="#C8B6FF"
        badgeText="Engine v0.3"
      />

      {/* Main Coming Soon Velvet Hero Card */}
      <div className="velvet-card p-5 sm:p-6 rounded-3xl border border-white/10 relative overflow-hidden space-y-4 shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#C8B6FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-[#FBD8B3]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Badge & Icon */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#322E5C] to-[#232044] border border-[#C8B6FF]/40 flex items-center justify-center text-[#C8B6FF] shadow-lg shadow-[#C8B6FF]/15">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8B6FF]/15 border border-[#C8B6FF]/30 text-[#C8B6FF] text-[10px] font-mono font-bold tracking-wider">
                <Clock className="w-3 h-3" />
                <span>COMING SOON</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                Financial Intelligence Engine
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            We are actively architecting the Penne telemetry and forecasting engine.
            Once connected to our Cadence workflow backend, you will receive real-time predictive runway,
            spending anomaly alerts, and automated envelope distribution tuning.
          </p>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={handleToggleNotify}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all duration-200 cursor-pointer active:scale-95 shadow-md ${
                isNotified
                  ? 'bg-[#A8E6CF] text-[#1A1835] hover:bg-[#94d6be]'
                  : 'bg-[#FBD8B3] text-[#1A1835] hover:bg-[#f3cb9e] hover:shadow-[0_0_16px_rgba(251,216,179,0.35)]'
              }`}
            >
              {isNotified ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>On Early Access List</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 stroke-[2.5]" />
                  <span>Notify Me When Ready</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-[#C8B6FF]" />
              <span>Go 1.25 + Cadence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Teasers Header */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>Upcoming Analytics Engine</span>
          <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/5 text-[#FBD8B3] border border-white/5">
            Vote for Priority
          </span>
        </h3>
      </div>

      {/* Feature Preview Cards */}
      <div className="space-y-3.5">
        {/* Card 1: Runway & Burn Velocity */}
        <FeatureCard
          id="runway"
          title="Predictive Runway & Burn Velocity"
          badge="In Modeling"
          badgeColor="bg-[#A8E6CF]/15 text-[#A8E6CF] border border-[#A8E6CF]/30"
          description="Simulates day-by-day cash burn against active bank balances and card limits to forecast your exact zero-deficit runway."
          icon={<TrendingUp className="w-5 h-5 text-[#A8E6CF]" />}
          votes={votes.runway.count}
          hasVoted={votes.runway.voted}
          onVote={handleVote}
          mockComponent={
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Projected Zero-Deficit Runway</span>
                <span className="text-[#A8E6CF] font-bold">42 Days Left</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#A8E6CF] to-[#7bd8b9] rounded-full w-[72%]" />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                <span>Burn: ₹1,420/day</span>
                <span>Safe to Spend: ₹18,500</span>
              </div>
            </div>
          }
        />

        {/* Card 2: Envelope Optimizer */}
        <FeatureCard
          id="optimizer"
          title="Zero-Based Envelope Efficiency"
          badge="Cadence Spec"
          badgeColor="bg-[#FBD8B3]/15 text-[#FBD8B3] border border-[#FBD8B3]/30"
          description="Identifies stagnant envelope funds and friction points, recommending dynamic rebalances between Needs, Wants, and Wishlist."
          icon={<PieChart className="w-5 h-5 text-[#FBD8B3]" />}
          votes={votes.optimizer.count}
          hasVoted={votes.optimizer.voted}
          onVote={handleVote}
          mockComponent={
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Budget Health Index</span>
                <span className="text-[#FBD8B3] font-bold">94% Optimal</span>
              </div>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/5">
                <div className="bg-[#A8E6CF] w-[50%]" title="Needs: 50%" />
                <div className="bg-[#C8B6FF] w-[30%]" title="Wants: 30%" />
                <div className="bg-[#FBD8B3] w-[20%]" title="Wishlist: 20%" />
              </div>
              <p className="text-[10px] font-mono text-slate-300">
                <span className="text-[#A8E6CF] font-bold">Tip:</span> Reallocate ₹2,400 surplus from Dining to Wishlist.
              </p>
            </div>
          }
        />

        {/* Card 3: Subscription & Anomaly Detector */}
        <FeatureCard
          id="subscriptions"
          title="Recurring Spends & Bill Surge Radar"
          badge="Heuristics"
          badgeColor="bg-[#C8B6FF]/15 text-[#C8B6FF] border border-[#C8B6FF]/30"
          description="Continuous temporal activity scans detect recurring subscription creep, unannounced price changes, and upcoming bill collisions."
          icon={<Repeat className="w-5 h-5 text-[#C8B6FF]" />}
          votes={votes.subscriptions.count}
          hasVoted={votes.subscriptions.voted}
          onVote={handleVote}
          mockComponent={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono bg-[#1A1835] px-2.5 py-1.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8B6FF]" />
                  <span className="text-slate-200">Fiber Internet Plan</span>
                </div>
                <span className="text-white font-bold">₹1,179 • In 4 days</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono bg-[#1A1835] px-2.5 py-1.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFB5A7]" />
                  <span className="text-slate-200">Streaming Premium</span>
                </div>
                <span className="text-[#FFB5A7] font-bold">+15% surge detected</span>
              </div>
            </div>
          }
        />

        {/* Card 4: Wishlist Accelerator */}
        <FeatureCard
          id="wishlist"
          title="Discretionary Spend Trade-off Simulator"
          badge="Algorithm"
          badgeColor="bg-[#FFB5A7]/15 text-[#FFB5A7] border border-[#FFB5A7]/30"
          description="Connects everyday micro-decisions with your top wishlist targets to illustrate how skipping small impulses accelerates your big goals."
          icon={<Compass className="w-5 h-5 text-[#FFB5A7]" />}
          votes={votes.wishlist.count}
          hasVoted={votes.wishlist.voted}
          onVote={handleVote}
          mockComponent={
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-300">
              <div className="p-1.5 rounded-lg bg-[#FFB5A7]/10 text-[#FFB5A7]">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-[10px] leading-tight">
                Skip 3 takeaway lunches this week to fund your <strong className="text-white">Sony WH-1000XM5</strong> 14 days earlier.
              </p>
            </div>
          }
        />
      </div>

      {/* Backend Architecture Note */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
        <p className="text-[11px] font-mono text-slate-400">
          Backend services for telemetry and aggregation are being prepared in <span className="text-slate-200">penne-service</span>.
        </p>
        <p className="text-[10px] font-mono text-slate-500">
          Deterministic Cadence workflows • Zero-based PostgreSQL rollup views
        </p>
      </div>
    </div>
  );
};
