import React from 'react';

export const UserHeaderSkeleton: React.FC = () => {
  return <div className="w-9 h-9 rounded-full bg-[#343060] border border-white/10 animate-pulse shrink-0" />;
};

export const StatCardsSkeleton: React.FC = () => {
  return (
    <div className="hero-apricot-card p-5 h-44 flex flex-col justify-between animate-pulse">
      <div className="h-3 w-28 bg-[#1A1835]/20 rounded" />
      <div className="h-8 w-44 bg-[#1A1835]/30 rounded-xl" />
      <div className="flex gap-4">
        <div className="h-4 w-24 bg-[#1A1835]/20 rounded" />
        <div className="h-4 w-24 bg-[#1A1835]/20 rounded" />
      </div>
    </div>
  );
};

export const PaymentLimitsSkeleton: React.FC = () => {
  return (
    <div className="velvet-card p-4 space-y-3.5 animate-pulse w-full">
      <div className="flex items-center justify-between">
        <div className="h-4 w-44 bg-[#3A3669] rounded" />
        <div className="h-3 w-20 bg-[#3A3669] rounded" />
      </div>
      <div className="bg-[#2D2954] border border-white/5 rounded-2xl p-3 h-16" />
      <div className="bg-[#2D2954] border border-white/5 rounded-2xl p-3 h-16" />
    </div>
  );
};

export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-2.5 animate-pulse w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="py-2.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-2xl bg-[#3A3669] shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-32 bg-[#3A3669] rounded" />
              <div className="h-3 w-24 bg-[#3A3669] rounded" />
            </div>
          </div>
          <div className="h-5 w-16 bg-[#3A3669] rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const BudgetOverviewSkeleton: React.FC = () => {
  return (
    <div className="velvet-card p-5 space-y-4 animate-pulse w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-[#3A3669] rounded" />
          <div className="h-6 w-36 bg-[#3A3669] rounded" />
        </div>
        <div className="h-7 w-20 bg-[#3A3669] rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
        <div className="h-10 bg-[#2D2954] rounded-xl" />
        <div className="h-10 bg-[#2D2954] rounded-xl" />
      </div>
    </div>
  );
};

export const CategoryListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3.5 animate-pulse w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="velvet-card p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-36 bg-[#3A3669] rounded" />
              <div className="h-3 w-24 bg-[#3A3669] rounded" />
            </div>
            <div className="h-5 w-16 bg-[#3A3669] rounded-full" />
          </div>
          <div className="h-3 w-full bg-[#1A1835] rounded-full" />
          <div className="grid grid-cols-3 gap-1.5">
            <div className="h-12 bg-[#2D2954] rounded-xl" />
            <div className="h-12 bg-[#2D2954] rounded-xl" />
            <div className="h-12 bg-[#2D2954] rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const UserProfileSkeleton: React.FC = () => {
  return (
    <div className="velvet-card p-4 sm:p-5 flex items-center gap-4 animate-pulse w-full">
      <div className="w-14 h-14 rounded-2xl bg-[#3A3669] shrink-0 aspect-square" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-32 bg-[#3A3669] rounded" />
        <div className="h-3 w-40 bg-[#3A3669] rounded" />
      </div>
    </div>
  );
};
