import React from 'react';

interface PageTagHeaderProps {
  title: string;
  dotColor?: string;
  badgeText?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export const PageTagHeader: React.FC<PageTagHeaderProps> = ({
  title,
  dotColor = '#C8B6FF',
  badgeText,
  rightContent,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between pb-1 min-w-0 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-2 h-2 rounded-full animate-pulse shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span
          className="text-[11px] font-mono uppercase tracking-widest font-bold truncate"
          style={{ color: dotColor }}
        >
          {title}
        </span>
      </div>
      {rightContent ? (
        <div className="shrink-0">{rightContent}</div>
      ) : badgeText ? (
        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 shrink-0">
          {badgeText}
        </span>
      ) : null}
    </div>
  );
};
