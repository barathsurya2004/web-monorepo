import React from 'react';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'pastelSage' | 'pastelRose' | 'pastelTerracotta' | 'ghost' | 'apple';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.97]';
  
  const variants = {
    primary: 'bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] font-black shadow-lg shadow-[#FBD8B3]/25 focus:ring-[#FBD8B3]',
    pastelSage: 'bg-[#A8E6CF] hover:bg-[#92d4bd] text-[#1A1835] shadow-md shadow-[#A8E6CF]/20 focus:ring-[#A8E6CF]',
    pastelRose: 'bg-[#FFB5A7] hover:bg-[#f29f8f] text-[#1A1835] shadow-md shadow-[#FFB5A7]/20 focus:ring-[#FFB5A7]',
    pastelTerracotta: 'bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] shadow-md shadow-[#FBD8B3]/20 focus:ring-[#FBD8B3]',
    secondary: 'bg-[#343060] hover:bg-[#3D3870] text-[#F5F3FF] focus:ring-white/20 border border-white/10 shadow-md',
    outline: 'border border-white/15 hover:bg-white/5 text-slate-200 focus:ring-white/20 backdrop-blur-sm',
    danger: 'bg-[#FFB5A7] hover:bg-[#f29f8f] text-[#1A1835] font-bold focus:ring-[#FFB5A7] shadow-md',
    ghost: 'hover:bg-white/5 text-slate-400 hover:text-white focus:ring-white/20',
    apple: 'bg-white hover:bg-slate-100 text-slate-950 font-semibold shadow-md focus:ring-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]'
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Card Component
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-[#343060] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/40 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-white/20 hover:scale-[1.01]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3.5 text-[#FBD8B3] pointer-events-none">{icon}</div>}
        <input
          className={`bg-[#232044] border ${error ? 'border-[#FFB5A7]' : 'border-white/10'} text-white placeholder-slate-400 text-base sm:text-sm rounded-2xl focus:outline-none focus:border-[#FBD8B3] focus:ring-2 focus:ring-[#FBD8B3]/20 ${icon ? 'pl-10' : 'px-4'} py-3 transition-all w-full min-h-[44px] shadow-inner font-mono ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-[#FFB5A7] font-medium">{error}</span>}
    </div>
  );
};

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase">{label}</label>}
      <select
        className={`bg-[#232044] border border-white/10 text-white text-base sm:text-sm rounded-2xl focus:outline-none focus:border-[#FBD8B3] focus:ring-2 focus:ring-[#FBD8B3]/20 px-4 py-3 transition-all w-full min-h-[44px] shadow-inner font-mono ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#232044] text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Badge Component
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'sage' | 'terracotta' | 'rose' | 'cream' | 'peach' | 'slate' | 'emerald' | 'amber' | 'indigo' | 'apple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const variants = {
    sage: 'bg-[#A8E6CF]/20 text-[#A8E6CF] border-[#A8E6CF]/35',
    terracotta: 'bg-[#FBD8B3]/20 text-[#FBD8B3] border-[#FBD8B3]/35',
    rose: 'bg-[#FFB5A7]/20 text-[#FFB5A7] border-[#FFB5A7]/35',
    cream: 'bg-[#FDE2B8]/20 text-[#FDE2B8] border-[#FDE2B8]/35',
    peach: 'bg-[#FBD8B3]/20 text-[#FBD8B3] border-[#FBD8B3]/35',
    slate: 'bg-white/5 text-slate-300 border-white/10',
    emerald: 'bg-[#A8E6CF]/20 text-[#A8E6CF] border-[#A8E6CF]/35',
    amber: 'bg-[#FDE2B8]/20 text-[#FDE2B8] border-[#FDE2B8]/35',
    indigo: 'bg-[#C8B6FF]/20 text-[#C8B6FF] border-[#C8B6FF]/35',
    apple: 'bg-white/10 text-white border-white/20'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border font-mono ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Segmented Control
export interface SegmentedControlProps {
  options: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeId: string;
  onChange: (id: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, activeId, onChange }) => {
  return (
    <div className="bg-[#232044] p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar">
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold font-mono transition-all duration-300 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-[#FBD8B3] text-[#1A1835] shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ProgressBar Component
export interface ProgressBarProps {
  value: number;
  colorVariant?: 'emerald' | 'amber' | 'rose' | 'indigo';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, colorVariant = 'emerald', className = '' }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  const colors = {
    emerald: 'bg-[#A8E6CF]',
    amber: 'bg-[#FDE2B8]',
    rose: 'bg-[#FFB5A7]',
    indigo: 'bg-[#C8B6FF]'
  };

  return (
    <div className={`w-full bg-[#1A1835] rounded-full h-2.5 overflow-hidden border border-white/10 ${className}`}>
      <div
        className={`h-full transition-all duration-500 rounded-full ${colors[colorVariant]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

// StatCard Component
export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'terracotta' | 'sage' | 'cream' | 'rose';
  accentColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'terracotta',
  accentColor,
  className = '',
  children
}) => {
  const borderAccents = {
    terracotta: 'border-l-[#FBD8B3] bg-gradient-to-br from-[#383364] to-[#2D2852]',
    sage: 'border-l-[#A8E6CF] bg-gradient-to-br from-[#2E3B3A] to-[#263131]',
    cream: 'border-l-[#FDE2B8] bg-gradient-to-br from-[#383428] to-[#2E2A20]',
    rose: 'border-l-[#FFB5A7] bg-gradient-to-br from-[#3B2D33] to-[#30242A]'
  };

  return (
    <Card className={`border-l-4 ${borderAccents[variant]} ${accentColor ? accentColor : ''} ${className}`}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase truncate">{title}</p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono truncate">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
        {icon && <div className="p-2.5 sm:p-3 bg-indigo-950/80 text-white rounded-2xl shadow-inner shrink-0 self-start border border-white/5">{icon}</div>}
      </div>
      {children && <div className="mt-3 pt-2.5 border-t border-white/10">{children}</div>}
    </Card>
  );
};

// Modal Component
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn pt-[max(env(safe-area-inset-top,0px),1rem)] pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
      <div className="bg-[#2C2856] border border-white/15 rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all max-h-[85dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#232044] shrink-0">
          <h3 className="text-base sm:text-lg font-extrabold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
