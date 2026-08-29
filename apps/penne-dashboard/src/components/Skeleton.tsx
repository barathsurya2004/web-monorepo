import React from 'react';

export const UserHeaderSkeleton: React.FC = () => {
  return <div className="w-7 h-7 rounded-full bg-[#2E2A27] animate-pulse shrink-0" />;
};

export const StatCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full animate-pulse">
      <div className="bg-[#24201D] border border-[#342F2C] rounded-3xl p-5 h-28 flex flex-col justify-between">
        <div className="h-3 w-20 bg-[#2E2A27] rounded" />
        <div className="h-7 w-32 bg-[#2E2A27] rounded-xl" />
        <div className="h-3 w-24 bg-[#2E2A27] rounded" />
      </div>
      <div className="bg-[#24201D] border border-[#342F2C] rounded-3xl p-5 h-28 flex flex-col justify-between">
        <div className="h-3 w-24 bg-[#2E2A27] rounded" />
        <div className="h-7 w-36 bg-[#2E2A27] rounded-xl" />
        <div className="h-3 w-28 bg-[#2E2A27] rounded" />
      </div>
    </div>
  );
};

export const PaymentLimitsSkeleton: React.FC = () => {
  return (
    <div className="bg-[#24201D] border border-[#38322E] rounded-3xl p-4 space-y-3.5 animate-pulse w-full">
      <div className="flex items-center justify-between">
        <div className="h-4 w-44 bg-[#2E2A27] rounded" />
        <div className="h-3 w-20 bg-[#2E2A27] rounded" />
      </div>
      <div className="bg-[#1A1715] border border-[#342F2C] rounded-2xl p-3 h-16" />
      <div className="bg-[#1A1715] border border-[#342F2C] rounded-2xl p-3 h-16" />
    </div>
  );
};

export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-2.5 animate-pulse w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#24201D] border border-[#342F2C] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-2xl bg-[#2E2A27] shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-32 bg-[#2E2A27] rounded" />
              <div className="h-3 w-24 bg-[#2E2A27] rounded" />
            </div>
          </div>
          <div className="h-5 w-16 bg-[#2E2A27] rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const BudgetOverviewSkeleton: React.FC = () => {
  return (
    <div className="bg-[#24201D] border border-[#3E3835] rounded-3xl p-5 space-y-4 animate-pulse w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2E2A27]" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-[#2E2A27] rounded" />
            <div className="h-3 w-40 bg-[#2E2A27] rounded" />
          </div>
        </div>
        <div className="h-5 w-16 bg-[#2E2A27] rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#342F2C]">
        <div className="h-14 bg-[#1A1715] rounded-2xl" />
        <div className="h-14 bg-[#1A1715] rounded-2xl" />
        <div className="h-14 bg-[#1A1715] rounded-2xl" />
      </div>
    </div>
  );
};

export const CategoryListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3.5 animate-pulse w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#24201D] border border-[#342F2C] rounded-3xl p-4 space-y-3.5">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-36 bg-[#2E2A27] rounded" />
              <div className="h-3 w-28 bg-[#2E2A27] rounded" />
            </div>
          </div>
          <div className="h-2 w-full bg-[#1A1715] rounded-full" />
          <div className="grid grid-cols-3 gap-1.5">
            <div className="h-12 bg-[#1A1715] rounded-2xl" />
            <div className="h-12 bg-[#1A1715] rounded-2xl" />
            <div className="h-12 bg-[#1A1715] rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const UserProfileSkeleton: React.FC = () => {
  return (
    <div className="bg-[#24201D] border border-[#342F2C] rounded-3xl p-6 text-center space-y-3 animate-pulse w-full">
      <div className="w-16 h-16 rounded-full bg-[#2E2A27] mx-auto" />
      <div className="h-5 w-32 bg-[#2E2A27] rounded mx-auto" />
      <div className="h-3 w-40 bg-[#2E2A27] rounded mx-auto" />
    </div>
  );
};

export const HeaderSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#1E1B19] border-b border-[#342F2C] px-4 pb-3.5 pt-[max(calc(env(safe-area-inset-top,0px)+0.875rem),1.25rem)] animate-pulse">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2E2A27]" />
          <div className="h-5 w-28 bg-[#2E2A27] rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-14 bg-[#2E2A27] rounded-full" />
          <div className="w-7 h-7 rounded-full bg-[#2E2A27]" />
        </div>
      </div>
    </div>
  );
};

export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-5 animate-pulse pb-28">
      <StatCardsSkeleton />
      <PaymentLimitsSkeleton />
      <TransactionListSkeleton count={4} />
    </div>
  );
};

export const BudgetPageSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-5 animate-pulse pb-28">
      <BudgetOverviewSkeleton />
      <div className="h-10 w-full bg-[#1A1715] border border-[#38322E] rounded-2xl" />
      <CategoryListSkeleton count={3} />
    </div>
  );
};

export const AccountSkeleton: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 animate-pulse pb-28 w-full">
      <UserProfileSkeleton />
      <PaymentLimitsSkeleton />
    </div>
  );
};

export const TransactionsPageSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-5 animate-pulse pb-28">
      <div className="flex items-center justify-between bg-[#24201D] border border-[#38322E] rounded-3xl p-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-[#2E2A27] rounded" />
          <div className="h-3 w-40 bg-[#2E2A27] rounded" />
        </div>
        <div className="h-9 w-20 bg-[#2E2A27] rounded-2xl" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-10 flex-1 bg-[#1A1715] border border-[#38322E] rounded-2xl" />
        <div className="h-10 w-24 bg-[#1A1715] border border-[#38322E] rounded-2xl" />
      </div>
      <TransactionListSkeleton count={5} />
    </div>
  );
};


